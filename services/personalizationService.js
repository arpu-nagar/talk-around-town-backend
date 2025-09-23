import { OpenAI } from 'openai';
import pool from '../config/db.js';
import {
    TIPS_SYSTEM_PROMPT,
    sanitizeTipText,
} from '../utils/parentingGuardrails.js';
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

class PersonalizationService {
    async generateTipEmbedding(tip) {
        try {
            // Cover both DB tips (title/description) and AI tips (title/body/details)
            const text = [tip.title, tip.description, tip.body, tip.details]
                .filter(Boolean)
                .join(' ');

            const response = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: text,
                encoding_format: 'float',
            });

            return response.data[0].embedding;
        } catch (error) {
            console.error('Error generating embedding:', error);
            throw error;
        }
    }

    async storeTipEmbedding(tipId, embedding) {
        try {
            const [existing] = await pool.query(
                'SELECT id FROM tip_embeddings WHERE tip_id = ?',
                [tipId],
            );

            if (existing.length > 0) {
                await pool.query(
                    'UPDATE tip_embeddings SET embedding = ?, updated_at = NOW() WHERE tip_id = ?',
                    [JSON.stringify(embedding), tipId],
                );
            } else {
                await pool.query(
                    'INSERT INTO tip_embeddings (tip_id, embedding) VALUES (?, ?)',
                    [tipId, JSON.stringify(embedding)],
                );
            }
        } catch (error) {
            console.error('Error storing embedding:', error);
            throw error;
        }
    }

    async getContextualPersonalizedTips(
        userId,
        query,
        limit = 10,
        contentPreferences = [],
    ) {
        try {
            console.log(
                `🔍 Getting contextual personalized tips for user ${userId} with query: "${query}"`,
            );

            // 1) Embed the user query
            const queryEmbedding = await this.generateQueryEmbedding(query);

            // 2) Load user preference profile (avg of likes minus dislike penalty, normalized)
            const [userProfile] = await pool.query(
                'SELECT preference_embedding FROM user_preference_profiles WHERE user_id = ?',
                [userId],
            );

            let userPreference = null;
            let hasPersonalization = false;
            if (userProfile.length > 0 && userProfile[0].preference_embedding) {
                if (typeof userProfile[0].preference_embedding === 'string') {
                    userPreference = JSON.parse(
                        userProfile[0].preference_embedding,
                    );
                } else if (Array.isArray(userProfile[0].preference_embedding)) {
                    userPreference = userProfile[0].preference_embedding;
                }
                hasPersonalization = true;
            }

            // 3) Optional dislike centroid (for penalty)
            let dislikeCentroid = null;
            try {
                const [dislikes] = await pool.query(
                    `
          SELECT te.embedding
          FROM user_tip_interactions uti
          JOIN tip_embeddings te ON uti.tip_id = te.tip_id
          WHERE uti.user_id = ? AND uti.interaction_type = 'dislike'
        `,
                    [userId],
                );

                if (dislikes.length) {
                    const vecs = dislikes.map(r =>
                        Array.isArray(r.embedding)
                            ? r.embedding
                            : JSON.parse(r.embedding),
                    );
                    const L = vecs[0].length;
                    dislikeCentroid = new Array(L).fill(0);
                    for (const v of vecs)
                        for (let i = 0; i < L; i++) dislikeCentroid[i] += v[i];
                    for (let i = 0; i < L; i++)
                        dislikeCentroid[i] /= vecs.length;
                }
            } catch {}

            // 4) Load embeddings for candidate tips, optionally filter by the selected areas
            const allowed = Array.isArray(contentPreferences)
                ? contentPreferences.filter(Boolean)
                : [];

            let sql = `
        SELECT te.tip_id, te.embedding, t.title, t.description, t.type
        FROM tip_embeddings te
        JOIN tips t ON te.tip_id = t.id
        WHERE te.tip_id NOT IN (
          SELECT DISTINCT tip_id 
          FROM user_tip_interactions 
          WHERE user_id = ? AND interaction_type IN ('like', 'dislike')
        )
      `;
            const params = [userId];

            if (allowed.length > 0) {
                const placeholders = allowed.map(() => '?').join(',');
                sql += ` AND t.type IN (${placeholders})`;
                params.push(...allowed);
            }

            const [tipEmbeddings] = await pool.query(sql, params);

            if (tipEmbeddings.length === 0) {
                console.log(`No available tips for user ${userId}`);
                return {
                    tips: [],
                    isPersonalized: hasPersonalization,
                    queryRelevance: true,
                    originalQuery: query,
                };
            }

            // 5) Score
            const recommendations = [];
            for (const tipEmbedding of tipEmbeddings) {
                try {
                    let embedding;
                    if (typeof tipEmbedding.embedding === 'string') {
                        embedding = JSON.parse(tipEmbedding.embedding);
                    } else if (Array.isArray(tipEmbedding.embedding)) {
                        embedding = tipEmbedding.embedding;
                    } else {
                        continue;
                    }
                    if (!Array.isArray(embedding) || embedding.length === 0)
                        continue;

                    const querySimilarity = this.cosineSimilarity(
                        queryEmbedding,
                        embedding,
                    );

                    let personalizedScore = 0.5;
                    if (hasPersonalization && userPreference) {
                        personalizedScore = this.cosineSimilarity(
                            userPreference,
                            embedding,
                        );
                    }

                    // Combined score with optional dislike penalty
                    const lambda = 0.25;
                    let combinedScore =
                        querySimilarity * 0.6 + personalizedScore * 0.4;
                    if (dislikeCentroid) {
                        const dislikeSim = this.cosineSimilarity(
                            dislikeCentroid,
                            embedding,
                        );
                        combinedScore -= lambda * Math.max(0, dislikeSim);
                    }

                    recommendations.push({
                        id: tipEmbedding.tip_id,
                        title: tipEmbedding.title,
                        body: tipEmbedding.description,
                        details: hasPersonalization
                            ? `Personalized ${tipEmbedding.type} tip for "${query}"`
                            : `${tipEmbedding.type} tip for "${query}"`,
                        audioUrl: null,
                        similarity_score:
                            Math.round(combinedScore * 1000) / 1000,
                        query_relevance:
                            Math.round(querySimilarity * 1000) / 1000,
                        personal_match:
                            Math.round(personalizedScore * 1000) / 1000,
                        categories: [tipEmbedding.type],
                    });
                } catch (error) {
                    console.error(
                        `Error processing tip ${tipEmbedding.tip_id}:`,
                        error.message,
                    );
                }
            }

            if (recommendations.length === 0) {
                console.log(`No valid recommendations for query: "${query}"`);
                return {
                    tips: [],
                    isPersonalized: hasPersonalization,
                    queryRelevance: true,
                    originalQuery: query,
                };
            }

            // 6) Sort and cut
            recommendations.sort(
                (a, b) => b.similarity_score - a.similarity_score,
            );
            const relevantTips = recommendations.filter(
                t => t.query_relevance > 0.3,
            );
            const finalTips = relevantTips.slice(0, limit);

            console.log(
                `✅ Found ${finalTips.length} contextual personalized tips for "${query}"`,
            );
            console.log(
                `   Top tip relevance: ${finalTips[0]?.query_relevance ?? 'N/A'}`,
            );
            console.log(
                `   Top tip personal match: ${finalTips[0]?.personal_match ?? 'N/A'}`,
            );

            return {
                tips: finalTips,
                isPersonalized: hasPersonalization,
                queryRelevance: true,
                originalQuery: query,
            };
        } catch (error) {
            console.error('Error getting contextual personalized tips:', error);
            throw error;
        }
    }

    async generateQueryEmbedding(query) {
        try {
            const response = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: query,
                encoding_format: 'float',
            });
            return response.data[0].embedding;
        } catch (error) {
            console.error('Error generating query embedding:', error);
            throw error;
        }
    }

    async generatePersonalizedTipsForQuery(
        userId,
        query,
        limit = 5,
        contentPreferences = [],
    ) {
        try {
            console.log(
                `🎯 Generating personalized tips for user ${userId} with query: "${query}"`,
            );

            // Preference profile
            const [userProfile] = await pool.query(
                'SELECT preference_embedding FROM user_preference_profiles WHERE user_id = ?',
                [userId],
            );

            let userPreference = null;
            let hasPersonalization = false;
            if (userProfile.length > 0 && userProfile[0].preference_embedding) {
                if (typeof userProfile[0].preference_embedding === 'string') {
                    userPreference = JSON.parse(
                        userProfile[0].preference_embedding,
                    );
                } else if (Array.isArray(userProfile[0].preference_embedding)) {
                    userPreference = userProfile[0].preference_embedding;
                }
                hasPersonalization = true;
            }

            // Optional dislike centroid for penalty
            let dislikeCentroid = null;
            try {
                const [dislikes] = await pool.query(
                    `
          SELECT te.embedding
          FROM user_tip_interactions uti
          JOIN tip_embeddings te ON uti.tip_id = te.tip_id
          WHERE uti.user_id = ? AND uti.interaction_type = 'dislike'
        `,
                    [userId],
                );

                if (dislikes.length) {
                    const vecs = dislikes.map(r =>
                        Array.isArray(r.embedding)
                            ? r.embedding
                            : JSON.parse(r.embedding),
                    );
                    const L = vecs[0].length;
                    dislikeCentroid = new Array(L).fill(0);
                    for (const v of vecs)
                        for (let i = 0; i < L; i++) dislikeCentroid[i] += v[i];
                    for (let i = 0; i < L; i++)
                        dislikeCentroid[i] /= vecs.length;
                }
            } catch {}

            // Analyze likes for a short natural-language context
            let preferenceContext = '';
            if (hasPersonalization) {
                preferenceContext = await this.analyzeUserPreferences(userId);
            }

            // Generate candidates via AI (focused by contentPreferences)
            const generatedTips = await this.generateTipsWithAI(
                query,
                preferenceContext,
                limit * 2,
                contentPreferences,
            );
            if (!generatedTips || generatedTips.length === 0) {
                console.log(`❌ No tips generated for query: "${query}"`);
                return { tips: [], isPersonalized: false, isGenerated: true };
            }

            // Score generated tips against userPreference + dislike penalty
            const scoredTips = [];
            for (const tip of generatedTips) {
                try {
                    const tipEmbedding = await this.generateTipEmbedding(tip);

                    let personalizedScore = 0.5;
                    if (hasPersonalization && userPreference) {
                        personalizedScore = this.cosineSimilarity(
                            userPreference,
                            tipEmbedding,
                        );
                    }

                    const lambda = 0.25;
                    let finalScore = personalizedScore;
                    if (dislikeCentroid) {
                        const dislikeSim = this.cosineSimilarity(
                            dislikeCentroid,
                            tipEmbedding,
                        );
                        finalScore -= lambda * Math.max(0, dislikeSim);
                    }

                    scoredTips.push({
                        ...tip,
                        personal_match: Math.round(finalScore * 1000) / 1000,
                        similarity_score: finalScore,
                        query_relevance: 1.0,
                        isGenerated: true,
                    });
                } catch (err) {
                    console.error(`Error processing generated tip:`, err);
                }
            }

            scoredTips.sort((a, b) => b.personal_match - a.personal_match);
            const finalTips = scoredTips.slice(0, limit);

            console.log(
                `✅ Generated ${finalTips.length} personalized tips for "${query}"`,
            );
            if (finalTips.length > 0) {
                console.log(
                    `   Best match score: ${finalTips[0].personal_match}`,
                );
                console.log(
                    `   Worst match score: ${finalTips[finalTips.length - 1].personal_match}`,
                );
            }

            return {
                tips: finalTips,
                isPersonalized: hasPersonalization,
                isGenerated: true,
                originalQuery: query,
                preferenceContext,
            };
        } catch (error) {
            console.error('Error generating personalized tips:', error);
            throw error;
        }
    }

    async analyzeUserPreferences(userId) {
        try {
            const [likedTips] = await pool.query(
                `
        SELECT t.title, t.description, t.type
        FROM user_tip_interactions uti
        JOIN tips t ON uti.tip_id = t.id
        WHERE uti.user_id = ? AND uti.interaction_type = 'like'
        ORDER BY uti.created_at DESC
        LIMIT 10
      `,
                [userId],
            );

            if (likedTips.length === 0) return '';

            const preferences = [];
            const categories = {};

            likedTips.forEach(tip => {
                categories[tip.type] = (categories[tip.type] || 0) + 1;

                const text = `${tip.title} ${tip.description}`.toLowerCase();
                if (
                    text.includes('outdoor') ||
                    text.includes('active') ||
                    text.includes('play')
                ) {
                    preferences.push('active/outdoor activities');
                }
                if (
                    text.includes('calm') ||
                    text.includes('quiet') ||
                    text.includes('gentle')
                ) {
                    preferences.push('calm/gentle approaches');
                }
                if (
                    text.includes('creative') ||
                    text.includes('art') ||
                    text.includes('imagination')
                ) {
                    preferences.push('creative activities');
                }
                if (
                    text.includes('routine') ||
                    text.includes('structure') ||
                    text.includes('schedule')
                ) {
                    preferences.push('structured routines');
                }
                if (
                    text.includes('independent') ||
                    text.includes('choice') ||
                    text.includes('decide')
                ) {
                    preferences.push('child independence');
                }
            });

            const topCategories = Object.entries(categories)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([cat]) => cat);

            const uniquePreferences = [...new Set(preferences)].slice(0, 4);

            let context = `Based on your liked tips, you prefer: `;
            if (topCategories.length > 0)
                context += `${topCategories.join(', ')} activities. `;
            if (uniquePreferences.length > 0)
                context += `You like approaches that involve ${uniquePreferences.join(', ')}.`;

            console.log(`📊 User preference context: ${context}`);
            return context;
        } catch (error) {
            console.error('Error analyzing user preferences:', error);
            return '';
        }
    }

    async generateTipsWithAI(
        query,
        preferenceContext = '',
        count = 10,
        contentPreferences = [],
    ) {
        const maxRetries = 3;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(
                    `🤖 AI generation attempt ${attempt}/${maxRetries} for query: "${query}"`,
                );

                let prompt = `Generate ${count} practical, specific parenting tips about "${query}".`;

                if (
                    Array.isArray(contentPreferences) &&
                    contentPreferences.length
                ) {
                    console.log('contentPreferences', contentPreferences);
                    let description = '';
                    if (contentPreferences.includes('Language Development')) {
                        description +=
                            '\n - Activities and tips that encourage vocabulary growth, communication skills, and language patterns.';
                    }
                    if (contentPreferences.includes('Early Science Skills')) {
                        description +=
                            '\n - Explorations and experiments that nurture curiosity, critical thinking, and understanding of the world.';
                    }
                    if (contentPreferences.includes('Literacy Foundations')) {
                        description +=
                            '\n - Reading and writing activities that build pre-literacy skills and foster a love for stories and books.';
                    }
                    if (
                        contentPreferences.includes('Social-Emotional Learning')
                    ) {
                        description +=
                            '\n - Guidance for developing emotional intelligence, relationship skills, and healthy self-awareness.';
                    }

                    console.log("description", description)
                    prompt += `\n\nYour response should be STRICTLY around the following: ${description}.`;
                }
                if (preferenceContext) {
                    prompt += `\n\n Preference Context: ${preferenceContext}.\nPlease tailor the tips to match the Preference Context.`;
                }

                prompt += `
                  Each tip should be:
                  - Practical and actionable
                  - Age-appropriate for toddlers/children
                  - Safe and positive
                  - Different from each other
                
                  Return the response as a JSON array with this exact format:
                  [
                    {
                      "id": 1,
                      "title": "Short catchy title",
                      "body": "Main tip content (2-3 sentences)",
                      "details": "Additional helpful details or explanation",
                      "categories": ["relevant_category"]
                    }
                  ]
                  Focus specifically on "${query}" and make each tip unique and useful.
                `;

                // Add timeout and better error handling
                const response = await Promise.race([
                    openai.chat.completions.create({
                        model: process.env.OPENAI_TIPS_MODEL || 'gpt-3.5-turbo', // Changed from gpt-4o-mini
                        messages: [
                            {
                                role: 'system',
                                content: `${TIPS_SYSTEM_PROMPT}\n\nIMPORTANT: You must return ONLY valid JSON. No markdown, no explanations, no code blocks. Just a pure JSON array.`,
                            },
                            { role: 'user', content: prompt },
                        ],
                        temperature: 0.3, // Lower temperature for more consistent output
                        max_tokens: 1500, // Reduced to prevent timeouts
                        // Remove response_format for now to avoid issues
                    }),
                    // 25 second timeout
                    new Promise((_, reject) =>
                        setTimeout(
                            () =>
                                reject(
                                    new Error(
                                        'OpenAI request timeout after 25 seconds',
                                    ),
                                ),
                            25000,
                        ),
                    ),
                ]);

                const raw = (
                    response.choices?.[0]?.message?.content || ''
                ).trim();
                console.log('🤖 Raw OpenAI response length:', raw.length);
                console.log(
                    '🤖 Raw OpenAI response preview:',
                    raw.substring(0, 200) + '...',
                );

                if (!raw) {
                    throw new Error('Empty response from OpenAI');
                }

                // ROBUST JSON PARSING with multiple fallback strategies
                let parsed;
                try {
                    // Strategy 1: Direct parse
                    parsed = JSON.parse(raw);
                    console.log('✅ Direct JSON parse successful');
                } catch (parseError) {
                    console.log(
                        '⚠️ Direct JSON parse failed, trying fallbacks...',
                    );

                    try {
                        // Strategy 2: Extract JSON array with regex
                        const jsonMatch = raw.match(/\[[\s\S]*\]/);
                        if (jsonMatch) {
                            parsed = JSON.parse(jsonMatch[0]);
                            console.log('✅ Regex JSON extraction successful');
                        } else {
                            throw new Error('No JSON array found in response');
                        }
                    } catch (regexError) {
                        console.log(
                            '⚠️ Regex extraction failed, trying repair...',
                        );

                        try {
                            // Strategy 3: Attempt to repair common JSON issues
                            let repairedJson = raw;

                            // Remove markdown code blocks if present
                            repairedJson = repairedJson
                                .replace(/```json\s*/g, '')
                                .replace(/```\s*/g, '');

                            // Remove any text before the first [
                            const firstBracket = repairedJson.indexOf('[');
                            if (firstBracket > 0) {
                                repairedJson =
                                    repairedJson.substring(firstBracket);
                            }

                            // Remove any text after the last ]
                            const lastBracket = repairedJson.lastIndexOf(']');
                            if (lastBracket > 0) {
                                repairedJson = repairedJson.substring(
                                    0,
                                    lastBracket + 1,
                                );
                            }

                            // Try to fix common JSON issues
                            repairedJson = repairedJson
                                .replace(/,\s*}/g, '}') // Remove trailing commas before }
                                .replace(/,\s*]/g, ']') // Remove trailing commas before ]
                                .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
                                .replace(
                                    /:\s*([^",\[\]{}]+)([,}\]])/g,
                                    ': "$1"$2',
                                ); // Quote unquoted string values

                            parsed = JSON.parse(repairedJson);
                            console.log('✅ JSON repair successful');
                        } catch (repairError) {
                            console.error(
                                '❌ All JSON parsing strategies failed',
                            );
                            console.error(
                                'Original parse error:',
                                parseError.message,
                            );
                            console.error('Regex error:', regexError.message);
                            console.error('Repair error:', repairError.message);
                            console.error('Raw response that failed:', raw);

                            // Return fallback tips instead of crashing
                            console.log(
                                '🛡️ Returning fallback tips due to JSON parse failure',
                            );
                            return this.generateFallbackTips(query, count);
                        }
                    }
                }

                // Validate the parsed result
                const tipsArray = Array.isArray(parsed)
                    ? parsed
                    : parsed.tips || [];
                if (!Array.isArray(tipsArray) || tipsArray.length === 0) {
                    throw new Error(
                        'Parsed response does not contain a valid tips array',
                    );
                }

                // Format the tips
                const formattedTips = tipsArray.map((tip, index) => ({
                    id: `generated_${Date.now()}_${index}`,
                    title: tip.title || `Tip ${index + 1}`,
                    body: tip.body || tip.description || '',
                    details: tip.details || `AI-generated tip about ${query}`,
                    audioUrl: null,
                    categories: tip.categories || ['generated'],
                }));

                console.log(
                    `✅ Successfully generated ${formattedTips.length} AI tips for "${query}"`,
                );
                const cleanTips = formattedTips.map(t => ({
                    ...t,
                    title: sanitizeTipText(t.title),
                    body: sanitizeTipText(t.body),
                    details: sanitizeTipText(t.details),
                }));

                return cleanTips;
            } catch (error) {
                console.error(
                    `❌ AI generation attempt ${attempt} failed:`,
                    error.message,
                );
                lastError = error;

                // Don't retry on certain errors
                if (
                    error.message.includes('rate limit') ||
                    error.message.includes('quota')
                ) {
                    console.log('🚫 Rate limit hit, not retrying');
                    break;
                }

                // Wait before retry (exponential backoff)
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                    console.log(`⏳ Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        console.error(`💥 All AI generation attempts failed for "${query}"`);
        console.error('Last error:', lastError?.message);

        // Return fallback tips instead of throwing
        console.log('🛡️ Returning fallback tips as last resort');
        return this.generateFallbackTips(query, count);
    }
    generateFallbackTips(query, count = 5) {
        const fallbackTips = [
            {
                id: `fallback_${Date.now()}_1`,
                title: `Getting Started with ${query}`,
                body: `Here are some gentle approaches to help with ${query}. Start slowly and be patient with yourself and your child.`,
                details: `Every child is different, so find what works best for your family when dealing with ${query}.`,
                audioUrl: null,
                categories: ['general'],
            },
            {
                id: `fallback_${Date.now()}_2`,
                title: `Making ${query} Easier`,
                body: `Try breaking down ${query} into smaller, manageable steps. This can make the process less overwhelming for both you and your child.`,
                details: `Consistency and routine can be very helpful when working on ${query} with children.`,
                audioUrl: null,
                categories: ['general'],
            },
        ];

        return fallbackTips.slice(0, count);
    }

    async trackUserInteraction(userId, tipId, interactionType) {
        try {
            console.log('🔍 trackUserInteraction called with:', {
                userId,
                tipId,
                interactionType,
            });

            // Verify tip & user
            const [tipExists] = await pool.query(
                'SELECT id FROM tips WHERE id = ?',
                [tipId],
            );
            if (tipExists.length === 0)
                throw new Error(`Tip with ID ${tipId} does not exist`);

            const [userExists] = await pool.query(
                'SELECT id FROM users WHERE id = ?',
                [userId],
            );
            if (userExists.length === 0)
                throw new Error(`User with ID ${userId} does not exist`);

            // Apply interaction logic (like ↔ dislike mutual exclusion)
            if (interactionType === 'like') {
                await pool.query(
                    'DELETE FROM user_tip_interactions WHERE user_id = ? AND tip_id = ? AND interaction_type = "dislike"',
                    [userId, tipId],
                );
                await pool.query(
                    'INSERT IGNORE INTO user_tip_interactions (user_id, tip_id, interaction_type) VALUES (?, ?, "like")',
                    [userId, tipId],
                );
            } else if (interactionType === 'dislike') {
                await pool.query(
                    'DELETE FROM user_tip_interactions WHERE user_id = ? AND tip_id = ? AND interaction_type = "like"',
                    [userId, tipId],
                );
                await pool.query(
                    'INSERT IGNORE INTO user_tip_interactions (user_id, tip_id, interaction_type) VALUES (?, ?, "dislike")',
                    [userId, tipId],
                );
            } else if (interactionType === 'save') {
                await pool.query(
                    'INSERT IGNORE INTO user_tip_interactions (user_id, tip_id, interaction_type) VALUES (?, ?, "save")',
                    [userId, tipId],
                );
            } else if (interactionType === 'unsave') {
                await pool.query(
                    'DELETE FROM user_tip_interactions WHERE user_id = ? AND tip_id = ? AND interaction_type = "save"',
                    [userId, tipId],
                );
            }

            // Refresh preference profile
            await this.updateUserPreferenceProfile(userId);
            console.log('🎉 trackUserInteraction completed successfully');
        } catch (error) {
            console.error('❌ Error in trackUserInteraction:', error);
            throw error;
        }
    }

    cosineSimilarity(vecA, vecB) {
        if (vecA.length !== vecB.length) {
            throw new Error('Vectors must have the same length');
        }

        let dot = 0,
            na = 0,
            nb = 0;
        for (let i = 0; i < vecA.length; i++) {
            const a = vecA[i];
            const b = vecB[i];
            dot += a * b;
            na += a * a;
            nb += b * b;
        }
        const denom = Math.sqrt(na) * Math.sqrt(nb);
        return denom ? dot / denom : 0;
    }

    async updateUserPreferenceProfile(userId) {
        try {
            const [likes] = await pool.query(
                `
        SELECT te.embedding
        FROM user_tip_interactions uti
        JOIN tip_embeddings te ON uti.tip_id = te.tip_id
        WHERE uti.user_id = ? AND uti.interaction_type = 'like'
      `,
                [userId],
            );

            const [dislikes] = await pool.query(
                `
        SELECT te.embedding
        FROM user_tip_interactions uti
        JOIN tip_embeddings te ON uti.tip_id = te.tip_id
        WHERE uti.user_id = ? AND uti.interaction_type = 'dislike'
      `,
                [userId],
            );

            if (likes.length === 0 && dislikes.length === 0) {
                await pool.query(
                    `UPDATE user_preference_profiles 
           SET total_interactions = 0, last_updated = NOW() 
           WHERE user_id = ?`,
                    [userId],
                );
                return;
            }

            const toVecs = rows =>
                rows.map(r =>
                    Array.isArray(r.embedding)
                        ? r.embedding
                        : JSON.parse(r.embedding),
                );

            const likeVecs = toVecs(likes);
            const dislikeVecs = toVecs(dislikes);

            const avg = vecs => {
                if (!vecs.length) return null;
                const L = vecs[0].length;
                const out = new Array(L).fill(0);
                for (const v of vecs)
                    for (let i = 0; i < L; i++) out[i] += v[i];
                for (let i = 0; i < L; i++) out[i] /= vecs.length;
                return out;
            };

            const likeAvg = avg(likeVecs);
            const dislikeAvg = avg(dislikeVecs);

            // preference = likeAvg − α * dislikeAvg (normalized)
            const alpha = 0.6;
            let pref = likeAvg || dislikeAvg;
            if (likeAvg && dislikeAvg) {
                pref = likeAvg.map((x, i) => x - alpha * dislikeAvg[i]);
            }

            const norm = Math.sqrt(pref.reduce((s, x) => s + x * x, 0)) || 1;
            const prefNorm = pref.map(x => x / norm);

            const total = likeVecs.length + dislikeVecs.length;

            const [existing] = await pool.query(
                'SELECT id FROM user_preference_profiles WHERE user_id = ?',
                [userId],
            );

            if (existing.length) {
                await pool.query(
                    `UPDATE user_preference_profiles 
           SET preference_embedding = ?, total_interactions = ?, last_updated = NOW()
           WHERE user_id = ?`,
                    [JSON.stringify(prefNorm), total, userId],
                );
            } else {
                await pool.query(
                    `INSERT INTO user_preference_profiles (user_id, preference_embedding, total_interactions)
           VALUES (?, ?, ?)`,
                    [userId, JSON.stringify(prefNorm), total],
                );
            }
        } catch (err) {
            console.error('Error updating preference profile:', err);
            throw err;
        }
    }

    async getPersonalizedTips(userId, limit = 10) {
        try {
            const [profile] = await pool.query(
                'SELECT preference_embedding FROM user_preference_profiles WHERE user_id = ?',
                [userId],
            );

            if (profile.length === 0) {
                console.log(
                    `No preference profile found for user ${userId}, falling back to popular tips`,
                );
                return await this.getPopularTips(limit);
            }

            let userPreference;
            if (typeof profile[0].preference_embedding === 'string') {
                userPreference = JSON.parse(profile[0].preference_embedding);
            } else if (Array.isArray(profile[0].preference_embedding)) {
                userPreference = profile[0].preference_embedding;
            } else {
                console.log(
                    `Invalid preference embedding type for user ${userId}, falling back to popular tips`,
                );
                return await this.getPopularTips(limit);
            }

            // Optional dislike centroid
            let dislikeCentroid = null;
            try {
                const [dislikes] = await pool.query(
                    `
          SELECT te.embedding
          FROM user_tip_interactions uti
          JOIN tip_embeddings te ON uti.tip_id = te.tip_id
          WHERE uti.user_id = ? AND uti.interaction_type = 'dislike'
        `,
                    [userId],
                );

                if (dislikes.length) {
                    const vecs = dislikes.map(r =>
                        Array.isArray(r.embedding)
                            ? r.embedding
                            : JSON.parse(r.embedding),
                    );
                    const L = vecs[0].length;
                    dislikeCentroid = new Array(L).fill(0);
                    for (const v of vecs)
                        for (let i = 0; i < L; i++) dislikeCentroid[i] += v[i];
                    for (let i = 0; i < L; i++)
                        dislikeCentroid[i] /= vecs.length;
                }
            } catch {}

            const [tipEmbeddings] = await pool.query(
                `
        SELECT te.tip_id, te.embedding, t.title, t.description, t.type
        FROM tip_embeddings te
        JOIN tips t ON te.tip_id = t.id
        WHERE te.tip_id NOT IN (
          SELECT DISTINCT tip_id 
          FROM user_tip_interactions 
          WHERE user_id = ? AND interaction_type IN ('like', 'dislike')
        )
      `,
                [userId],
            );

            if (tipEmbeddings.length === 0) {
                console.log(
                    `No available tips for user ${userId}, returning empty array`,
                );
                return [];
            }

            const recommendations = [];
            for (const tipEmbedding of tipEmbeddings) {
                try {
                    let embedding;
                    if (typeof tipEmbedding.embedding === 'string') {
                        embedding = JSON.parse(tipEmbedding.embedding);
                    } else if (Array.isArray(tipEmbedding.embedding)) {
                        embedding = tipEmbedding.embedding;
                    } else {
                        continue;
                    }
                    if (!Array.isArray(embedding) || embedding.length === 0)
                        continue;

                    const similarity = this.cosineSimilarity(
                        userPreference,
                        embedding,
                    );

                    // Apply dislike penalty for ranking
                    const lambda = 0.25;
                    let finalScore = similarity;
                    if (dislikeCentroid) {
                        const dislikeSim = this.cosineSimilarity(
                            dislikeCentroid,
                            embedding,
                        );
                        finalScore -= lambda * Math.max(0, dislikeSim);
                    }

                    recommendations.push({
                        id: tipEmbedding.tip_id,
                        title: tipEmbedding.title,
                        body: tipEmbedding.description,
                        details: `Personalized ${tipEmbedding.type} tip based on your preferences`,
                        audioUrl: null,
                        similarity_score: Math.round(finalScore * 1000) / 1000, // penalized score
                        categories: [tipEmbedding.type],
                    });
                } catch (error) {
                    console.error(
                        `Error processing tip ${tipEmbedding.tip_id}:`,
                        error.message,
                    );
                }
            }

            if (recommendations.length === 0) {
                console.log(
                    `No valid recommendations generated for user ${userId}, falling back to popular tips`,
                );
                return await this.getPopularTips(limit);
            }

            recommendations.sort(
                (a, b) => b.similarity_score - a.similarity_score,
            );
            return recommendations.slice(0, limit);
        } catch (error) {
            console.error('Error getting personalized tips:', error);
            return await this.getPopularTips(limit);
        }
    }

    async getPopularTips(limit = 10) {
        try {
            const [tips] = await pool.query(
                `
        SELECT t.id, t.title, t.description as body, t.type,
               COALESCE(interaction_count, 0) as popularity
        FROM tips t
        LEFT JOIN (
          SELECT tip_id, COUNT(*) as interaction_count
          FROM user_tip_interactions 
          WHERE interaction_type = 'like'
          GROUP BY tip_id
        ) interactions ON t.id = interactions.tip_id
        ORDER BY popularity DESC, t.id
        LIMIT ?
      `,
                [limit],
            );

            return tips.map(tip => ({
                id: tip.id,
                title: tip.title,
                body: tip.body,
                details: `Popular ${tip.type} tip`,
                audioUrl: null,
                categories: [tip.type],
                similarity_score: 0.5,
            }));
        } catch (error) {
            console.error('Error getting popular tips:', error);
            return [];
        }
    }

    async processAllExistingTips() {
        try {
            const [tips] = await pool.query(
                `
        SELECT t.id, t.title, t.description 
        FROM tips t
        LEFT JOIN tip_embeddings te ON t.id = te.tip_id
        WHERE te.tip_id IS NULL
      `,
            );

            console.log(`Processing ${tips.length} tips for embeddings...`);

            for (const tip of tips) {
                try {
                    const embedding = await this.generateTipEmbedding(tip);
                    await this.storeTipEmbedding(tip.id, embedding);
                    console.log(`✅ Processed tip ${tip.id}: ${tip.title}`);
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    console.error(`❌ Failed to process tip ${tip.id}:`, error);
                }
            }

            console.log('🎉 Finished processing all tips');
            return tips.length;
        } catch (error) {
            console.error('Error processing tips batch:', error);
            throw error;
        }
    }
}

export default new PersonalizationService();

// Strict domain definitions - ONLY these 4 domains are allowed

// Child-related terms required for any query to pass scope check
const CHILD_TERMS = [
  'baby', 'infant', 'newborn', 'toddler', 'preschool', 'kid', 'kids',
  'child', 'children', 'little one', 'my son', 'my daughter', 'my boy',
  'my girl', 'my kid', 'my child', 'my toddler', 'my baby',
  '1-year-old', '2-year-old', '3-year-old', '4-year-old', '5-year-old',
  '1 year old', '2 year old', '3 year old', '4 year old', '5 year old',
  '1 years old', '2 years old', '3 years old', '4 years old', '5 years old',
  '1yo', '2yo', '3yo', '4yo', '5yo',
  '18 month', '24 month', '36 month',
  '18 months', '24 months', '36 months',
];

// Age regex patterns to catch formats like "2 years old", "18 months old", "3yr", etc.
const CHILD_AGE_PATTERNS = [
  /\b\d{1,2}\s?(?:yo|yr|yrs|years?\s*old)\b/i,
  /\b\d{1,2}\s?(?:months?)\s*old\b/i,
  /\b\d{1,2}\s?[-\s]year[-\s]old\b/i,
  /focus\s+on\s*:/i,  // app-injected child context: "Focus on: Pras: 2 years old"
];

export const ALLOWED_DOMAINS = {
    'Language Development': {
      keywords: [
        'talk', 'speak', 'language', 'vocabulary', 'word', 'communicate',
        'conversation', 'speech', 'verbal', 'storytelling', 'listening',
        'pronunciation', 'bilingual', 'reading aloud', 'narration',
        'questions', 'describing', 'rhyme', 'song', 'singing'
      ],
      patterns: [
        /\b(language|speech|talk|word|vocabulary|communicate)\b/i,
        /\b(storytelling|narrat|conversation|verbal)\b/i,
        /\b(bilingual|pronunciation|listening)\b/i
      ]
    },
    'Early Science Skills': {
      keywords: [
        'science', 'experiment', 'explore', 'discover', 'observe', 'investigate',
        'nature', 'plants', 'animals', 'weather', 'seasons', 'biology',
        'physics', 'chemistry', 'stem', 'curiosity', 'wonder', 'hypothesis',
        'predict', 'measure', 'compare', 'classify', 'scientific'
      ],
      patterns: [
        /\b(science|experiment|stem|discover|observe)\b/i,
        /\b(nature|plants?|animals?|weather|seasons?)\b/i,
        /\b(hypothesis|predict|measure|investigate)\b/i
      ]
    },
    'Literacy Foundations': {
      keywords: [
        'read', 'reading', 'book', 'letter', 'alphabet', 'phonics', 'literacy',
        'writing', 'story', 'print', 'text', 'comprehension', 'author',
        'illustration', 'library', 'spell', 'recognize', 'sight word',
        'pre-reading', 'emergent literacy', 'print awareness'
      ],
      patterns: [
        /\b(read|literacy|book|story|letter|alphabet)\b/i,
        /\b(phonics|writing|spell|print|text)\b/i,
        /\b(comprehension|sight word|pre-reading)\b/i
      ]
    },
    'Social-Emotional Learning': {
      keywords: [
        'emotion', 'feeling', 'empathy', 'social', 'friend', 'share', 'turn-taking',
        'cooperation', 'kindness', 'self-regulation', 'calm', 'upset', 'angry',
        'sad', 'happy', 'scared', 'frustrated', 'conflict', 'resolution',
        'relationship', 'self-awareness', 'self-control', 'coping', 'mindfulness',
        'patience', 'understanding', 'compassion', 'jealous', 'proud'
      ],
      patterns: [
        /\b(emotion|feeling|empathy|social|friend)\b/i,
        /\b(share|sharing|turn-taking|cooperation|kindness)\b/i,
        /\b(self-regulation|calm|upset|angry|sad|frustrated)\b/i,
        /\b(conflict|relationship|coping|mindfulness)\b/i
      ]
    }
  };
  
  // Topics explicitly OUT of scope (reject immediately)
  const OUT_OF_SCOPE_TOPICS = [
    // Behavioral/discipline (not in our domains)
    /\b(discipline|punishment|consequence|timeout|reward|chart|behavior modification)\b/i,
    /\b(tantrum|meltdown|defiance|backtalk|hitting|biting|kicking)\b/i,
    
    // Sleep (not in our domains)
    /\b(sleep|bedtime|nap|nighttime|wake|insomnia)\b/i,
    
    // Eating/nutrition (not in our domains)
    /\b(eating|food|meal|nutrition|picky eater|snack|diet|feeding)\b/i,
    
    // Potty training (not in our domains)
    /\b(potty|toilet|diaper|bathroom|pee|poop|training)\b/i,
    
    // Screen time (not in our domains)
    /\b(screen time|tablet|ipad|tv|television|video game|youtube)\b/i,
    
    // Homework/school admin (not in our domains)
    /\b(homework|grade|test|quiz|school meeting|teacher conference)\b/i,
    
    // Travel/logistics (not in our domains)
    /\b(travel|vacation|flight|hotel|car seat|stroller)\b/i,
    
    // Drugs / substances (never allowed)
    /\b(cocaine|heroin|meth(amphetamine)?|fentanyl|mdma|lsd|ecstasy|weed|marijuana|cannabis|opioid|crack|xanax|adderall|drug|narcotics?|overdose|vape|vaping)\b/i,

  // Violence / weapons (never allowed)
    /\b(beat|hit|harm|hurt|kill|murder|shoot|stab|gun|weapon|bomb|assault|abuse|trafficking|punish|spank|slap|smack|choke|strangle)\b/i,

  // Adult / sexual (never allowed)
    /\b(porn|sex(?:ual)?|nude|naked|onlyfans|fetish|masturbat)\b/i,

  // Self-harm (never allowed)
    /\b(suicide|self[-\s]?harm|kill myself|end my life)\b/i,

  // Medical/health (never allowed - legal risk)
    /\b(diagnos|symptom|treatment|medicine|medication|doctor|illness|disease|injury|medical)\b/i,
    /\b(fever|rash|cough|cold|flu|allergy|asthma|adhd|autism|delay)\b/i,
    
    // Financial/legal (never allowed)
    /\b(custody|divorce|lawyer|legal|court|financial|money|budget|cost)\b/i,
    
    // Adult topics
    /\b(sex|dating|relationship with partner|marriage counseling)\b/i
  ];
  
  // Matches the canonical query format the app teaches: "tips for [name] at/during/while/after [place/activity]"
  const CANONICAL_QUERY_PATTERN = /\btips?\s+for\s+\w[\w\s]*?\s+(at|during|while|after|before|around|near|on|in)\s+\w/i;

  export function isStrictlyInScope(query, approvedActivities = []) {
    const q = String(query || '').toLowerCase();

    // 1. Hard-reject explicit out-of-scope topics first — nothing bypasses these.
    for (const pattern of OUT_OF_SCOPE_TOPICS) {
      if (pattern.test(q)) {
        return {
          isValid: false,
          reason: 'out_of_scope',
          message: 'This topic is outside our 4 core domains: Language Development, Early Science Skills, Literacy Foundations, and Social-Emotional Learning.'
        };
      }
    }

    // 2. If query matches the canonical "tips for [name] at [place]" format, allow immediately.
    //    Hard-rejects already ran above, so this can't be abused.
    if (CANONICAL_QUERY_PATTERN.test(query)) {
      return { isValid: true, domain: 'custom', confidence: 10, whitelisted: true };
    }

    // 3. If query contains a supported/approved activity, allow it through immediately.
    if (approvedActivities.length > 0) {
      const containsApproved = approvedActivities.some(activity =>
        q.includes(activity.toLowerCase())
      );
      if (containsApproved) {
        return { isValid: true, domain: 'custom', confidence: 10, whitelisted: true };
      }
    }

    // 4. Must contain at least one child-related term or age pattern
    const hasChildTerm = CHILD_TERMS.some(term => q.includes(term))
      || CHILD_AGE_PATTERNS.some(re => re.test(q));
    if (!hasChildTerm) {
      return {
        isValid: false,
        reason: 'no_child_context',
        message: 'Please ask about one of our 4 domains for your child: Language Development, Early Science Skills, Literacy Foundations, or Social-Emotional Learning.'
      };
    }

    // 5. Must clearly match at least ONE of our 4 domains (threshold raised to 3)
    let matchedDomain = null;
    let maxMatches = 0;

    for (const [domain, config] of Object.entries(ALLOWED_DOMAINS)) {
      let matches = 0;

      // Check keyword matches
      for (const keyword of config.keywords) {
        if (q.includes(keyword)) matches++;
      }

      // Check pattern matches
      for (const pattern of config.patterns) {
        if (pattern.test(q)) matches += 2; // patterns worth more
      }

      if (matches > maxMatches) {
        maxMatches = matches;
        matchedDomain = domain;
      }
    }

    // Require at least 3 matches to be confident it's in-domain
    // (1 pattern match = 2pts, so we need 1 pattern + 1 keyword, or 3 keywords)
    if (maxMatches < 3) {
      return {
        isValid: false,
        reason: 'unclear_domain',
        message: 'Please ask about Language Development, Early Science Skills, Literacy Foundations, or Social-Emotional Learning.'
      };
    }

    return {
      isValid: true,
      domain: matchedDomain,
      confidence: maxMatches
    };
  }
  
  export const REJECTION_MESSAGE = `We only provide parenting tips in these 4 areas:
  
  - **Language Development** - vocabulary, communication, storytelling
  - **Early Science Skills** - exploration, observation, curiosity about nature
  - **Literacy Foundations** - reading, books, letters, phonics
  - **Social-Emotional Learning** - feelings, empathy, friendships, self-regulation
  
  Try asking about one of these topics!`;
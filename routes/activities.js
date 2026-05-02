import express from 'express';
import { OpenAI } from 'openai';
import pool from '../config/db.js';
import { authenticateJWT } from './middleware.js';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SUPPORTED_ACTIVITIES = [
  // Play time
  'Puzzles', 'Blocks', 'Pretend play', 'Games', 'Baby dolls', 'Cars',
  'Sensory toys', 'Playing (general)', 'Sports (e.g., soccer, basketball)',
  'Screen time (e.g., movie/show, iPad/tablet/phone, video games)',
  // Personal care
  'Waking up', 'Diapering', 'Potty time', 'Dressing', 'Nap time',
  'Brushing teeth', 'Bath time', 'Bed time', 'Sleeping',
  // Outdoor play
  'Ride-ons', 'Playing ball', 'Swinging', 'Sliding', 'Water play',
  // Eating & drinking
  'Bottle time', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Water breaks',
  // Outings
  'Car rides', 'Bus rides', 'Walks', 'Visiting family and friends',
  'Shopping', 'Getting the mail', 'Traveling to/from activity',
  // Household chores
  'Laundry', 'Wiping up tables', 'Throwing away trash', 'Picking up toys',
  'Putting dishes in sink', 'Clean-up, set-up, transition',
  // Books & literacy
  'Reading together', 'Playing with cloth or board books',
  'Talking about pictures', 'Reading or looking at books',
  // Structured activities
  'Circle time', 'Music time', 'Library story time', 'Story time', 'Art',
  'Playdough', 'Coloring', 'Centers', 'Large group', 'Small group',
  'Individual activity', 'Other', 'School work', 'Faith-based activities',
  'Therapy',
];

pool.query(`
  CREATE TABLE IF NOT EXISTS pending_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    submitted_by INT NOT NULL,
    domains JSON,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT NULL
  )
`).catch(err => console.error('pending_activities table init error:', err));

router.get('/supported', (req, res) => {
  res.json({ activities: SUPPORTED_ACTIVITIES });
});

router.post('/suggest', authenticateJWT, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Activity name is required' });
  }

  const normalized = name.trim();

  const alreadySupported = SUPPORTED_ACTIVITIES.some(
    a => a.toLowerCase() === normalized.toLowerCase(),
  );
  if (alreadySupported) {
    return res.status(409).json({ error: 'already_supported', message: 'This activity is already on the supported list.' });
  }

  const [existing] = await pool.query(
    'SELECT id, status FROM pending_activities WHERE LOWER(name) = LOWER(?)',
    [normalized],
  );
  if (existing.length > 0) {
    const { status } = existing[0];
    if (status === 'pending') {
      return res.status(409).json({ error: 'already_pending', message: 'This activity has already been submitted and is awaiting review.' });
    }
    if (status === 'rejected') {
      return res.status(400).json({ error: 'previously_rejected', message: 'This activity was reviewed and is not supported.' });
    }
  }

  let domains = [];
  let isValid = false;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_TIPS_MODEL || 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: `You are a validator for a child development app for children ages 0–5.
Determine if a submitted activity is a legitimate child development activity that fits into one or more of these categories:
- Play time (puzzles, pretend play, games, sensory, sports, screen time)
- Personal care (bath, potty, dressing, sleep, brushing teeth)
- Outdoor play (swinging, sliding, playing ball, water play)
- Eating & drinking (meals, snacks, bottle)
- Outings (car rides, shopping, walks, visiting people)
- Household chores (laundry, cleaning, picking up toys)
- Books & literacy (reading, stories, looking at pictures)
- Structured activities (circle time, music, art, school work, therapy)

Respond ONLY with valid JSON: { "valid": true/false, "domains": ["category1", ...], "reason": "brief reason" }`,
        },
        {
          role: 'user',
          content: `Is "${normalized}" a valid child development activity for ages 0–5?`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '';
    const parsed = JSON.parse(raw);
    isValid = parsed.valid === true;
    domains = parsed.domains ?? [];
  } catch (err) {
    console.error('Activity validation error:', err);
    return res.status(500).json({ error: 'validation_failed', message: 'Could not validate activity. Please try again.' });
  }

  if (!isValid) {
    return res.status(422).json({
      error: 'not_valid',
      message: `"${normalized}" doesn't appear to be a recognized child development activity for ages 0–5. Supported types include play, personal care, outdoor play, eating, outings, household chores, books, and structured activities.`,
      supported_activities: SUPPORTED_ACTIVITIES,
    });
  }

  await pool.query(
    'INSERT INTO pending_activities (name, submitted_by, domains) VALUES (?, ?, ?)',
    [normalized, req.user.id, JSON.stringify(domains)],
  );

  res.status(201).json({
    message: 'Activity submitted for review. An admin will review it shortly.',
    activity: normalized,
    domains,
  });
});

export default router;
export { SUPPORTED_ACTIVITIES };

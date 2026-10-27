/**
 * PSYRA Full-Stack Application Server
 * Serves the REST API and Vanilla Frontend on Port 3000.
 * Supports Grok (xAI) conversational AI with crisis safety layer,
 * 5-Question Wellness Assessment scoring, and in-memory persistence.
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'psyra_wellness_super_secret_key_2026';
const XAI_API_KEY = (process.env.XAI_API_KEY || '').trim();
const XAI_MODEL = process.env.XAI_MODEL || 'grok-beta';

app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// CORS headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// In-Memory Database for User Accounts, Assessments, and Journals
interface User {
  id: string;
  display_name: string;
  email: string;
  password_hash: string;
  created_at: string;
  preferred_theme: string;
}

interface AssessmentRecord {
  id: string;
  user_id?: string;
  category: string;
  confidence_label: string;
  summary: string;
  supportive_message: string;
  created_at: string;
  recommendations: any[];
}

interface JournalRecord {
  id: string;
  user_id: string;
  title: string;
  content: string;
  associated_emotion: string;
  prompt_used?: string | null;
  created_at: string;
  updated_at: string;
}

const memoryUsers: Map<string, User> = new Map();
const memoryAssessments: AssessmentRecord[] = [];
const memoryJournals: JournalRecord[] = [];

// Seed default demo user
const seedHashed = bcrypt.hashSync('demo12345', 10);
memoryUsers.set('demo_user_1', {
  id: 'demo_user_1',
  display_name: 'Sunny Friend',
  email: 'friend@psyra.app',
  password_hash: seedHashed,
  created_at: new Date().toISOString(),
  preferred_theme: 'light'
});

// Seed an initial assessment
memoryAssessments.push({
  id: 'assess_seed_1',
  user_id: 'demo_user_1',
  category: 'Neutral',
  confidence_label: 'Balanced Alignment',
  summary: 'You are in an even, steady, and balanced headspace today.',
  supportive_message: 'Neutrality is a peaceful, grounded foundation. It gives you space to pause and reflect gently.',
  created_at: new Date().toISOString(),
  recommendations: [
    {
      id: 'act_calming_music',
      title: 'Serene Ambient Tones',
      category: 'Music',
      description: 'Listen to balanced, meditative piano and ocean stream rhythms.',
      duration: '20 mins',
      action_type: 'music',
      action_url: '/music.html?category=calming'
    },
    {
      id: 'act_neutral_journal',
      title: 'Curiosity Journaling',
      category: 'Journaling',
      description: 'Explore what you would like to cultivate or learn more about this week.',
      duration: '10 mins',
      action_type: 'journal',
      action_url: '/journal.html?prompt=curiosity'
    }
  ]
});

// Seed an initial sample journal
memoryJournals.push({
  id: 'journal_seed_1',
  user_id: 'demo_user_1',
  title: 'Quiet morning with warm chamomile tea',
  content: 'Woke up a bit slow today. Listened to the soft wind rustling outside and took a few long, deep breaths before looking at my screen. Feeling steady.',
  associated_emotion: 'Neutral',
  prompt_used: 'What was the quietest moment of your day?',
  created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  updated_at: new Date(Date.now() - 3600000 * 5).toISOString()
});

// Auth Helper
function resolveUser(req: Request): { id: string; email: string; display_name: string } | null {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.psyra_session) {
    token = req.cookies.psyra_session;
  }

  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: payload.sub,
      email: payload.email,
      display_name: payload.display_name || 'Friend'
    };
  } catch (err) {
    return null;
  }
}

// ----------------- AUTH ENDPOINTS -----------------
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { display_name, email, password, confirm_password } = req.body;
  if (!display_name || !email || !password || !confirm_password) {
    return res.status(400).json({ detail: 'All registration fields are required.' });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ detail: 'Passwords do not match.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ detail: 'Password must be at least 8 characters long.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  for (const u of memoryUsers.values()) {
    if (u.email === cleanEmail) {
      return res.status(409).json({ detail: 'An account with this email address already exists.' });
    }
  }

  const userId = `user_${Date.now()}`;
  const nowIso = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(password, 10);

  const newUser: User = {
    id: userId,
    display_name: display_name.trim(),
    email: cleanEmail,
    password_hash: passwordHash,
    created_at: nowIso,
    preferred_theme: 'light'
  };

  memoryUsers.set(userId, newUser);

  const token = jwt.sign(
    { sub: userId, email: cleanEmail, display_name: newUser.display_name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.cookie('psyra_session', token, { httpOnly: true, maxAge: 86400000, sameSite: 'lax' });

  return res.status(201).json({
    access_token: token,
    token_type: 'bearer',
    user: {
      id: userId,
      display_name: newUser.display_name,
      email: cleanEmail,
      created_at: nowIso,
      preferred_theme: 'light'
    }
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ detail: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  let foundUser: User | null = null;
  for (const u of memoryUsers.values()) {
    if (u.email === cleanEmail) {
      foundUser = u;
      break;
    }
  }

  if (!foundUser || !bcrypt.compareSync(password, foundUser.password_hash)) {
    return res.status(401).json({ detail: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { sub: foundUser.id, email: foundUser.email, display_name: foundUser.display_name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.cookie('psyra_session', token, { httpOnly: true, maxAge: 86400000, sameSite: 'lax' });

  return res.json({
    access_token: token,
    token_type: 'bearer',
    user: {
      id: foundUser.id,
      display_name: foundUser.display_name,
      email: foundUser.email,
      created_at: foundUser.created_at,
      preferred_theme: foundUser.preferred_theme
    }
  });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('psyra_session');
  return res.json({ message: 'Successfully logged out.' });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = resolveUser(req);
  if (!user) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }
  const full = memoryUsers.get(user.id);
  return res.json({
    id: user.id,
    display_name: full?.display_name || user.display_name,
    email: full?.email || user.email,
    created_at: full?.created_at || new Date().toISOString(),
    preferred_theme: full?.preferred_theme || 'light'
  });
});

// ----------------- ASSESSMENT SCORING -----------------
const QUESTION_WEIGHTS: Record<number, Record<number, Record<string, number>>> = {
  1: {
    0: { Happy: 3, Neutral: 1, Stressed: 0, Low: 0 },
    1: { Happy: 2, Neutral: 2, Stressed: 0, Low: 0 },
    2: { Happy: 1, Neutral: 3, Stressed: 1, Low: 0 },
    3: { Happy: 0, Neutral: 1, Stressed: 2, Low: 2 },
    4: { Happy: 0, Neutral: 0, Stressed: 2, Low: 4 }
  },
  2: {
    0: { Happy: 3, Neutral: 2, Stressed: 0, Low: 0 },
    1: { Happy: 2, Neutral: 3, Stressed: 0, Low: 0 },
    2: { Happy: 1, Neutral: 3, Stressed: 1, Low: 1 },
    3: { Happy: 0, Neutral: 1, Stressed: 3, Low: 1 },
    4: { Happy: 0, Neutral: 0, Stressed: 4, Low: 2 }
  },
  3: {
    0: { Happy: 3, Neutral: 1, Stressed: 0, Low: 0 },
    1: { Happy: 2, Neutral: 2, Stressed: 0, Low: 0 },
    2: { Happy: 1, Neutral: 3, Stressed: 1, Low: 1 },
    3: { Happy: 0, Neutral: 1, Stressed: 1, Low: 3 },
    4: { Happy: 0, Neutral: 0, Stressed: 1, Low: 4 }
  },
  4: {
    0: { Happy: 4, Neutral: 0, Stressed: 0, Low: 0 },
    1: { Happy: 2, Neutral: 3, Stressed: 0, Low: 0 },
    2: { Happy: 0, Neutral: 2, Stressed: 2, Low: 1 },
    3: { Happy: 0, Neutral: 0, Stressed: 4, Low: 1 },
    4: { Happy: 0, Neutral: 0, Stressed: 1, Low: 4 }
  },
  5: {
    0: { Happy: 3, Neutral: 1, Stressed: 0, Low: 0 },
    1: { Happy: 1, Neutral: 3, Stressed: 1, Low: 0 },
    2: { Happy: 0, Neutral: 2, Stressed: 3, Low: 1 },
    3: { Happy: 0, Neutral: 0, Stressed: 4, Low: 1 },
    4: { Happy: 0, Neutral: 0, Stressed: 1, Low: 4 }
  }
};

const CATEGORY_INFO: Record<string, { summary: string; message: string; recs: any[] }> = {
  Happy: {
    summary: "You are experiencing a bright, uplifting, and energized emotional space today.",
    message: "It's wonderful to feel this wave of vitality. Cherishing these moments creates emotional reservoirs that anchor you.",
    recs: [
      { id: 'h1', title: 'Gratitude Reflection', category: 'Journaling', description: 'Write down 3 moments that brought warmth to your heart today.', duration: '5 mins', action_url: '/journal.html' },
      { id: 'h2', title: 'Uplifting Soundscapes', category: 'Music', description: 'Play energetic acoustic and gentle sunlit melodies.', duration: '15 mins', action_url: '/music.html?category=uplifting' },
      { id: 'h3', title: 'Vibrant Doodle Session', category: 'Doodle', description: 'Unleash your creativity with bright colors on the canvas.', duration: '10 mins', action_url: '/doodle.html' }
    ]
  },
  Neutral: {
    summary: "You are in an even, steady, and balanced headspace today.",
    message: "Neutrality is a peaceful, grounded foundation. It gives you the space to pause, reflect gently, and move at your own pace.",
    recs: [
      { id: 'n1', title: 'Gentle Mindfulness Pause', category: 'Self-Care', description: 'Take a 5-minute pause to notice 5 things you can see, 4 you can touch, and 3 you hear.', duration: '5 mins', action_url: '/chat.html?starter=mindfulness' },
      { id: 'n2', title: 'Serene Ambient Tones', category: 'Music', description: 'Listen to balanced, meditative piano and ocean stream rhythms.', duration: '20 mins', action_url: '/music.html?category=calming' },
      { id: 'n3', title: 'Curiosity Journaling', category: 'Journaling', description: 'Explore what you would like to cultivate or learn more about.', duration: '10 mins', action_url: '/journal.html' }
    ]
  },
  Stressed: {
    summary: "Your responses suggest you may be navigating tension, pressure, or a racing mind.",
    message: "It is completely valid to feel overwhelmed. You don't have to carry everything all at once; let's slow things down one breath at a time.",
    recs: [
      { id: 's1', title: '4-7-8 Box Breathing', category: 'Self-Care', description: 'Inhale for 4s, hold for 7s, release softly for 8s to calm the nervous system.', duration: '4 mins', action_url: '/chat.html?starter=breathing' },
      { id: 's2', title: 'Unload Current Concerns', category: 'Journaling', description: 'Put everything buzzing in your head onto the page so your mind can rest.', duration: '8 mins', action_url: '/journal.html' },
      { id: 's3', title: 'Soft Rain & Singing Bowls', category: 'Music', description: 'Deep resonance audio designed to decelerate heart rate and ease tension.', duration: '15 mins', action_url: '/music.html?category=relaxation' }
    ]
  },
  Low: {
    summary: "You appear to be experiencing low energy, fatigue, or a quiet, tender mood.",
    message: "Be extra gentle with yourself today. You are doing enough simply by being here, and taking quiet time to rest is an act of care.",
    recs: [
      { id: 'l1', title: 'Talk with Psyra', category: 'AI Companion', description: 'Share what is on your heart with a compassionate, non-judgmental presence.', duration: 'Open', action_url: '/chat.html?starter=support' },
      { id: 'l2', title: 'Comforting Ambient Lullaby', category: 'Music', description: 'Soft, warm ambient chords that hold comforting space.', duration: '20 mins', action_url: '/music.html?category=relaxation' },
      { id: 'l3', title: 'One Micro-Kindness', category: 'Journaling', description: 'Write one sentence offering kindness to yourself right as you are.', duration: '3 mins', action_url: '/journal.html' }
    ]
  }
};

app.post('/api/assessment', (req: Request, res: Response) => {
  const { answers } = req.body;
  if (!answers || !Array.isArray(answers) || answers.length !== 5) {
    return res.status(400).json({ detail: 'All 5 question answers are required.' });
  }

  const scores: Record<string, number> = { Happy: 0, Neutral: 0, Stressed: 0, Low: 0 };
  for (const ans of answers) {
    const q = ans.question_index;
    const opt = ans.option_index;
    if (QUESTION_WEIGHTS[q] && QUESTION_WEIGHTS[q][opt]) {
      for (const [cat, w] of Object.entries(QUESTION_WEIGHTS[q][opt])) {
        scores[cat] += w;
      }
    }
  }

  let dominant = 'Neutral';
  let highest = -1;
  for (const [cat, sc] of Object.entries(scores)) {
    if (sc > highest) {
      highest = sc;
      dominant = cat;
    }
  }

  const info = CATEGORY_INFO[dominant] || CATEGORY_INFO['Neutral'];
  const user = resolveUser(req);
  const nowIso = new Date().toISOString();
  const recordId = `assess_${Date.now()}`;

  const record: AssessmentRecord = {
    id: recordId,
    user_id: user?.id,
    category: dominant,
    confidence_label: 'Balanced Alignment',
    summary: info.summary,
    supportive_message: info.message,
    created_at: nowIso,
    recommendations: info.recs
  };

  memoryAssessments.unshift(record);

  return res.json({
    id: recordId,
    category: dominant,
    confidence_label: 'Balanced Alignment',
    summary: info.summary,
    supportive_message: info.message,
    disclaimer: 'PSYRA is a supportive self-reflection wellness tool and does not provide clinical diagnoses.',
    recommendations: info.recs,
    created_at: nowIso
  });
});

app.get('/api/assessment/history', (req: Request, res: Response) => {
  const user = resolveUser(req);
  if (!user) {
    return res.status(401).json({ detail: 'Authentication required' });
  }

  const userHistory = memoryAssessments.filter(a => a.user_id === user.id);
  return res.json({
    total_assessments: userHistory.length,
    history: userHistory
  });
});

// ----------------- GROK xAI CHAT -----------------
const CRISIS_REGEX = /\b(suicide|suicidal|kill myself|end my life|want to die|hurt myself|self[- ]harm|cutting myself|overdose|slit my wrists|hang myself|no reason to live)\b/i;

const CRISIS_MESSAGE = 
  "I hear how much pain and weight you are carrying right now, and I want you to know that your life matters. " +
  "Because your safety is the most important thing, please connect immediately with compassionate people trained to help:\n\n" +
  "• Call or text **988** to reach the Suicide & Crisis Lifeline (free, confidential, 24/7 in USA/Canada).\n" +
  "• Text **HOME** to **741741** to connect with the Crisis Text Line.\n" +
  "• International: Visit **https://findahelpline.com** or call your local emergency services.\n\n" +
  "Please reach out to one of these resources or a trusted person right now. You do not have to carry this alone.";

app.post('/api/chat', async (req: Request, res: Response) => {
  const { message, history, share_emotion_context, current_emotion_category } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ detail: 'Message cannot be empty.' });
  }

  const userText = message.trim();

  // Safety trigger
  if (CRISIS_REGEX.test(userText)) {
    return res.json({
      reply: CRISIS_MESSAGE,
      suggested_followups: [
        "I will call or text 988",
        "Text HOME to 741741",
        "I will talk to a trusted friend"
      ],
      crisis_triggered: true,
      crisis_resources: "988 Lifeline (Call/Text 988) | Crisis Text Line (Text HOME to 741741)"
    });
  }

  // If XAI_API_KEY is configured, call official xAI Grok API endpoint
  if (XAI_API_KEY) {
    try {
      let systemPrompt = 
        "You are PSYRA (Psychological Relief Assistant), a compassionate, supportive, non-judgmental mental-wellness companion. " +
        "You speak with warmth, validation, and calm. You are a wellness reflection companion, NOT a licensed doctor or therapist. " +
        "Never give medical diagnoses or prescribe medications. Provide practical grounding exercises (breathing, tactile doodling, journaling).";

      if (share_emotion_context && current_emotion_category) {
        systemPrompt += ` The user recently checked in with a '${current_emotion_category}' emotional state. Tailor your tone gently for this context.`;
      }

      const apiMessages = [{ role: 'system', content: systemPrompt }];
      if (Array.isArray(history)) {
        for (const h of history.slice(-8)) {
          if (h.role && h.content) {
            apiMessages.push({ role: h.role, content: h.content });
          }
        }
      }
      apiMessages.push({ role: 'user', content: userText });

      const xaiRes = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${XAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: XAI_MODEL,
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (xaiRes.ok) {
        const xaiData = await xaiRes.json();
        const reply = xaiData.choices?.[0]?.message?.content || "I am here with you. What would you like to explore next?";
        return res.json({
          reply,
          suggested_followups: [
            "Can you suggest a calming exercise?",
            "Give me a journal prompt",
            "Tell me more about handling stress"
          ],
          crisis_triggered: false
        });
      }
    } catch (err) {
      console.error('Error contacting xAI API:', err);
    }
  }

  // Empathetic offline / fallback response generator
  const lower = userText.toLowerCase();
  let reply = "";
  let followups: string[] = [];

  if (lower.includes('day') || lower.includes('talk about')) {
    reply = "I'm listening with an open heart. Whether today felt heavy, busy, or quiet, all of your experiences are safe here. What moment from today is lingering with you the most?";
    followups = ["It felt overwhelming", "I had a small win", "I just feel tired", "Nothing went right"];
  } else if (lower.includes('calm') || lower.includes('activity') || lower.includes('relax')) {
    reply = "Let's take a gentle pause together. A wonderful practice right now is the 'Soft Palms' release: Unclench your jaw, drop your shoulders away from your ears, and rest your hands open on your lap. Take one slow breath in through your nose... and softly sigh it out.\n\nWould you like to try our Calming Doodle Board, listen to rain soundscapes, or write a quick journal thought?";
    followups = ["Try the Doodle Board", "Play calming music", "Give me a journal prompt", "Another breath together"];
  } else if (lower.includes('breathe') || lower.includes('breathing')) {
    reply = "Let's breathe together. Place one hand gently on your chest:\n\n1. Inhale softly for 4 seconds... (1... 2... 3... 4)\n2. Gently pause for 4 seconds... (1... 2... 3... 4)\n3. Exhale smoothly for 6 seconds... (1... 2... 3... 4... 5... 6)\n\nHow does your chest feel as you let that breath go?";
    followups = ["A little lighter", "Still feeling tight", "Can we do one more?", "Thank you, Psyra"];
  } else if (lower.includes('journal') || lower.includes('prompt')) {
    reply = "Here is a gentle journal prompt for your heart:\n\n**'What is something heavy you are carrying today that doesn't all have to be solved before you sleep tonight?'**\n\nYou can head over to our Journal tab to write it down.";
    followups = ["Open the Journal", "Give me another prompt", "I'll try writing that now"];
  } else {
    const contextPrefix = (share_emotion_context && current_emotion_category) 
      ? `Holding gentle awareness that you've been feeling ${current_emotion_category.toLowerCase()} today, ` 
      : "";
    reply = `Thank you for sharing that with me. ${contextPrefix}I'm right beside you, holding space without any judgment or rush. What would feel most nourishing for your mind right now?`;
    followups = ["Can you suggest a calming activity?", "Give me a journal prompt", "Can we try a short breathing exercise?", "Tell me a soothing thought"];
  }

  return res.json({
    reply,
    suggested_followups: followups,
    crisis_triggered: false
  });
});

// ----------------- JOURNAL ENDPOINTS -----------------
app.get('/api/journal', (req: Request, res: Response) => {
  const user = resolveUser(req);
  if (!user) {
    return res.status(401).json({ detail: 'Authentication required' });
  }

  const { date_filter } = req.query;
  let userEntries = memoryJournals.filter(j => j.user_id === user.id);

  if (date_filter && typeof date_filter === 'string') {
    userEntries = userEntries.filter(j => j.created_at.startsWith(date_filter));
  }

  return res.json({
    total: userEntries.length,
    entries: userEntries
  });
});

app.post('/api/journal', (req: Request, res: Response) => {
  const user = resolveUser(req);
  if (!user) {
    return res.status(401).json({ detail: 'Authentication required' });
  }

  const { title, content, associated_emotion, prompt_used } = req.body;
  if (!title || !content) {
    return res.status(400).json({ detail: 'Title and content are required.' });
  }

  const entryId = `journal_${Date.now()}`;
  const nowIso = new Date().toISOString();

  const newEntry: JournalRecord = {
    id: entryId,
    user_id: user.id,
    title: title.trim(),
    content: content.trim(),
    associated_emotion: associated_emotion || 'Neutral',
    prompt_used: prompt_used || null,
    created_at: nowIso,
    updated_at: nowIso
  };

  memoryJournals.unshift(newEntry);
  return res.status(201).json(newEntry);
});

app.put('/api/journal/:id', (req: Request, res: Response) => {
  const user = resolveUser(req);
  if (!user) {
    return res.status(401).json({ detail: 'Authentication required' });
  }

  const { id } = req.params;
  const entry = memoryJournals.find(j => j.id === id && j.user_id === user.id);
  if (!entry) {
    return res.status(404).json({ detail: 'Entry not found or access denied.' });
  }

  const { title, content, associated_emotion } = req.body;
  if (title) entry.title = title.trim();
  if (content) entry.content = content.trim();
  if (associated_emotion) entry.associated_emotion = associated_emotion;
  entry.updated_at = new Date().toISOString();

  return res.json(entry);
});

app.delete('/api/journal/:id', (req: Request, res: Response) => {
  const user = resolveUser(req);
  if (!user) {
    return res.status(401).json({ detail: 'Authentication required' });
  }

  const { id } = req.params;
  const index = memoryJournals.findIndex(j => j.id === id && j.user_id === user.id);
  if (index === -1) {
    return res.status(404).json({ detail: 'Entry not found or access denied.' });
  }

  memoryJournals.splice(index, 1);
  return res.json({ message: 'Journal entry removed.' });
});

// ----------------- MUSIC RECOMMENDATIONS -----------------
const MUSIC_COLLECTIONS: Record<string, any[]> = {
  uplifting: [
    { id: 'u1', title: 'Sunlit Steps & Gentle Strings', artist_or_source: 'Acoustic Morning Radiance', category: 'uplifting', description: 'Bright acoustic fingerpicking designed to lift your spirits and spark gentle motivation.', duration_approx: '30 mins', external_url: 'https://www.youtube.com/results?search_query=uplifting+acoustic+morning+instrumental' },
    { id: 'u2', title: 'Warm Coffee & Sunshine', artist_or_source: 'Lofi Chillhop Curations', category: 'uplifting', description: 'Warm Rhodes piano chords with light organic percussion to celebrate small joys.', duration_approx: '45 mins', external_url: 'https://www.youtube.com/results?search_query=happy+lofi+chillhop+beats' }
  ],
  calming: [
    { id: 'c1', title: 'Mountain Spring & Bamboo Chimes', artist_or_source: 'Nature Audio Collective', category: 'calming', description: 'Pure running water layered with subtle handcrafted harmonic wind chimes.', ambient_sound_type: 'stream', duration_approx: '60 mins', external_url: 'https://www.youtube.com/results?search_query=gentle+forest+stream+and+wind+chimes' },
    { id: 'c2', title: 'Slow Piano & Soft Atmosphere', artist_or_source: 'Minimalist Piano Soundscape', category: 'calming', description: 'Slow, spacious piano melodies that allow your nervous system to downshift.', duration_approx: '40 mins', external_url: 'https://www.youtube.com/results?search_query=calming+piano+mindfulness+music' }
  ],
  focus: [
    { id: 'f1', title: 'Binaural Alpha Waves (10 Hz)', artist_or_source: 'Focus Acoustics', category: 'focus', description: 'Gentle frequency entrainment designed to settle brain chatter and support clear attention.', duration_approx: '60 mins', external_url: 'https://www.youtube.com/results?search_query=10hz+alpha+binaural+beats+study' },
    { id: 'f2', title: 'Rain on the Glass Window', artist_or_source: 'Atmospheric Study Space', category: 'focus', description: 'A steady rhythm of rainfall on glass that masks ambient distractions comfortably.', ambient_sound_type: 'rain', duration_approx: '120 mins', external_url: 'https://www.youtube.com/results?search_query=rain+on+window+ambient+study' }
  ],
  relaxation: [
    { id: 'r1', title: 'Singing Bowls & Grounding Drone', artist_or_source: 'Resonant Sound Healing', category: 'relaxation', description: 'Sustained harmonic overtones tuned to release muscle constriction and soften tension.', ambient_sound_type: 'bowl', duration_approx: '45 mins', external_url: 'https://www.youtube.com/results?search_query=tibetan+singing+bowls+stress+relief' },
    { id: 'r2', title: 'Nocturnal Ocean Swells', artist_or_source: 'Pacific Shoreline Field Recordings', category: 'relaxation', description: 'Slow, rolling deep ocean waves matching the cadence of relaxed, restorative breathing.', ambient_sound_type: 'ocean', duration_approx: '60 mins', external_url: 'https://www.youtube.com/results?search_query=calm+ocean+waves+relaxation+night' }
  ]
};

app.get('/api/music/recommendations', (req: Request, res: Response) => {
  const { category, emotion } = req.query;
  let target = typeof category === 'string' ? category : null;

  if (!target && emotion && typeof emotion === 'string') {
    const map: Record<string, string> = {
      Happy: 'uplifting',
      Neutral: 'calming',
      Stressed: 'relaxation',
      Low: 'relaxation'
    };
    target = map[emotion] || 'calming';
  }

  if (target && MUSIC_COLLECTIONS[target]) {
    return res.json({ category: target, tracks: MUSIC_COLLECTIONS[target] });
  }

  return res.json({
    all_categories: ['uplifting', 'calming', 'focus', 'relaxation'],
    collections: MUSIC_COLLECTIONS
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  return res.json({
    status: 'healthy',
    app: 'PSYRA',
    grok_configured: Boolean(XAI_API_KEY)
  });
});

// ----------------- STATIC ASSETS & FRONTEND SERVING -----------------
// Static files from /frontend
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));
app.use('/src/assets/images', express.static(path.join(__dirname, 'src', 'assets', 'images')));

// Root route serves index.html
app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Multi-page HTML route aliases
app.get('/index.html', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});
app.get('/dashboard.html', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dashboard.html'));
});
app.get('/assessment.html', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'frontend', 'assessment.html'));
});
app.get('/chat.html', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'frontend', 'chat.html'));
});
app.get('/doodle.html', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'frontend', 'doodle.html'));
});
app.get('/journal.html', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'frontend', 'journal.html'));
});
app.get('/music.html', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'frontend', 'music.html'));
});
app.get('/login.html', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});
app.get('/register.html', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'frontend', 'register.html'));
});

// Fallback to index.html for client routing
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
  }
  next();
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🌸 PSYRA server running on http://0.0.0.0:${PORT}`);
  console.log(`🤖 Grok integration: ${XAI_API_KEY ? 'Active (API key detected)' : 'Local Compassionate Fallback'}`);
});

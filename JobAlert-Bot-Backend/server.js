const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));

// CORS: allow the public web frontend (Vercel) to call /api/* routes.
// Restrict this to your actual frontend domain once deployed, instead of '*'.
app.use('/api', cors({ origin: process.env.WEB_FRONTEND_ORIGIN || '*' }));

// Basic abuse protection for the public, unauthenticated web API.
const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down and try again in a minute.' }
});
app.use('/api', publicApiLimiter);

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const APP_SECRET = process.env.META_APP_SECRET;
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const MIN_JOBPOST_LENGTH = 25; // below this, treat as too short to be a real job post

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;
  const expectedHash = crypto
    .createHmac('sha256', APP_SECRET)
    .update(req.rawBody)
    .digest('hex');
  return signature === `sha256=${expectedHash}`;
}

function hashPhoneNumber(number) {
  return crypto.createHash('sha256').update(number).digest('hex');
}

async function sendWhatsAppMessage(to, text) {
  const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text }
    })
  });
  const data = await res.json();
  console.log('Send result:', data);
  return data;
}

async function extractJobPost(text) {
  const res = await fetch(`${NLP_SERVICE_URL}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (!res.ok) {
    throw new Error(`NLP service returned ${res.status}`);
  }
  return res.json();
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function formatJobCard(extracted) {
  const lines = ['📋 *Job Post Extracted*'];
  if (extracted.company) lines.push(`🏢 Company: ${extracted.company}`);
  if (extracted.role) lines.push(`💼 Role: ${extracted.role}`);
  if (extracted.location) lines.push(`📍 Location: ${extracted.location}`);
  if (extracted.salary) lines.push(`💰 Salary: ${extracted.salary}`);
  if (extracted.deadline) lines.push(`⏰ Deadline: ${extracted.deadline}`);
  if (extracted.application_link) lines.push(`🔗 Apply: ${extracted.application_link}`);
  return lines.join('\n');
}

// Returns true if the extraction came back essentially empty - meaning the
// forwarded text almost certainly wasn't a real job post.
function extractionLooksEmpty(extracted) {
  return !extracted.company && !extracted.role && !extracted.application_link && !extracted.salary;
}

async function findDuplicatePost(embedding) {
  const { data, error } = await supabase.rpc('match_similar_job_posts', {
    query_embedding: embedding,
    similarity_threshold: 0.92,
    match_count: 1
  });

  if (error) {
    console.log('Dedup RPC FAILED:', error.message, error.details, error.hint);
    return null;
  }
  console.log('Dedup check result:', data);
  return data && data.length > 0 ? data[0] : null;
}

async function updateInterestProfile(userId, text) {
  let embedding = null;
  try {
    const extracted = await extractJobPost(text);
    embedding = extracted.embedding;
  } catch (err) {
    console.log('Failed to embed interest text:', err.message);
  }

  // upsert-style: delete any existing profile, insert fresh one
  await supabase.from('interest_profiles').delete().eq('user_id', userId);
  await supabase.from('interest_profiles').insert({
    user_id: userId,
    raw_interests: text,
    embedding
  });
}

async function handleJobPostMessage(user, profile, fromNumber, text) {
  try {
    const extracted = await extractJobPost(text);

    if (extractionLooksEmpty(extracted)) {
      await sendWhatsAppMessage(
        fromNumber,
        "Hmm, that doesn't look like a job post I can parse. Forward a message with company/role details, or type \"change interests\" to update what you're looking for."
      );
      return;
    }

    const duplicate = await findDuplicatePost(extracted.embedding);

    let relevanceNote = '';
    if (profile.embedding && extracted.embedding) {
      const score = cosineSimilarity(profile.embedding, extracted.embedding);
      relevanceNote = `\n\n🎯 Relevance to your interests: ${(score * 100).toFixed(0)}%`;
    }

    if (duplicate) {
      console.log('Duplicate detected:', duplicate);
      await sendWhatsAppMessage(
        fromNumber,
        `👀 This looks like a post you may have already seen (${duplicate.company || 'similar company'} - ${duplicate.role || 'similar role'}).\n\n` +
        formatJobCard(extracted) + relevanceNote
      );
      return;
    }

    const { data: jobPost, error: insertError } = await supabase
      .from('job_posts')
      .insert({
        submitted_by: user.id,
        raw_text: text,
        company: extracted.company,
        role: extracted.role,
        location: extracted.location,
        salary: extracted.salary,
        application_link: extracted.application_link,
        deadline: extracted.deadline,
        embedding: extracted.embedding
      })
      .select()
      .single();

    if (insertError) {
      console.log('job_posts insert FAILED:', insertError.message, insertError.details);
    } else {
      console.log('job_posts insert succeeded, id:', jobPost?.id);
    }

    if (jobPost && profile.embedding && extracted.embedding) {
      const score = cosineSimilarity(profile.embedding, extracted.embedding);
      await supabase.from('matches').insert({
        user_id: user.id,
        job_post_id: jobPost.id,
        similarity_score: score
      });
    }

    await sendWhatsAppMessage(fromNumber, formatJobCard(extracted) + relevanceNote);
  } catch (err) {
    console.log('Extraction failed:', err.message);
    await sendWhatsAppMessage(
      fromNumber,
      "Sorry, I couldn't process that job post right now. Please try again in a moment."
    );
  }
}

app.post('/webhook', async (req, res) => {
  if (!verifySignature(req)) {
    console.log('Signature verification failed');
    return res.sendStatus(401);
  }

  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const message = changes?.value?.messages?.[0];

  if (message) {
    const fromNumber = message.from;
    const numberHash = hashPhoneNumber(fromNumber);

    // Handle non-text messages (images, stickers, audio, etc.)
    if (message.type !== 'text') {
      console.log('Non-text message received:', message.type);
      await sendWhatsAppMessage(
        fromNumber,
        "I can only read text messages right now. Please forward the job post as text, or copy-paste it here."
      );
      return res.sendStatus(200);
    }

    const text = (message.text?.body || '').trim();
    console.log('Incoming message:', { from: fromNumber, text });

    // Handle empty messages
    if (!text) {
      await sendWhatsAppMessage(fromNumber, "I didn't catch any text in that message - try again?");
      return res.sendStatus(200);
    }

    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('whatsapp_number_hash', numberHash)
      .single();

    if (!user) {
      const { data: newUser } = await supabase
        .from('users')
        .insert({ whatsapp_number_hash: numberHash })
        .select()
        .single();
      user = newUser;

      await sendWhatsAppMessage(
        fromNumber,
        "Hi! I'm JobAlert Bot 👋\n\nTell me your field of interest (e.g. \"backend development, fintech\") and I'll help match job posts you forward me."
      );
      return res.sendStatus(200);
    }

    const { data: profile } = await supabase
      .from('interest_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // "change interests" command - works whether or not a profile exists yet
    const lowerText = text.toLowerCase();
    if (lowerText === 'change interests' || lowerText === 'update interests' || lowerText === 'reset interests') {
      await supabase.from('interest_profiles').delete().eq('user_id', user.id);
      await sendWhatsAppMessage(
        fromNumber,
        "Sure! Tell me your new field of interest (e.g. \"backend development, fintech\")."
      );
      return res.sendStatus(200);
    }

    if (!profile) {
      // No interest profile yet - this message IS their interest input
      if (text.length < 3) {
        await sendWhatsAppMessage(fromNumber, "That's a bit short - tell me a bit more about what kind of roles you're interested in.");
        return res.sendStatus(200);
      }

      await updateInterestProfile(user.id, text);
      await sendWhatsAppMessage(
        fromNumber,
        `Got it! I'll match job posts to: "${text}"\n\nNow forward me any job listing message and I'll process it for you.\n\n(You can type "change interests" anytime to update this.)`
      );
      return res.sendStatus(200);
    }

    // Reject obviously-too-short messages before wasting an NLP call
    if (text.length < MIN_JOBPOST_LENGTH) {
      await sendWhatsAppMessage(
        fromNumber,
        "That looks too short to be a job post. Forward the full message, or type \"change interests\" to update your preferences."
      );
      return res.sendStatus(200);
    }

    await handleJobPostMessage(user, profile, fromNumber, text);
  }

  res.sendStatus(200);
});

// ---------- Public web API (no login required) ----------
// Powers the "Job Finder" page on the landing site. Reuses the same
// extractJobPost / findDuplicatePost logic as the WhatsApp webhook - no
// duplicated business logic.

app.get('/api/jobs/search', async (req, res) => {
  const { company, role, location, limit } = req.query;
  const safeLimit = Math.min(Number(limit) || 30, 100);

  let query = supabase
    .from('job_posts')
    .select('id, company, role, location, salary, application_link, deadline, created_at')
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (company) query = query.ilike('company', `%${company}%`);
  if (role) query = query.ilike('role', `%${role}%`);
  if (location) query = query.ilike('location', `%${location}%`);

  const { data, error } = await query;

  if (error) {
    console.log('Job search failed:', error.message);
    return res.status(500).json({ error: 'Search failed, please try again.' });
  }

  res.json({ results: data, count: data.length });
});

app.post('/api/extract', async (req, res) => {
  const text = (req.body?.text || '').trim();

  if (text.length < MIN_JOBPOST_LENGTH) {
    return res.status(400).json({
      error: `Please paste the full job post text (at least ${MIN_JOBPOST_LENGTH} characters).`
    });
  }

  try {
    const extracted = await extractJobPost(text);

    if (extractionLooksEmpty(extracted)) {
      return res.json({
        status: 'unrecognized',
        message: "This doesn't look like a job post we can parse. Try pasting the full message."
      });
    }

    const duplicate = await findDuplicatePost(extracted.embedding);
    if (duplicate) {
      return res.json({ status: 'duplicate', duplicate, extracted });
    }

    // submitted_by is null here since web users aren't authenticated -
    // the users table only tracks WhatsApp identities, and this column
    // is nullable for exactly this case.
    const { data: jobPost, error: insertError } = await supabase
      .from('job_posts')
      .insert({
        submitted_by: null,
        raw_text: text,
        company: extracted.company,
        role: extracted.role,
        location: extracted.location,
        salary: extracted.salary,
        application_link: extracted.application_link,
        deadline: extracted.deadline,
        embedding: extracted.embedding
      })
      .select()
      .single();

    if (insertError) {
      console.log('Web extract insert FAILED:', insertError.message);
    }

    res.json({ status: 'new', extracted, id: jobPost?.id || null });
  } catch (err) {
    console.log('Web extract failed:', err.message);
    res.status(502).json({ error: "Couldn't reach the extraction service. Please try again shortly." });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Webhook server running');
});
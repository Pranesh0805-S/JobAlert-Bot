const express = require('express');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const APP_SECRET = process.env.META_APP_SECRET;
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL;

console.log('Token first 20 chars:', WHATSAPP_TOKEN?.substring(0, 20));
console.log('Token length:', WHATSAPP_TOKEN?.length);
console.log('Phone Number ID:', PHONE_NUMBER_ID);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

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

// Checks Postgres (via the match_similar_job_posts function) for a near-duplicate
// recent post. Returns the matching row if found, or null if this looks new.
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
    const text = message.text?.body || '';
    const numberHash = hashPhoneNumber(fromNumber);

    console.log('Incoming message:', { from: fromNumber, text });

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
    } else {
      const { data: profile } = await supabase
        .from('interest_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        let interestEmbedding = null;
        try {
          const extracted = await extractJobPost(text);
          interestEmbedding = extracted.embedding;
        } catch (err) {
          console.log('Failed to embed interest text:', err.message);
        }

        await supabase.from('interest_profiles').insert({
          user_id: user.id,
          raw_interests: text,
          embedding: interestEmbedding
        });

        await sendWhatsAppMessage(
          fromNumber,
          `Got it! I'll match job posts to: "${text}"\n\nNow forward me any job listing message and I'll process it for you.`
        );
      } else {
        try {
          const extracted = await extractJobPost(text);

          // Check for a near-duplicate before inserting a new row
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
              `👀 This looks like a post you may have already seen (${duplicate.company || 'similar company'} - ${duplicate.role || 'similar role'}).` +
              formatJobCard(extracted) + relevanceNote
            );
          } else {
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

            await sendWhatsAppMessage(
              fromNumber,
              formatJobCard(extracted) + relevanceNote
            );
          }
        } catch (err) {
          console.log('Extraction failed:', err.message);
          await sendWhatsAppMessage(
            fromNumber,
            "Sorry, I couldn't process that job post right now. Please try again in a moment."
          );
        }
      }
    }
  }

  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Webhook server running');
});
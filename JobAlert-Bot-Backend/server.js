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
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN; // add this next
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID; // add this next

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

    // Check if user exists
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('whatsapp_number_hash', numberHash)
      .single();

    if (!user) {
      // New user — create and onboard
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
      // Existing user — check if they have an interest profile
      const { data: profile } = await supabase
        .from('interest_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        // This message is their interest input
        await supabase.from('interest_profiles').insert({
          user_id: user.id,
          raw_interests: text
        });
        await sendWhatsAppMessage(
          fromNumber,
          `Got it! I'll match job posts to: "${text}"\n\nNow forward me any job listing message and I'll process it for you.`
        );
      } else {
        // Treat as a forwarded job post (NLP extraction comes next phase)
        await sendWhatsAppMessage(
          fromNumber,
          "Thanks! I've received this job post. (Extraction logic coming soon.)"
        );
      }
    }
  }

  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Webhook server running');
});
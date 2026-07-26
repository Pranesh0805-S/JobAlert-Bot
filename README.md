# JobAlert Bot

A WhatsApp bot that extracts structured job listings from forwarded messages, matches them to a user's stated interests, and filters out duplicate postings — built on the official WhatsApp Business Cloud API.

## The problem

Job-alert WhatsApp channels post frequent, unstructured updates. The same opening often gets reposted across multiple channels, and there's no way to filter postings by relevance to your own field. JobAlert Bot lets a user forward any job post they receive, and replies with a clean, structured summary — flagging duplicates and scoring relevance against the user's interests.

## Why WhatsApp Business Cloud API (not automation)

Early versions of this project considered using unofficial WhatsApp automation libraries (e.g. Baileys, whatsapp-web.js) to read messages from channels a user follows. That approach was rejected because:

- It requires simulating a personal WhatsApp Web session, which violates WhatsApp's Terms of Service
- Accounts used this way are subject to bans with no recourse
- It would require users to hand over session access to their entire WhatsApp account, not just the channels in question — a serious privacy/security liability

Instead, this project uses the **official WhatsApp Business Cloud API**. The bot only ever reads messages sent directly *to* it by a user who has opted in by messaging first — a fully compliant, sanctioned integration path. Users copy-paste or forward job posts into the chat themselves; the bot never reads channels on their behalf.

## Architecture

```
WhatsApp user
     │
     │ forwards/pastes a job post
     ▼
WhatsApp Business Cloud API (Meta)
     │  webhook (signed POST)
     ▼
Express backend (Node.js) ── Render
     │
     ├─→ Supabase (Postgres + pgvector)
     │     - users, interest_profiles, job_posts, matches
     │     - Row Level Security enabled
     │
     └─→ FastAPI NLP service ── Render
           - Entity extraction (regex + spaCy NER)
           - Sentence embeddings (fastembed / ONNX, no torch)
     │
     ▼
Formatted reply sent back via Cloud API
```

## How it works

1. **Onboarding**: a new user messages the bot; it asks for their field of interest and stores an embedding of it.
2. **Forwarding a job post**: the user forwards or pastes a job listing as plain text.
3. **Extraction**: the backend calls the NLP microservice, which pulls out company, role, location, salary, deadline, and application link using a hybrid of regex rules and spaCy's NER, and generates a sentence embedding for the post.
4. **Deduplication**: before storing, the backend checks recent posts for a near-identical embedding (cosine similarity > 0.92) via a Postgres/pgvector function. Reworded duplicates of the same posting are caught even when the text differs.
5. **Relevance scoring**: the post's embedding is compared against the user's interest embedding to produce a relevance percentage.
6. **Reply**: the bot sends back a formatted card with the extracted fields, a duplicate warning if applicable, and the relevance score.

Users can type `change interests` at any time to update what they're matched against.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Messaging | WhatsApp Business Cloud API | Official, compliant, free for user-initiated conversations |
| Backend | Node.js / Express | Webhook handling, orchestration |
| Database | Supabase (Postgres + pgvector) | Relational data + vector similarity in one place, RLS for isolation |
| NLP | FastAPI (Python) | Separate service for extraction and embeddings |
| Extraction | spaCy (NER) + regex | Hybrid approach for messy, inconsistently formatted real-world text |
| Embeddings | fastembed (ONNX) | Lightweight alternative to sentence-transformers/PyTorch — fits free-tier memory limits |
| Hosting | Render (free tier) | Both backend and NLP service deployed as separate web services |

## Project structure

```
JobAlert-Bot/
├── JobAlert-Bot-Backend/    # Express webhook server
│   ├── server.js
│   └── package.json
└── JobAlert-Bot-NLP/        # FastAPI extraction service
    ├── main.py
    └── requirements.txt
```

## Setup

### Prerequisites
- Node.js 18+
- Python 3.11
- A Supabase project with the `pgvector` extension enabled
- A Meta Business app with WhatsApp Business Platform configured

### Environment variables (backend)
```
WEBHOOK_VERIFY_TOKEN=
META_APP_SECRET=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
NLP_SERVICE_URL=
```

### Environment variables (NLP service)
None required — it's a stateless extraction service.

### Database schema
See `schema.sql` for the full table definitions and the `match_similar_job_posts` Postgres function used for deduplication.

### Running locally
```bash
# Backend
cd JobAlert-Bot-Backend
npm install
node server.js

# NLP service
cd JobAlert-Bot-NLP
python -m venv venv
venv\Scripts\activate  # or source venv/bin/activate on Mac/Linux
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload --port 8000
```

## Known limitations

- Extraction accuracy depends on how the source message is formatted; very unstructured text can produce partial results (falls back to spaCy NER, which isn't always precise for company names embedded mid-sentence)
- The bot currently supports one interest profile per user (no multi-category matching)
- Currently limited to Meta's test phone number and pre-verified test recipients, since the app is unpublished (development mode)

## Future improvements

- Fine-tuned or LLM-based extraction for higher accuracy on unstructured posts
- Digest/summary messages (batched daily updates) via WhatsApp template messages
- Multi-category interest profiles
- Web dashboard for reviewing saved matches

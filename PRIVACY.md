# Privacy Policy — JobAlert Bot

**Last updated:** July 2026

JobAlert Bot ("the Bot", "we", "our") is a WhatsApp-based service that helps users organize and filter job listings they choose to forward to it. This policy explains what information the Bot collects, how it is used, and how it is protected.

## 1. What information we collect

When you message the Bot on WhatsApp, we collect and store:

- **Your WhatsApp phone number** — stored only as a one-way cryptographic hash (SHA-256). We do not store your phone number in plain, readable form, and the hash cannot be reversed to recover your original number.
- **Your stated interests** — the text you send describing the type of roles you're looking for (e.g. "backend development, fintech").
- **Job post content you forward to the Bot** — the text of any job listing message you choose to send us, along with information extracted from it (company, role, location, salary, deadline, application link).
- **Numerical representations (embeddings) of the above text** — used internally to compare job posts for relevance matching and duplicate detection. These are mathematical vectors, not human-readable text.

We do **not** collect, access, or store:
- Any other WhatsApp messages, chats, or contacts
- Any messages from channels or groups you are part of, unless you explicitly forward them to the Bot
- Any content from your device beyond what you send directly to the Bot in conversation

## 2. How we use this information

Information is used solely to:
- Identify returning users so we don't ask for your interests again
- Match forwarded job posts against your stated interests and give you a relevance score
- Detect when a forwarded post is a duplicate of one you've already seen
- Respond to you with a structured summary of the job post

We do not use your information for advertising, profiling, or any purpose beyond operating this bot.

## 3. Data sharing

We do not sell, rent, or share your information with third parties. Data is stored in a managed database (Supabase) and processed by our own backend and NLP services. We use Meta's WhatsApp Business Platform to send and receive messages, subject to [Meta's own privacy policy](https://www.whatsapp.com/legal/privacy-policy).

## 4. Data retention and deletion

You can request deletion of your data at any time by messaging the Bot with "delete my data" (or by contacting us directly, see below). Upon request, we will remove your stored phone number hash, interest profile, and any associated job post records tied to your account.

## 5. Security

Phone numbers are hashed before storage and are never logged or stored in plain text. Access to the underlying database is restricted and protected by row-level security policies.

## 6. Changes to this policy

We may update this policy as the Bot's functionality evolves. Material changes will be reflected here with an updated "Last updated" date.

## 7. Contact

For questions about this policy or to request data deletion, contact: pranesh8506s@gmail.com

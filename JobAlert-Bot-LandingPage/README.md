# JobAlert Bot — Landing Page

A React + Vite + Tailwind landing page for JobAlert Bot, with a WhatsApp click-to-chat button that works on both desktop and mobile.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Before deploying — update this

In `src/components/Hero.jsx` and `src/components/CTA.jsx`, replace the placeholder number in:
```js
const WHATSAPP_LINK = "https://wa.me/15551855354?text=Hi";
```
with your real WhatsApp Business number (once registered), in international format with no `+`, no spaces, e.g. `919876543210`.

## Build for production

```bash
npm run build
```
This outputs a static `dist/` folder — deployable to Render (Static Site), GitHub Pages, Vercel, or Netlify.

## Deploying on Render (Static Site)

1. Push this folder to your GitHub repo
2. Render dashboard → New → Static Site
3. Root Directory: `jobalert-landing` (or wherever this folder lives in your repo)
4. Build Command: `npm install && npm run build`
5. Publish Directory: `dist`

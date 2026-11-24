# For Her ❤️ — Medicine Tracker

A private, mobile-first Next.js medicine checklist prototype for Gargi.

## Current flow
- Welcome popup: “Hello Gargi, How are you today?”
- Shows today's date
- Checklist for D3, B12, Iron, Calcium, MultiVitamin, Allegra, Magnesium
- Save today's selection
- If all are selected: motivational quote + completion message
- If some remain: shows the remaining medicines
- WhatsApp share button creates a pre-filled status message with medicines taken and remaining
- Data currently persists in the browser with localStorage

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Next production step
Add Supabase Auth + PostgreSQL + Row Level Security, then deploy to Vercel. This will make the medicine records private to Gargi's authenticated account. WhatsApp can then be upgraded from a manual pre-filled share to automated WhatsApp Business API messaging if desired.

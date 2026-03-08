# Pulse Post

Automotive inventory management and Facebook Marketplace listing platform by Lotly Auto.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **AI**: Google Gemini API (vehicle description generation, CSV mapping)
- **Hosting**: Cloudflare Pages

## Getting Started

```bash
npm install
npm run dev
```

## Edge Functions

Deploy edge functions to Supabase:

```bash
cd Apps/Post/Pulse-main
npx supabase login
npx supabase link --project-ref jfyfbjybbbsiovihrpal
npx supabase functions deploy --no-verify-jwt
```

## Environment Variables

Required secrets for edge functions (set via `npx supabase secrets set`):
- `GEMINI_API_KEY` — Google Gemini API key
- `STRIPE_SECRET_KEY` — Stripe secret key
- `DATABASE_URL` — Direct Postgres connection string

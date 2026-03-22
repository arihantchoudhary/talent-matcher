# CLAUDE.md

## Auto-Deploy Rule

**After every code change, always run:**
```bash
cd /Users/ari/GitHub/talent-matcher && git add -A && git commit -m "<describe change>" && git push origin main && vercel --prod
```
Do this automatically after every prompt that modifies code. Do not ask for confirmation — just commit, push, and deploy.

## Project Overview

**Talent Matcher** — AI-powered candidate matching and ranking tool. Upload a CSV of candidates, pick a role, get GPT-4o-mini powered rankings, shortlist and export for interviews.

Live at: **https://talent-matcher-seven.vercel.app**
GitHub: **https://github.com/arihantchoudhary/talent-matcher**

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4
- **AI Scoring:** OpenAI GPT-4o-mini via `/api/score` SSE endpoint
- **LinkedIn Enrichment:** Via App Runner backend at `LINKEDIN_API_URL`
- **Deployment:** Vercel (auto-deploy on push + manual `vercel --prod`)

## Env Vars (Vercel)

- `OPENAI_API_KEY` — GPT-4o-mini for scoring candidates
- `LINKEDIN_API_URL` — `https://aicm3pweed.us-east-1.awsapprunner.com` for LinkedIn profile enrichment

## Key Files

- `app/page.tsx` — Entry point
- `app/api/score/route.ts` — SSE scoring endpoint (GPT-4o-mini + LinkedIn enrichment)
- `app/api/enrich/route.ts` — LinkedIn profile enrichment endpoint
- `components/upload-step.tsx` — CSV upload + role picker (30 roles, 30+ cities)
- `components/scoring-step.tsx` — Live progress during scoring
- `components/results-step.tsx` — Ranked results with shortlisting
- `components/checkout-step.tsx` — Export shortlist as CSV/JSON
- `lib/roles.ts` — Role templates library
- `lib/parse-csv-client.ts` — Generic CSV parser (any format)
- `scripts/generate-rankings.ts` — Offline batch scoring CLI

## Running Locally

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

## Important Patterns

- The CSV parser is generic — auto-detects name, LinkedIn URL, photo from ANY CSV column names
- API key fallback: client can pass their own, otherwise uses server `OPENAI_API_KEY` env var
- LinkedIn enrichment is best-effort — appended to candidate text before GPT scoring
- Never commit API keys to git — use env vars only

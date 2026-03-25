# Deployment

Split deployment: static/SSR frontend on Vercel, API backend on AWS App Runner.

## Topology

```
                    ┌──────────────┐
                    │   Vercel     │
                    │  CDN + Edge  │
   Browser ────────→│              │
                    │  Next.js 15  │
                    │  SSR + RSC   │
                    └──────┬───────┘
                           │
                           │ HTTPS
                           ▼
                    ┌──────────────┐
                    │  AWS App     │
                    │  Runner      │
                    │              │
                    │  FastAPI     │
                    │  Python      │
                    └──┬───┬───┬──┘
                       │   │   │
                  ┌────┘   │   └────┐
                  ▼        ▼        ▼
             ┌────────┐ ┌──────┐ ┌──────┐
             │DynamoDB│ │OpenAI│ │  S3  │
             └────────┘ └──────┘ └──────┘
```

## Frontend (Vercel)

### Configuration
- **Framework:** Next.js 15 (auto-detected)
- **Build:** `next build`
- **Node version:** 20.x
- **Region:** Auto (edge-optimized)

### Environment Variables
| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_API_URL` | Client | Backend URL |
| `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` | Client | Stripe price ID |
| `OPENAI_API_KEY` | Server | Fallback GPT key |
| `LINKEDIN_API_URL` | Server | App Runner URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Client | Clerk auth |
| `CLERK_SECRET_KEY` | Server | Clerk auth |

### Deploy Flow
```bash
# Auto-deploy on push
git push origin main → Vercel webhook → build → deploy

# Manual deploy (CLAUDE.md rule)
git add -A && git commit -m "..." && git push origin main && vercel --prod
```

## Backend (AWS App Runner)

### Service
- **URL:** `https://aicm3pweed.us-east-1.awsapprunner.com`
- **Runtime:** Python 3.11
- **Framework:** FastAPI + Uvicorn
- **Auto-scaling:** 1-10 instances
- **Cold start:** ~5-10 seconds

### Why App Runner, Not Lambda?

1. **Long-running requests** — Scoring 93 candidates takes 60+ seconds. Lambda maxes at 15 minutes but charges per-ms.
2. **SSE streaming** — Lambda doesn't natively support SSE. App Runner handles persistent connections.
3. **Persistent state** — LinkedIn DB loaded once in memory, reused across requests. Lambda would reload every cold start.
4. **Simple deployment** — Docker push → auto-deploy. No SAM/CDK complexity.

### Why Not Vercel Edge Functions?

1. **Timeout** — Vercel edge functions have a 30-second timeout (free tier). Scoring exceeds this.
2. **Memory** — LinkedIn DB (~5MB) + concurrent GPT calls need more than edge function limits.
3. **Cost** — App Runner at idle costs ~$0. Under load, it scales to demand.

## Database (DynamoDB)

### Tables
| Table | Purpose | Read/Write |
|-------|---------|-----------|
| `talent-pluto-take-home` | Sessions, candidates | On-demand |
| `linkedin-scrapes` | LinkedIn profiles (493) | Read-heavy |

### Why DynamoDB?

1. **Serverless** — No provisioning, no maintenance
2. **Pay-per-use** — Negligible cost at this scale
3. **Fast reads** — Single-digit ms for session lookups
4. **Schema-flexible** — Session results are heterogeneous JSON

## Monitoring

| Layer | Tool | What |
|-------|------|------|
| Frontend | Vercel Dashboard | Deploy status, edge logs |
| Backend | CloudWatch | App Runner logs, metrics |
| Database | DynamoDB Console | Read/write capacity, throttling |
| AI | OpenAI Dashboard | Token usage, rate limits |

## Related
- [[Architecture Overview]] — System diagram
- [[API Design]] — Endpoint routing
- [[Decision Log]] — Infrastructure choices

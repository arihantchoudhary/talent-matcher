# Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                      │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Upload   │  │ Scoring  │  │ Results  │  │ History│ │
│  │ + Parse  │→ │ + Stream │→ │ + Rank   │  │ + Anal │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│       │              │              │             │      │
│  ┌────┴──────────────┴──────────────┴─────────────┴──┐  │
│  │           ScoringProvider (React Context)          │  │
│  │    Holds: progress, results, logs, error state     │  │
│  └───────────────────────┬───────────────────────────┘  │
│                          │ SSE Stream                    │
└──────────────────────────┼──────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │   Vercel    │
                    │  (Next.js)  │
                    │  Edge + SSR │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
     ┌────────┴───┐  ┌────┴────┐  ┌───┴──────┐
     │  Clerk     │  │ Backend │  │  Stripe  │
     │  (Auth)    │  │ FastAPI │  │ (Billing)│
     └────────────┘  │ App     │  └──────────┘
                     │ Runner  │
                     └────┬────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
        ┌─────┴──┐  ┌────┴───┐  ┌───┴────┐
        │DynamoDB│  │ OpenAI │  │  S3    │
        │Sessions│  │GPT-4o  │  │ Photos │
        │Profiles│  │ -mini  │  │        │
        └────────┘  └────────┘  └────────┘
```

## Component Responsibilities

### Frontend Layer (Vercel / Next.js 15)

| Component | Responsibility | Key File |
|-----------|---------------|----------|
| Landing Page | Marketing, pricing, CTA | `app/page.tsx` |
| Upload Page | CSV parse, role select, rubric config, scoring, results | `app/(dashboard)/upload/page.tsx` |
| Rankings Page | Session history, analytics, filtering | `app/(dashboard)/rankings/page.tsx` |
| Stable Match | Multi-role Gale-Shapley UI | `app/(dashboard)/stable-match/page.tsx` |
| Roles Page | CRUD for role templates | `app/(dashboard)/roles/page.tsx` |
| Settings | API key, subscription, billing | `app/(dashboard)/settings/page.tsx` |
| Scoring Context | Global state across dashboard | `lib/scoring-context.tsx` |

### Backend Layer (AWS App Runner / FastAPI)

The backend is a separate FastAPI service handling:
1. **Scoring pipeline** — Parse → Enrich → GPT Score → Stream
2. **Session CRUD** — DynamoDB persistence
3. **LinkedIn DB** — 493-profile enrichment database
4. **Stripe webhooks** — Subscription lifecycle
5. **Role management** — Custom role persistence

### External Services

| Service | Purpose | Failure Mode |
|---------|---------|-------------|
| OpenAI GPT-4o-mini | Candidate scoring | 3x retry with 1s backoff |
| Clerk | Authentication | Middleware blocks unauthenticated |
| Stripe | Payments | Frontend graceful error |
| DynamoDB | Persistence | localStorage fallback |
| S3 | LinkedIn photos | Placeholder avatar |

## Key Architectural Decisions

→ See [[Decision Log]] for full rationale on each.

1. **SSE over WebSockets** — Simpler, unidirectional, works with Vercel edge
2. **React Context over Redux** — Single concern (scoring state), no need for global store
3. **Backend scoring over edge functions** — Avoids Vercel timeout limits, centralized LinkedIn DB
4. **localStorage fallback** — Graceful degradation when backend is down
5. **GPT-4o-mini over GPT-4** — 4x cheaper, sufficient for structured rubric evaluation

## Related
- [[Data Flow]] — Detailed request lifecycle
- [[API Design]] — Endpoint contracts
- [[Deployment]] — Infrastructure topology

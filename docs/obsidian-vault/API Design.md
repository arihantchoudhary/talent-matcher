# API Design

## Endpoint Catalog

### Backend (FastAPI on App Runner)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/talent-pluto/score` | Score candidates (SSE stream) | API key |
| POST | `/talent-pluto/stable-match` | Multi-role Gale-Shapley | API key |
| GET | `/talent-pluto/sessions` | List user's sessions | User ID |
| GET | `/talent-pluto/sessions/{id}` | Get session detail | User ID |
| POST | `/talent-pluto/sessions` | Save new session | User ID |
| DELETE | `/talent-pluto/sessions/{id}` | Delete session | User ID |
| GET | `/talent-pluto/roles` | Load custom roles | User ID |
| PUT | `/talent-pluto/roles` | Save custom roles | User ID |
| GET | `/talent-pluto/subscription` | Check subscription | `?user_id=` |
| POST | `/talent-pluto/subscription/use` | Increment usage | User ID |
| POST | `/talent-pluto/checkout` | Create Stripe session | User ID |
| POST | `/webhooks` | Stripe webhook | Stripe signature |
| GET | `/linkedin/database` | Load LinkedIn profiles | None |

### Frontend API Routes (Next.js)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/score` | Proxy to backend scoring (SSE) |
| POST | `/api/stable-match` | Proxy to backend stable match (SSE) |

**Note:** The frontend API routes are thin proxies. Scoring moved to the backend to avoid Vercel's edge function timeout limits and to centralize the LinkedIn database.

## Key Contracts

### POST /talent-pluto/score

**Request:**
```json
{
  "candidates": [
    {
      "id": "candidate-0",
      "name": "Jane Smith",
      "fullText": "Jane Smith | jane@gmail.com | 5 years at Google...",
      "linkedinUrl": "https://linkedin.com/in/jane-smith"
    }
  ],
  "job_description": "Founding GTM role at a legal-tech startup...",
  "api_key": "sk-...",
  "top_k": 25,
  "ideal_candidate": "2-3 years consulting, scrappy builder...",
  "criteria": [
    { "name": "Relevant Experience", "weight": 25 },
    { "name": "Industry Fit", "weight": 15 },
    { "name": "Sales Capability", "weight": 20 },
    { "name": "Stakeholder Presence", "weight": 15 },
    { "name": "Cultural Fit", "weight": 20 },
    { "name": "Location", "weight": 5 }
  ]
}
```

**Response:** SSE stream (see [[Data Flow]] for event protocol)

### POST /talent-pluto/sessions

**Request:**
```json
{
  "role": "Founding GTM, Legal",
  "role_category": "Sales",
  "description": "...",
  "file_name": "candidates.csv",
  "candidate_count": 93,
  "top_tier": 13,
  "good_fit": 42,
  "avg_score": 58,
  "results": [...],
  "duration": 41,
  "user_id": "user_abc123",
  "user_name": "Ari Choudhary",
  "device": "desktop",
  "tokens": 85230,
  "cost": 0.0234,
  "judge": "John"
}
```

### POST /talent-pluto/checkout

**Request:**
```json
{
  "user_id": "user_abc123",
  "price_id": "price_xxx"
}
```

**Response:**
```json
{
  "checkout_url": "https://checkout.stripe.com/..."
}
```

## Design Principles

1. **Backend does the heavy lifting** — GPT calls, LinkedIn enrichment, session storage. Frontend is a thin client.
2. **SSE for long operations** — Scoring and stable matching both stream progress. No polling.
3. **Graceful degradation** — If backend is down, localStorage catches sessions. If LinkedIn fails, scoring continues.
4. **API key flexibility** — Client can provide their own OpenAI key or fall back to server key.

## Related
- [[Architecture Overview]] — System topology
- [[Data Flow]] — Request lifecycle
- [[Session Persistence]] — DynamoDB schema

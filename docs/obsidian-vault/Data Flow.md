# Data Flow

## Primary Flow: Score 93 Candidates

This is the critical path — the entire product value proposition in one request.

```
User drags CSV ──→ parseCSV() ──→ Select Role ──→ Configure Rubric ──→ Click "Score"
                      │                                                      │
                      ▼                                                      ▼
              93 Candidate objects                              POST /talent-pluto/score
              { id, name, fullText,                             { candidates[], job_description,
                linkedinUrl }                                     criteria[], ideal_candidate,
                                                                  api_key, top_k }
                                                                       │
                                                                       ▼
                                                              ┌─── Backend Pipeline ───┐
                                                              │                        │
                                                              │  1. Load LinkedIn DB   │
                                                              │     (493 profiles)     │
                                                              │                        │
                                                              │  2. For each candidate:│
                                                              │     a. Parse fields    │──→ SSE: log(parse)
                                                              │     b. Enrich LinkedIn │──→ SSE: log(enrich)
                                                              │     c. Call GPT-4o-mini│──→ SSE: log(score)
                                                              │     d. Calculate cost  │──→ SSE: scored(result)
                                                              │                        │
                                                              │  3. SSE: done          │
                                                              └────────────────────────┘
                                                                       │
                                                                       ▼
                                                              Frontend receives stream:
                                                              - Update progress bar
                                                              - Append to results[]
                                                              - Sort by score
                                                              - Update live log
                                                                       │
                                                                       ▼
                                                              Scoring complete:
                                                              - Tier candidates
                                                              - Build histogram
                                                              - Calculate stats
                                                              - Save session
```

## SSE Event Protocol

The frontend-backend communication uses Server-Sent Events with a typed message protocol:

| Event Type | Payload | When |
|-----------|---------|------|
| `start` | `{ total: number }` | Pipeline begins |
| `enriched` | `{ count: number }` | LinkedIn DB loaded, X profiles matched |
| `log` | `{ index, name, step, detail }` | Per-candidate per-step progress |
| `scored` | `{ index, id, name, score, reasoning, highlights, gaps, tokens, cost }` | One candidate fully scored |
| `done` | `{}` | All candidates processed |
| `error` | `{ message }` | Fatal error |

### Why SSE, Not WebSockets?

1. **Unidirectional** — Server pushes to client only. No client-to-server messages needed during scoring.
2. **Vercel-compatible** — Edge functions support streaming responses natively. WebSockets require separate infra.
3. **Auto-reconnect** — Built into the EventSource API (though we use ReadableStream for more control).
4. **Simpler** — No connection upgrade, no ping/pong, no state management.

## Secondary Flows

### Session Persistence
```
Scoring Complete → POST /talent-pluto/sessions
                        │
                   ┌────┴────┐
                   │ Success  │──→ DynamoDB
                   │ Failure  │──→ localStorage (max 50 sessions)
                   └─────────┘
```

### Stable Matching
```
Upload N CSVs (one per role)
     │
     ▼
Score each candidate × each role (N×M GPT calls)
     │
     ▼
Build preference matrices
     │
     ▼
Run Gale-Shapley algorithm
     │
     ▼
Output: optimal role→candidate assignments
```

### Stripe Checkout
```
Click "Upgrade to Pro"
     │
     ▼
POST /talent-pluto/checkout { user_id, price_id }
     │
     ▼
Redirect → Stripe Checkout Session
     │
     ▼
Payment → Stripe Webhook → POST /webhooks
     │
     ▼
Update subscription in DynamoDB
```

## Data Transformations

### CSV → Candidate Object
```typescript
// Input: raw CSV string (any format)
"Name,Email,Experience\nJane Smith,jane@...,5 years at Google"

// Output: structured candidate
{
  id: "candidate-0",
  name: "Jane Smith",               // detected via 7-level fallback
  fullText: "Jane Smith | jane@... | 5 years at Google",
  linkedinUrl: "https://linkedin.com/in/jane-smith"  // if found in any field
}
```

### Candidate → GPT Scoring Prompt
```
System: You are evaluating a candidate for {job_title}.
        Score on these criteria: {criteria with weights}.

User: Candidate profile: {fullText + LinkedIn enrichment}
      Rate 0-100 overall.

Response: { score: 78, reasoning: "...", highlights: [...], gaps: [...] }
```

### Scored Results → Tiered Display
```
Score ≥ 70  → Top Tier    (green badge)
Score 50-69 → Good Fit    (blue badge)
Score 30-49 → Moderate    (yellow badge)
Score < 30  → Low Fit     (gray badge)
```

## Related
- [[Scoring Engine]] — GPT prompt construction and retry logic
- [[CSV Parser]] — Name detection algorithm details
- [[Session Persistence]] — DynamoDB schema and fallback strategy

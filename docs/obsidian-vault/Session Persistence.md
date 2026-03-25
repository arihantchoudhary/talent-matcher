# Session Persistence

Every scoring run is saved for historical analysis, comparison, and audit.

## Dual Storage Strategy

```
Scoring Complete
      │
      ├──→ POST /talent-pluto/sessions → DynamoDB (primary)
      │         │
      │    ┌────┴────┐
      │    │ Success  │──→ Done
      │    │ Failure  │──→ Fall through to localStorage
      │    └─────────┘
      │
      └──→ localStorage['talent-matcher-sessions'] (fallback)
           Max 50 sessions, FIFO eviction
```

### Why Dual Storage?

1. **Backend cold starts** — App Runner can take 5-10s on first request. If the POST times out, we don't lose the run.
2. **Offline resilience** — User on flaky wifi still gets their results saved.
3. **Cost protection** — A scoring run costs $0.02-0.14 in API fees. Losing that data wastes money.

## Session Schema

```typescript
interface Session {
  id: string;              // UUID
  role: string;            // "Founding GTM, Legal"
  role_category: string;   // "Sales"
  description: string;     // Job description text
  file_name: string;       // "candidates.csv"
  candidate_count: number; // 93
  top_tier: number;        // Candidates scoring ≥70
  good_fit: number;        // Candidates scoring 50-69
  avg_score: number;       // Mean score across all candidates
  results: ScoredCandidate[];
  duration: number;        // Seconds elapsed
  user_id: string;         // Clerk user ID
  user_name: string;       // Display name
  device: string;          // "desktop" | "mobile"
  tokens: number;          // Total tokens used
  cost: number;            // Total API cost in dollars
  judge: string;           // "John" | "Jake" | etc.
  created_at: string;      // ISO timestamp
}
```

## Session Analytics (Rankings Page)

The rankings page aggregates across sessions:

```
┌─────────────────────────────────────────────┐
│ All Sessions                                 │
│                                              │
│ Total Runs: 5        Unique Candidates: 312  │
│ Avg Score: 58.3      Total Cost: $0.47       │
│                                              │
│ ┌─── By Role ──────────────────────────────┐ │
│ │ Founding GTM (3 runs)                    │ │
│ │   Mar 22 | John | 93 candidates | $0.14  │ │
│ │   Mar 22 | Jake | 93 candidates | $0.14  │ │
│ │   Mar 22 | Nazar | 25 candidates | $0.04 │ │
│ │                                          │ │
│ │ Enterprise AE (2 runs)                   │ │
│ │   Mar 22 | Christian | 50 cand. | $0.08  │ │
│ │   Mar 22 | Yash | 50 candidates | $0.08  │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Filter by Judge: [All] [John] [Jake] ...     │
└─────────────────────────────────────────────┘
```

### Unique Candidate Count

**Subtle bug fixed:** Initially showed sum of all candidate_counts across runs. But the same CSV might be scored multiple times (different judges). Fix: deduplicate by `file_name` to show unique candidates per CSV.

## DynamoDB Design

```
Table: talent-pluto-take-home

PK: session_id (String, UUID)
SK: created_at (String, ISO)

GSI: user_id-index
  PK: user_id
  SK: created_at

Attributes:
  - All session fields (see schema above)
  - results stored as JSON string (compressed)
```

## Related
- [[State Management]] — How sessions fit in the state layers
- [[API Design]] — Session CRUD endpoints
- [[Data Flow]] — When sessions are created

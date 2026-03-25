# State Management

Three layers of state, each with a clear responsibility.

## Layer 1: React Context (Global UI State)

### ScoringProvider
**File:** `lib/scoring-context.tsx`

```typescript
interface ScoringState {
  isScoring: boolean;
  progress: { done: number; total: number };
  results: ScoredCandidate[];
  logs: Log[];
  jobTitle: string;
  error: string | null;
}
```

**Why Context, not Redux?**

Single concern. All global state relates to one thing: the scoring pipeline. No need for:
- Multiple reducers
- Middleware
- Action types
- Selector patterns

Context handles it cleanly because:
1. State is read by 2-3 components (scoring page, nav progress indicator)
2. Updates are infrequent (one per scored candidate, not 60fps)
3. No derived/computed state complexity

### What it solves

**Tab navigation during scoring.** Without context, switching from the scoring tab to settings and back would lose the SSE connection and all results. ScoringProvider lives at the dashboard layout level, surviving tab changes.

## Layer 2: Component State (Local UI State)

Each page manages its own UI state via `useState`:

### Upload Page
```
- step: "setup" | "scoring" | "results"
- csvText, fileName (uploaded file)
- selectedRole (from picker)
- criteria[] (rubric weights)
- judge (selected preset)
- idealCandidate (text)
- topK (10/25/50/100/all)
- viewMode ("list" | "card" | "table")
- expandedCandidate (for detail view)
- scoreFilter (histogram bucket click)
- manualRanks (after reranking)
```

### Rankings Page
```
- sessions[] (loaded from backend)
- selectedSession (detail view)
- filter (by judge, by role)
- groupBy ("role" | "judge" | "date")
```

### Settings Page
```
- subscription (plan info)
- apiKey (from localStorage)
```

## Layer 3: Persistent State

### DynamoDB (Backend)
```
Sessions table:
  PK: session_id (UUID)
  SK: user_id
  Fields: role, results[], timestamps, cost, tokens, judge

LinkedIn profiles table:
  PK: url (normalized)
  Fields: name, headline, experience, education, skills, photo

Subscriptions table:
  PK: user_id
  Fields: plan, postings_used, postings_limit, stripe_customer_id
```

### localStorage (Client Fallback)

| Key | Purpose | Limit |
|-----|---------|-------|
| `talent-matcher-sessions` | Session backup | Max 50 |
| `talent-matcher-openai-key` | User's API key | Single key |

### Why localStorage Fallback?

The backend (App Runner) occasionally has cold starts or connectivity issues. Rather than losing a scoring run (which took 60+ seconds and cost money), the fallback saves results locally. Next time the backend is reachable, sessions can be synced.

## State Flow Diagram

```
User Action → Component State → (optionally) Context → (optionally) Backend
     ↑                                                         │
     └─────── Re-render ←── Context Change ←── SSE Event ─────┘
```

## Related
- [[Scoring Engine]] — What generates the state updates
- [[Session Persistence]] — DynamoDB storage details
- [[Architecture Overview]] — Where state fits in the system

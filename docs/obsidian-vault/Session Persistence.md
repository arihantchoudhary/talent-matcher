# Session Persistence

**Read this out loud in 4 points:**

1. **Every scoring run is saved with full metadata: results, role, judge used, cost, token count, duration, device type.** This isn't just saving results — it's building an audit trail. You can go back and see exactly how a scoring run was configured, what it cost, and which candidates surfaced.

2. **Dual storage: DynamoDB (primary) + localStorage (fallback).** A scoring run costs real money ($0.02-0.14). If the backend is slow (App Runner cold start) or the network hiccups, localStorage catches the save immediately. Max 50 sessions in localStorage with oldest-first eviction.

3. **The history page aggregates across sessions** — total runs, unique candidates scored, average score, total cost. Sessions can be grouped by role or by judge, filtered by judge, and drilled into for full result detail with the same histogram and tier view as the scoring page.

4. **A stale closure bug almost shipped: judge, cost, and tokens were saving as null.** The SSE handler captured state from render time, not from when scoring completed. By the time the save function ran, it had old references. Fix: `useRef` to hold current values so the save function always reads the latest state. Classic React hooks pitfall.

---

## If they probe deeper

**"What's the DynamoDB schema?"** — Primary key: `session_id` (UUID). Sort key: `created_at`. GSI on `user_id` for per-user queries. Results stored as a JSON string.

**"Why not just localStorage?"** — No cross-device access. If you score on your laptop and review on your phone, DynamoDB has both. localStorage is a safety net, not the source of truth.

**"What about the unique candidate count bug?"** — The history page initially summed `candidate_count` across all runs. Scoring the same 93-candidate CSV 3 times showed "279 unique candidates." Fixed by deduplicating on `file_name` — three runs of the same CSV = 93 unique candidates.

## See also
- [[State Management]] — How sessions fit in the state layers
- [[API Design]] — Session CRUD endpoints

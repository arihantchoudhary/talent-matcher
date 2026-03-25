# Decision Log

Key architectural and product decisions with rationale. These are the "why" behind the "what."

## Architecture Decisions

### D1: SSE over WebSockets
**Context:** Need real-time progress during 60-second scoring runs.
**Decision:** Server-Sent Events via ReadableStream.
**Why:**
- Unidirectional (server→client only) — no need for client-to-server during scoring
- Works with Vercel edge and App Runner without extra infrastructure
- Auto-reconnect built into EventSource API
- Simpler than WebSocket lifecycle management
**Trade-off:** Can't cancel mid-stream from client (must abort the fetch). Acceptable because cancellation is rare.

### D2: React Context over Redux/Zustand
**Context:** Scoring state (progress, results, logs) needs to survive tab navigation.
**Decision:** Single React Context at dashboard layout level.
**Why:**
- One concern: scoring pipeline state
- 2-3 consumers only
- Low update frequency (~1/second during scoring)
- No derived/computed state complexity
**Trade-off:** Can't easily add unrelated global state later. Acceptable because the app has a focused scope.

### D3: Backend Scoring over Edge Functions
**Context:** Initially scoring ran in Vercel API routes. Hit timeout limits.
**Decision:** Moved scoring to FastAPI on App Runner.
**Why:**
- Vercel edge: 30s timeout (free), 300s (Pro). Scoring can take 60s+.
- App Runner: no timeout limit, persistent connections
- LinkedIn DB (5MB) loads once and stays in memory
- Centralized logging and cost tracking
**Trade-off:** Added operational complexity (two deployment targets). Worth it for reliability.

### D4: Hand-Written CSV Parser
**Context:** Need to parse arbitrary recruiter CSV formats.
**Decision:** Custom parser instead of `papaparse` or `csv-parse`.
**Why:**
- Need deep control for simultaneous structure parsing + column inference
- Need 7-level name detection fallback (no library offers this)
- Zero bundle size overhead
- ~140 lines of focused code
**Trade-off:** Must maintain parser for edge cases. The test suite mitigates this.

### D5: GPT-4o-mini over GPT-4
**Context:** Choosing AI model for candidate scoring.
**Decision:** GPT-4o-mini.
**Why:**
- 4x cheaper ($0.15/1M in vs $0.60/1M)
- 2x faster latency
- Structured rubric constrains the output space — mini handles it well
- At $0.14/run, the product can have a free tier
**Trade-off:** Slightly less nuanced reasoning. Acceptable because the rubric provides evaluation structure.

### D6: Gale-Shapley over Greedy Assignment
**Context:** Assigning candidates to multiple roles optimally.
**Decision:** Gale-Shapley deferred acceptance algorithm.
**Why:**
- Provably optimal (role-optimal) matching
- No swaps can improve both parties (stable)
- O(n*m) complexity — runs in <1ms for 50 candidates × 3 roles
- Well-understood algorithm with 60 years of research
**Trade-off:** Requires scoring every candidate for every role (multiplicative API calls). Mitigated by embedding pre-filter.

### D7: HyDE Embedding Pre-Filter
**Context:** Scoring all candidates is expensive. Need a pre-filter.
**Decision:** Hypothetical Document Embedding using ideal candidate profile.
**Why:**
- Standard query-document similarity fails: job descriptions and resumes are different document types
- HyDE aligns the embedding spaces by comparing resume-like texts
- Judge presets already contain ideal candidate descriptions — free HyDE input
- Embeddings cost ~$0.001 for 100 candidates vs $0.14 for GPT scoring
**Trade-off:** May miss candidates with non-obvious fit. Mitigated by "All" option that skips pre-filter.

## Product Decisions

### D8: Named Judges over Anonymous Sliders
**Context:** Rubric weights need a UI.
**Decision:** 5 named judge personas (John, Jake, Christian, Yash, Nazar) instead of plain sliders.
**Why:**
- Recruiters think in personas ("I want someone like Jake who finds hunters")
- Named presets are faster than configuring 6 sliders
- Creates a "team" metaphor — different judges evaluate the same pool differently
- Makes the product memorable and conversational
**Trade-off:** Custom rubric still available for power users.

### D9: B&W Editorial Design
**Context:** Every AI product looks the same — purple gradients, "magic" metaphors.
**Decision:** Black and white, Newsreader serif headings, no color accents.
**Why:**
- Recruiting is high-stakes. The UI should feel authoritative.
- Differentiation: looks nothing like competitors
- Forces information hierarchy through typography, not color
- Reduces visual noise — focus on the data
**Trade-off:** Less "exciting" first impression. But the product sells on substance, not style.

### D10: Usage-Based Billing (Per-Posting)
**Context:** Monetization model.
**Decision:** Charge per job posting (scoring run), not per seat or per candidate.
**Why:**
- Aligns with how recruiters think ("I have 5 roles to fill this month")
- Low-volume users get free tier (3 postings)
- High-volume users self-select into paid tiers
- API costs are per-run, so billing matches cost structure
**Trade-off:** Unpredictable revenue vs. seat-based. Acceptable at early stage.

### D11: localStorage Session Fallback
**Context:** Backend may be unavailable during scoring.
**Decision:** Always save to localStorage. Attempt backend save in parallel.
**Why:**
- A scoring run costs money ($0.02-0.14). Losing results = losing money.
- App Runner cold starts can timeout
- localStorage is instant, zero-failure
- Max 50 sessions with FIFO eviction prevents storage bloat
**Trade-off:** No cross-device session access without backend. Acceptable for MVP.

### D12: Clerk over Auth.js/NextAuth
**Context:** Need authentication quickly.
**Decision:** Clerk managed auth service.
**Why:**
- Zero config: `<ClerkProvider>` + middleware
- Built-in user profiles, social login, session management
- React hooks for user data (`useUser()`, `useAuth()`)
- Production-ready security without writing auth code
**Trade-off:** Vendor lock-in, branding on free tier (removed via CSS hacks). Acceptable for speed.

## Related
- [[Architecture Overview]] — See decisions in context
- [[Build Phases]] — When each decision was made

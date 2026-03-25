# State Management

**Read this out loud in 4 points:**

1. **Three layers of state: React Context (global UI), component state (local UI), and persistent storage (DynamoDB + localStorage).** Each layer has a clear job. Context holds scoring progress that must survive tab navigation. Component state holds page-specific things like which view mode is active. Persistent storage keeps session history and subscription data across browser sessions.

2. **React Context was chosen over Redux because there's only one global concern: the scoring pipeline.** One provider, one state object, 2-3 consumers. No derived state, no middleware, no action types. If the app grows more global concerns, each can get its own Context. Premature abstraction (Redux toolkit) would add complexity for no value at this scale.

3. **The scoring Context lives at the dashboard layout level, not the app root.** Only protected routes need scoring state. The landing page and auth pages don't participate. This means the provider wraps `/upload`, `/rankings`, `/settings` etc. but not `/` or `/sign-in`.

4. **localStorage is a fallback, not primary storage.** DynamoDB is authoritative for sessions and subscriptions. localStorage catches saves when the backend is unreachable (cold starts, network issues). Max 50 sessions with FIFO eviction to prevent storage bloat. The user's OpenAI API key is also in localStorage — it never leaves the browser.

---

## If they probe deeper

**"What's in the scoring context state?"** — `{ isScoring, progress: { done, total }, results: ScoredCandidate[], logs: Log[], jobTitle, error }`. That's it. Simple.

**"What was the bug that made Context necessary?"** — Without it, starting a 60-second scoring run, clicking to Settings, and coming back would show a blank page — the SSE connection was dead and all results were gone. Context preserves the stream state across navigation.

**"Why not Zustand?"** — Same reason as Redux: overkill for one concern. Zustand is great when you have multiple stores with complex selectors. Here, one Context with one setState does the job.

## See also
- [[Architecture Overview]] — Where state fits in the system
- [[Session Persistence]] — How sessions are stored long-term

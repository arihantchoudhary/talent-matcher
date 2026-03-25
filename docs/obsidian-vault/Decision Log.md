# Decision Log

**Read this out loud in 4 points:**

1. **SSE over WebSockets, React Context over Redux, App Runner over Lambda.** Every infrastructure choice optimized for simplicity. SSE is one-directional (all we need). Context has one concern (scoring state). App Runner has no timeout limits and keeps the LinkedIn DB in memory. Each choice is the simplest tool that solves the specific problem.

2. **GPT-4o-mini over GPT-4, HyDE over standard embeddings, hand-written CSV parser over libraries.** Every technical choice optimized for the right trade-off. Mini is 4x cheaper and sufficient for rubric evaluation. HyDE aligns embedding spaces by comparing resume-to-resume. Custom parser gives column-inference capability that no library provides.

3. **Named judges over sliders, B&W over gradients, usage-based billing over seat-based.** Every product choice optimized for how recruiters actually think. Recruiters think in personas ("I want a closer"), not percentages. B&W signals authority in a high-stakes domain. Per-posting billing matches cost structure and mental model ("I have 5 roles to fill").

4. **Stripe moved to backend within 4 minutes, scoring moved to backend within one commit cycle, multi-page collapsed to single-page at hour 2.** The fastest decisions were the reversals — recognizing when an approach hits a ceiling and replatforming immediately. The sign of systems thinking isn't getting it right the first time, it's recognizing the wrong path fast.

---

## If they probe deeper on any specific decision

**"Why localStorage fallback?"** — A scoring run costs $0.02-0.14. Losing results because the backend cold-started is unacceptable. localStorage is instant, zero-failure, and prevents data loss. Trade-off: no cross-device access without backend.

**"Why Gale-Shapley over greedy?"** — Greedy creates conflicts (all candidates cluster on one role). Gale-Shapley is provably optimal and stable. Runs in <1ms. The expense is in the N×M GPT calls, not the algorithm.

**"Why Clerk over NextAuth?"** — Speed. 15 minutes to working auth vs 2+ hours. Trade-off is vendor lock-in and branding on free tier (removed via CSS). For a take-home, managed auth = focus on the product.

**"Why DynamoDB over Postgres?"** — Sessions are heterogeneous JSON blobs. DynamoDB is schema-flexible, serverless, and sub-millisecond. No migration files, no connection pooling, no maintenance.

## See also
- [[Build Phases]] — When each decision was made
- [[Development Timeline]] — The full chronological story

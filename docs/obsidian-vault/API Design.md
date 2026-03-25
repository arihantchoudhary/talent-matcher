# API Design

**Read this out loud in 4 points:**

1. **The backend has 12 endpoints split into 4 groups: scoring, sessions, roles, and billing.** Scoring is the core (score candidates, run stable matching). Sessions are CRUD for saving/loading scoring runs. Roles are CRUD for job templates. Billing handles Stripe checkout and subscription tracking.

2. **Scoring endpoints return SSE streams, not JSON responses.** Because scoring takes 60+ seconds, a normal POST that returns JSON would timeout. Instead, the response is a stream of typed events — one per candidate scored — so the frontend gets real-time updates without polling.

3. **The frontend API routes are thin proxies.** Next.js has `/api/score` and `/api/stable-match` routes, but they just forward to the App Runner backend. The actual logic (GPT calls, LinkedIn DB, session storage) lives server-side. This keeps the frontend lightweight and avoids Vercel timeout issues.

4. **API key flexibility: the client can provide their own OpenAI key, or fall back to the server's key.** Power users who want to use their own quota send `api_key` in the request body. Everyone else uses the platform's key via env var. Both missing = error.

---

## If they probe deeper

**"What's the scoring request body look like?"** — `{ candidates[], job_description, api_key, top_k, ideal_candidate, criteria[] }`. Criteria is an array of `{ name, weight }` objects that come from the judge preset or custom slider values.

**"How does the Stripe webhook work?"** — Stripe POSTs to `/webhooks` when a payment succeeds. The backend verifies the Stripe signature, extracts the user_id from the checkout session metadata, and updates their subscription in DynamoDB (plan → "pro", limit → 25).

**"Why DynamoDB for sessions?"** — Schema-flexible (sessions have different result shapes per role), serverless (zero ops), sub-millisecond reads. The session data is a JSON blob with heterogeneous content — relational would require normalizing into many tables.

## See also
- [[Architecture Overview]] — System topology
- [[Data Flow]] — Full request lifecycle
- [[Payments]] — Stripe integration details

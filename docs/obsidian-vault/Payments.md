# Payments (Stripe)

**Read this out loud in 4 points:**

1. **Billing is usage-based: each scoring run costs one "posting."** Free gets 3 postings/month, Pro ($49/mo) gets 25. This aligns with how recruiters think ("I have 5 roles to fill") and mirrors the platform's cost structure (each run costs $0.02-0.14 in API fees).

2. **The checkout flow goes: frontend → backend → Stripe → webhook → DynamoDB.** User clicks "Upgrade to Pro," frontend calls the backend to create a Stripe Checkout Session, user is redirected to Stripe's hosted page, payment succeeds, Stripe sends a webhook to the backend, backend updates the subscription in DynamoDB.

3. **Stripe was moved from frontend to backend within 4 minutes of initial implementation.** First commit had Stripe directly in Next.js. Immediately realized: webhook verification needs a server-side secret, DynamoDB updates are server-side, and the Stripe secret key should never be in frontend env vars. Replatformed to FastAPI backend.

4. **Usage is tracked per scoring run.** After each successful scoring, the frontend calls `POST /subscription/use` which increments `postings_used`. If `postings_used >= postings_limit`, the endpoint returns 402 and the UI shows an upgrade prompt.

---

## If they probe deeper

**"Why per-posting instead of per-seat?"** — Per-seat billing penalizes small teams. A solo recruiter filling 20 roles pays the same as a team of 5 filling 4 roles each. Per-posting is fairer and simulates actual platform cost.

**"What about the free tier economics?"** — 3 postings × ~$0.04 (with top-25 pre-filter) = $0.12/month per free user. At scale, free users either convert or cost very little. The HyDE pre-filter is what makes the free tier viable.

**"How does the price ID fallback work?"** — Stripe price IDs differ between test and live mode. The env var `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` is authoritative. A hardcoded fallback prevents broken checkout if the env var is missing in development.

## See also
- [[Architecture Overview]] — Payment flow in system context
- [[API Design]] — Checkout and webhook endpoints
- [[Embedding Pre-Filter]] — How pre-filtering makes free tier viable

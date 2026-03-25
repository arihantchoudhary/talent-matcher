# Deployment

**Read this out loud in 4 points:**

1. **Frontend on Vercel, backend on AWS App Runner.** Vercel serves the Next.js app (SSR, edge functions, CDN). App Runner runs the FastAPI backend (GPT scoring, LinkedIn DB, DynamoDB). The split exists because Vercel has a 30-second timeout — scoring takes 60+ seconds.

2. **App Runner was chosen over Lambda for three reasons: no timeout limits, SSE streaming support, and persistent memory.** Lambda maxes at 15 minutes and doesn't natively support SSE. App Runner keeps the 5MB LinkedIn database in memory between requests — Lambda would cold-start and reload it every time.

3. **Deployment is automated: push to main triggers Vercel, plus a manual `vercel --prod` for immediate deploys.** The CLAUDE.md file has a rule: after every code change, commit, push, and deploy. No manual deployment steps to forget.

4. **DynamoDB for persistence, S3 for photos, OpenAI for scoring.** DynamoDB is serverless and pay-per-use (negligible cost at this scale). S3 hosts LinkedIn profile photos. OpenAI is the only metered external service — cost per run is tracked and displayed to the user.

---

## If they probe deeper

**"Why not just use Vercel Pro to get longer timeouts?"** — Could work, but App Runner is better architecturally. It centralizes all backend logic (scoring, enrichment, sessions, billing) in one service. Splitting logic across Vercel edge functions and a backend creates unnecessary coupling.

**"What does App Runner cost at idle?"** — Near zero. It scales to zero when no requests are active. Under load, it auto-scales up to 10 instances. For this assessment with occasional scoring runs, the cost is effectively zero.

**"Any monitoring?"** — Vercel dashboard for frontend deploys and edge logs. CloudWatch for App Runner application logs. DynamoDB console for read/write metrics. OpenAI dashboard for token usage. No custom instrumentation (Sentry, Datadog) — that's a production hardening step.

## See also
- [[Architecture Overview]] — System topology
- [[API Design]] — Endpoint routing

# Architecture Overview

**Read this out loud in 4 points:**

1. **Three layers: browser, Vercel, and AWS backend.** The browser handles the UI — uploading CSVs, configuring the rubric, viewing results. Vercel serves the Next.js app and handles auth via Clerk. The AWS App Runner backend does the heavy lifting — calling GPT, querying the LinkedIn database, storing sessions in DynamoDB.

2. **The browser talks to the backend through SSE (Server-Sent Events).** When you hit "Score," the frontend opens a streaming connection to the backend. As each candidate gets scored, the backend pushes an event. The frontend updates a live progress bar and leaderboard. This is one-way (server to client only), which is simpler than WebSockets and works natively with Vercel.

3. **Every external service has a failure mode.** If OpenAI fails, we retry 3 times. If the LinkedIn database is slow, we skip enrichment and score with CSV data only. If DynamoDB is down, we save sessions to localStorage. If S3 is down, we show placeholder avatars. Nothing is allowed to break the scoring pipeline.

4. **The frontend is a single-page dashboard with React Context.** One React Context holds all the scoring state — progress, results, logs. This means if you start scoring 93 candidates and switch to the Settings tab to check something, your results are still there when you switch back. Without this, navigating away would kill the SSE connection and lose everything.

---

## If they probe deeper

**"Why not WebSockets?"** — SSE is one-directional (server → client), which is all we need. WebSockets would add connection lifecycle management, ping/pong, and reconnection logic for no benefit. SSE also works natively with Vercel's edge runtime.

**"Why split frontend and backend?"** — Vercel edge functions timeout at 30 seconds on the free tier. Scoring 93 candidates takes 60+ seconds. App Runner has no timeout limit and keeps the LinkedIn DB in memory between requests.

**"Why DynamoDB, not Postgres?"** — Sessions are JSON blobs with different shapes depending on the role. DynamoDB's schema-flexible model fits better than relational. It's also serverless (zero maintenance) and single-digit millisecond reads.

**"Why Clerk for auth?"** — Zero config. `<ClerkProvider>` wraps the app, a middleware file protects routes. Auth was working in 15 minutes, not 2 hours. Trade-off is vendor lock-in and branding on the free tier (removed via CSS).

## See also
- [[Data Flow]] — The full request lifecycle, step by step
- [[Decision Log]] — Every major trade-off with rationale
- [[Deployment]] — How frontend and backend are deployed

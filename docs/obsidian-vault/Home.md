# Talent Matcher — Systems Design Vault

**What it is:** An AI-powered candidate matching and ranking tool. Upload a CSV of candidates, pick a role, get ranked results with evidence for every score.

**How I think about it in 4 points:**

1. **The core pipeline is Parse → Enrich → Score → Rank.** Every CSV row gets parsed into a candidate, enriched with LinkedIn data, scored by GPT-4o-mini against a configurable rubric, and ranked with per-criterion evidence. The whole thing streams in real-time via SSE so the user sees candidates appearing on a live leaderboard.

2. **The architecture is a split frontend/backend.** Next.js on Vercel handles the UI and auth. A FastAPI service on AWS App Runner handles the heavy lifting — GPT calls, LinkedIn enrichment, session storage. This split exists because Vercel has a 30-second timeout and scoring takes 60+ seconds.

3. **The product insight is that AI scoring only works if the recruiter controls the rubric.** Five named "judges" (John, Jake, Christian, Yash, Nazar) represent different hiring philosophies — a scrappy-builder mindset vs. a pedigree-seeker vs. a deal-closer. The recruiter picks a judge, and that changes the weights, the ideal candidate profile, and ultimately the rankings.

4. **Built in 21 hours, 100+ commits, 8 phases.** Scaffold → Foundation → AI Scoring → Advanced Features (Gale-Shapley) → Analytics → Rubric Perspectives → Design Polish → Production Ready (Stripe, HyDE, mobile).

---

## Dig Deeper

| If they ask about... | Go to |
|---------------------|-------|
| How the system fits together | [[Architecture Overview]] |
| How data moves through the system | [[Data Flow]] |
| How AI scoring works | [[Scoring Engine]] |
| How instant/free scoring works | [[Rapid Match]] |
| How CSVs get parsed | [[CSV Parser]] |
| How LinkedIn data improves scoring | [[LinkedIn Enrichment]] |
| How multi-role matching works | [[Stable Matching]] |
| How the rubric system works | [[Rubric System]] |
| How you optimize cost with embeddings | [[Embedding Pre-Filter]] |
| What APIs exist | [[API Design]] |
| How state is managed | [[State Management]] |
| How auth works | [[Authentication]] |
| How billing works | [[Payments]] |
| How sessions are stored | [[Session Persistence]] |
| How it's deployed | [[Deployment]] |
| The visual design choices | [[Design System]] |
| Mobile design | [[Mobile Responsiveness]] |
| The design audit process | [[Design Audit Trail]] |
| Why you made specific trade-offs | [[Decision Log]] |
| The chronological build story | [[Development Timeline]] |
| Detailed phase-by-phase breakdown | [[Build Phases]] |

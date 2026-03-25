# Talent Matcher — Systems Design Vault

> AI-powered candidate matching and ranking platform. Built as a take-home assessment, shipped as a production SaaS.

## Quick Links

### Architecture
- [[Architecture Overview]] — High-level system diagram and component map
- [[Data Flow]] — End-to-end request lifecycle
- [[API Design]] — Endpoint catalog and contracts
- [[State Management]] — Client, server, and persistent state

### Core Systems
- [[Scoring Engine]] — GPT-4o-mini scoring pipeline with SSE streaming
- [[CSV Parser]] — Generic parser with 7-level name detection fallback
- [[LinkedIn Enrichment]] — Best-effort profile augmentation
- [[Stable Matching]] — Gale-Shapley multi-role assignment algorithm
- [[Rubric System]] — Configurable scoring perspectives ("judges")
- [[Embedding Pre-Filter]] — HyDE-based candidate pre-filtering with top-K

### Infrastructure
- [[Authentication]] — Clerk integration and route protection
- [[Payments]] — Stripe subscription and usage-based billing
- [[Session Persistence]] — DynamoDB + localStorage fallback
- [[Deployment]] — Vercel frontend + AWS App Runner backend

### Design
- [[Design System]] — B&W editorial aesthetic, typography, animations
- [[Mobile Responsiveness]] — Responsive patterns and breakpoints
- [[Design Audit Trail]] — Iterative visual polish findings

### Process
- [[Development Timeline]] — Phase-by-phase build log
- [[Decision Log]] — Key architectural trade-offs and rationale
- [[Build Phases]] — 8 phases from scaffold to monetization

---

## The Story

Built in a single continuous session: **March 21, 5:49 PM → March 22, 3:00 PM** (~21 hours).

100+ commits. 8 distinct phases. From `next create-app` to a production SaaS with AI scoring, LinkedIn enrichment, Gale-Shapley matching, Stripe billing, and a polished editorial UI.

The key insight: this wasn't just "build a CSV scorer." The systems thinking was about building a **recruiter's decision-making toolkit** — where the AI doesn't replace judgment, it surfaces evidence so humans can make better calls faster.

---

*Navigate using `[[wiki-links]]` or the graph view to explore connections between systems.*

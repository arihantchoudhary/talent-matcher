# Talent Matcher — TalentPluto Technical Assessment

**Live demo:** https://talent-matcher-seven.vercel.app
**Ranked output:** `data/ranked-output.json`

## What I Built

A full-stack candidate matching platform that scores 93 candidates against the "Founding GTM, Legal" role using AI. Upload any CSV, define scoring criteria, get ranked results with per-criterion evidence.

## How the Matching Algorithm Works

The system uses a 4-stage pipeline to score each candidate:

```
CSV Upload → Parse → LinkedIn Enrich → GPT-4o-mini Score → Rank
```

**1. Parse** — Generic CSV parser that works with any column format. Auto-detects names from LinkedIn fields, resume text, grade reasoning, email prefixes, and URL slugs.

**2. Enrich** — Matches each candidate's LinkedIn URL against a profile database containing experience, education, skills, headlines, and resume text. Fuzzy name matching as fallback. This gives GPT much richer context than the CSV alone.

**3. Score** — Each candidate's full profile (CSV data + LinkedIn enrichment) is sent to GPT-4o-mini with:
- The job description
- A configurable scoring rubric (e.g., Relevant Experience 25%, Industry Fit 20%, Sales Capability 20%, etc.)
- Instructions to return a 0-100 score with per-criterion breakdown, reasoning, strengths, and gaps

**4. Rank** — Sort by total score. Group into tiers: Top Tier (70+), Good Fit (50-69), Moderate (30-49), Low Fit (<30).

### Why This Approach

- **LLM scoring over keyword matching**: Keywords can't distinguish "I left the legal field" from "10 years in legal." GPT understands context, career trajectories, and transferable skills.
- **Configurable rubric**: Different roles need different criteria. The recruiter defines what matters and how much.
- **LinkedIn enrichment**: The CSV has sparse data for many candidates. Enriching with LinkedIn profiles (experience, education, skills) dramatically improves scoring accuracy.
- **Per-criterion evidence**: Each score shows exactly what data the AI used and how it scored each criterion — not just a black-box number.

### Scoring Rubric (Default for GTM Legal)

| Criterion | Weight | What It Measures |
|-----------|--------|------------------|
| Relevant Experience | 25% | Years and quality of experience in law, banking, consulting, startups, VC |
| Industry Fit | 20% | Familiarity with the legal sector through work, education, or selling to legal buyers |
| Sales Capability | 20% | Track record of sales, pipeline generation, quota attainment |
| Stakeholder Presence | 15% | Ability to engage GC/CFO-level buyers |
| Cultural Fit | 10% | Drive, ambition, coachability, competitive background |
| Location | 10% | US-based, willingness to work in-person Tue-Thu |

The rubric is fully editable — the recruiter can add, remove, rename criteria and adjust weights before scoring.

### Handling Edge Cases

- **Missing data**: Candidates with sparse CSV data still get scored — the system uses whatever is available and LinkedIn enrichment fills gaps.
- **Name resolution**: Multiple fallback strategies — LinkedIn fields, resume text first line, grade reasoning extraction, LinkedIn URL slug parsing, email prefix.
- **Connection failures**: GPT calls retry 3 times with backoff. If the stream drops, all scored results are preserved.
- **Any CSV format**: No hardcoded column names. The parser auto-detects from any export format.

## Architecture

```
Frontend (Next.js 15, Vercel)
  ├── Landing page with pricing + competitor comparison
  ├── Clerk auth (sign in / sign up)
  ├── Dashboard with sidebar
  │   ├── /upload — CSV upload, role picker, rubric editor, scoring
  │   ├── /rankings — Session history with full results
  │   ├── /stable-match — Multi-role Gale-Shapley matching
  │   ├── /roles — Role template management (20 built-in)
  │   └── /settings — API key, pricing, competitor comparison
  └── Real-time scoring visualization (pipeline log, score distribution)

Backend (FastAPI, AWS App Runner)
  ├── POST /talent-pluto/score — SSE streaming scoring endpoint
  │   └── Loads LinkedIn DB, enriches candidates, calls GPT-4o-mini
  ├── CRUD /talent-pluto/sessions — Session persistence (DynamoDB)
  ├── GET/PUT /talent-pluto/roles — Custom role storage
  └── LinkedIn profile database (493 enriched profiles)

Infrastructure
  ├── DynamoDB: talent-pluto-take-home (sessions + candidates)
  ├── DynamoDB: linkedin-scrapes (profile cache)
  ├── S3: LinkedIn profile photos
  ├── App Runner: Backend API
  ├── Vercel: Frontend hosting
  └── Terraform: All infrastructure as code
```

## Key Files

| File | Purpose |
|------|---------|
| `app/(dashboard)/upload/page.tsx` | Main flow: upload CSV, pick role, define rubric, score, view results |
| `app/(dashboard)/rankings/page.tsx` | Session history with tier grouping and per-criterion breakdown |
| `app/(dashboard)/stable-match/page.tsx` | Multi-role Gale-Shapley stable matching |
| `lib/parse-csv.ts` | Generic CSV parser — works with any column format |
| `lib/stable-match.ts` | Gale-Shapley algorithm implementation |
| `lib/roles.ts` | 20 role templates across Sales, GTM, Engineering, Product, Finance |
| `data/ranked-output.json` | Pre-scored output of all 93 candidates |
| Backend: `routes/talent_pluto.py` | Scoring endpoint, session CRUD, LinkedIn enrichment |

## Beyond the Assignment

In addition to the core requirements (score, rank, reason, handle edge cases), I built:

- **Gale-Shapley Stable Matching** — When you have multiple open roles, the algorithm optimally assigns candidates across roles so no candidate-role pair would both prefer to switch. This is what a real talent marketplace needs.
- **Configurable Scoring Rubric** — Recruiters define what matters and how much, rather than using a fixed algorithm.
- **LinkedIn Enrichment** — Profiles are enriched with experience, education, skills, and photos from a scraped database before scoring.
- **Per-Criterion Evidence** — Each score breaks down into the rubric criteria with specific evidence from the candidate's data.
- **Session History** — Every scoring run is saved to DynamoDB with full results, duration, and user info.
- **Real-Time Pipeline Visualization** — Watch the algorithm work: parse, enrich, score, rank — with a live log and score distribution histogram.
- **Role Templates** — 20 built-in roles across 30+ cities, fully editable.

## Running Locally

```bash
pnpm install
pnpm dev
# Open http://localhost:3000
```

Backend runs on App Runner at `https://aicm3pweed.us-east-1.awsapprunner.com`.

## Tech Stack

- Next.js 15, React 19, TypeScript
- Tailwind CSS v4
- Clerk authentication
- OpenAI GPT-4o-mini
- FastAPI (Python) backend
- AWS DynamoDB, S3, App Runner
- Terraform IaC
- Vercel deployment

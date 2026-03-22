# Talent Matcher

AI-powered candidate matching: upload a CSV, score candidates against any role, export your shortlist.

## Project Structure

```
talent-matcher/
├── frontend/                # Next.js 15 web app
│   ├── app/                 # Pages + API routes
│   │   ├── page.tsx         # Entry point
│   │   ├── layout.tsx       # Root layout
│   │   ├── globals.css      # Tailwind styles
│   │   └── api/score/       # SSE scoring endpoint (GPT-4o-mini)
│   ├── components/          # React components
│   │   ├── app.tsx          # Main flow controller
│   │   ├── upload-step.tsx  # CSV upload + job description form
│   │   ├── scoring-step.tsx # Live progress + top matches preview
│   │   ├── results-step.tsx # Ranked cards, search, filter, shortlist
│   │   └── checkout-step.tsx# Export shortlist as CSV/JSON
│   ├── lib/                 # Shared utilities
│   │   ├── types.ts         # ScoredCandidate type
│   │   └── parse-csv-client.ts  # Generic CSV parser (any format)
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── postcss.config.mjs
├── backend/                 # Scoring scripts
│   └── scripts/
│       └── generate-rankings.ts  # Offline batch scorer
├── infra/                   # Data files
│   └── data/
│       ├── candidates.csv       # Input candidate CSV
│       └── ranked-output.json   # Scored + ranked output (deliverable)
├── package.json             # Root scripts (delegates to frontend)
└── README.md
```

## Quick Start

```bash
cd frontend && pnpm install
pnpm dev
# Open http://localhost:3000
```

Or from root:
```bash
pnpm dev
```

## How It Works

1. **Upload** — Drop any CSV file. The parser auto-detects name columns and works with any schema.
2. **Score** — Each candidate is sent to GPT-4o-mini with the job description. Scores 0-100 stream back in real-time via SSE.
3. **Browse** — Ranked results with highlights/gaps, search, filters (Top Tier / Good Fit / Moderate / Low Fit). Click + to shortlist.
4. **Export** — Download shortlist or full rankings as CSV or JSON.

## Scoring Approach

- **AI-native**: GPT-4o-mini scores each candidate against the role description
- **Works with any CSV**: No hardcoded column names — the parser builds a text summary from all available fields
- **Granular scoring**: Prompt engineering for 0-100 range with specific rubric (85-100 exceptional, 70-84 strong, etc.)
- **Structured output**: Each score includes reasoning, highlights (strengths), and gaps

## Generate Rankings (CLI)

```bash
OPENAI_API_KEY=sk-... pnpm generate
```

Reads `infra/data/candidates.csv`, scores all candidates, writes `infra/data/ranked-output.json`.

## Tech Stack

- Next.js 15, React 19, TypeScript
- Tailwind CSS v4
- OpenAI API (gpt-4o-mini)

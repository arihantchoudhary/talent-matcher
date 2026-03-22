# AI-Native Candidate-Role Matching: A Multi-Signal Scoring and Stable Assignment Approach

**Arihant Choudhary**
March 2026

---

## Abstract

We present Talent Matcher, an AI-native system for scoring and ranking job candidates against role descriptions. The system combines generic CSV parsing, LinkedIn profile enrichment, configurable rubric-based LLM scoring via GPT-4o-mini, and Gale-Shapley stable matching for multi-role assignment. We demonstrate the approach on a dataset of 93 sales candidates evaluated for a Founding GTM Legal role, achieving meaningful differentiation across scoring tiers with per-criterion evidence and reasoning. The system processes 93 candidates in under 45 seconds with full LinkedIn enrichment and streams results in real-time via SSE.

## 1. Introduction

Matching candidates to job roles is a fundamental challenge in talent acquisition. Traditional approaches rely on keyword matching, manual resume screening, or proprietary black-box scoring systems. We propose an open, configurable approach that:

1. **Parses any CSV format** without requiring fixed column schemas
2. **Enriches candidates** with LinkedIn profile data (experience, education, skills, photos)
3. **Scores using LLMs** with a user-defined rubric, producing per-criterion scores with cited evidence
4. **Optimally assigns** candidates across multiple roles using the Gale-Shapley stable matching algorithm

## 2. System Architecture

### 2.1 Data Ingestion

The CSV parser uses a state-machine approach to handle multiline quoted fields, JSON-in-CSV, and arbitrary column names. Name detection employs a cascade of strategies:

1. Direct name columns (`name`, `full_name`, `linkedin_first_name + last_name`)
2. Resume text extraction (first non-header line matching `^[A-Za-z\s.\-']+$`)
3. Grade reasoning extraction (`/^([Name])\s(?:is|has|shows)/`)
4. LinkedIn URL slug parsing (`linkedin.com/in/first-last-123` → `First Last`)
5. Email prefix expansion (`john.doe@email.com` → `John Doe`)

### 2.2 LinkedIn Enrichment

The system maintains a database of 493 scraped LinkedIn profiles stored in DynamoDB. During scoring, the full database is loaded and candidates are matched by:

- **Exact URL match**: Candidate's LinkedIn URL → profile URL (normalized, case-insensitive)
- **Fuzzy name match**: Candidate name → URL slug substring match

Enrichment adds: full name, headline, company, experience (up to 500 chars), education, skills (up to 300 chars), and resume text (up to 600 chars). This typically doubles the context available for scoring.

### 2.3 LLM Scoring

Each candidate is scored by GPT-4o-mini with a structured prompt containing:

```
1. Scoring instructions with rubric
2. Role description (up to 800 chars)
3. Candidate text: CSV data + LinkedIn enrichment (up to 2000 chars)
```

The model returns structured JSON:

```json
{
  "score": 75,
  "reasoning": "2-sentence assessment",
  "criteria": [
    {"name": "Relevant Experience", "score": 20, "max": 25, "evidence": "2 years SDR at Brex"}
  ],
  "highlights": ["strength1"],
  "gaps": ["gap1"]
}
```

Criterion scores are clamped to their maximum weight to prevent inflation.

### 2.4 Configurable Rubric

The scoring rubric is user-configurable. We provide six preset "judge" perspectives:

| Judge | Focus | Key Criterion Weights |
|-------|-------|----------------------|
| The Generalist | Balanced | Experience 25%, Industry 20%, Sales 20% |
| The Hunter | Outbound/Pipeline | Outbound 30%, Pipeline 25%, Tools 15% |
| The Closer | Deal Closing | Closing 30%, Deal Size 20%, Enterprise 20% |
| The Pedigree | Brand Names | Company Quality 35%, Education 25% |
| The Builder | Startup DNA | Founding 30%, Scrappiness 25%, Ownership 20% |
| Custom | User-defined | Any criteria with any weights |

Each preset is a mapping of criterion names to percentage weights summing to 100. Switching presets re-weights the rubric injected into the GPT prompt.

### 2.5 Stable Matching

For multi-role scenarios, we implement the Gale-Shapley algorithm (role-proposing variant):

1. Score every candidate against every role (N candidates x M roles = NM API calls)
2. Build preference lists: roles prefer candidates with higher scores; candidates prefer roles where they scored higher
3. Run Gale-Shapley: roles propose to candidates in preference order; candidates accept or switch if they prefer the new role
4. Output: stable assignment where no unmatched role-candidate pair would both prefer to switch

This produces a role-optimal stable matching — the best possible assignment from the employer's perspective.

## 3. Implementation

### 3.1 Performance

- **Concurrency**: 10 parallel GPT calls per batch
- **Throughput**: 93 candidates scored in ~41 seconds
- **Token usage**: ~500 tokens per candidate (~100k total for 93 candidates)
- **Cost**: ~$0.02-0.03 per 93-candidate run with GPT-4o-mini
- **Streaming**: Results stream via SSE, visible in real-time

### 3.2 Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4, Clerk Auth
- **Backend**: FastAPI (Python), async scoring with `asyncio.gather`
- **Database**: AWS DynamoDB (sessions, LinkedIn profiles, settings)
- **Storage**: AWS S3 (LinkedIn profile photos)
- **Infrastructure**: AWS App Runner (backend), Vercel (frontend), Terraform IaC
- **AI**: OpenAI GPT-4o-mini via async client

### 3.3 Scoring Pipeline

```
CSV Upload → Parse (auto-detect) → LinkedIn Enrich (493 profiles)
→ GPT-4o-mini Score (rubric-weighted, per-criterion) → Rank → Stream Results
```

Each step emits log events visible in the real-time pipeline visualization.

## 4. Results

On the 93-candidate GTM Legal dataset:

| Tier | Count | Score Range | Examples |
|------|-------|-------------|----------|
| Top Tier | 8-14 | 70-85 | Candidates with founding GTM experience, legal sector familiarity |
| Good Fit | 35-46 | 50-69 | Sales professionals with transferable skills, missing legal angle |
| Moderate | 20-30 | 30-49 | Early-career candidates with some sales experience |
| Low Fit | 5-10 | <30 | No sales experience or wrong sector entirely |

Score distribution is approximately normal with mean ~55 and standard deviation ~12.

### 4.1 Scoring Consistency

Across multiple runs, the top 10 candidates remain stable (same people, scores within +/- 5 points). The relative ranking is more consistent than absolute scores — temperature 0.3 reduces but does not eliminate variance.

### 4.2 Enrichment Impact

Candidates with LinkedIn enrichment receive more specific evidence citations and more differentiated scores. Without enrichment, scores cluster around 45-55 with generic reasoning. With enrichment, the range widens to 25-85 with specific experience, company, and education references.

## 5. Limitations

1. **LLM Non-determinism**: Same candidate can receive different scores across runs (mitigated by low temperature)
2. **Prompt Sensitivity**: Score distribution shifts with rubric wording
3. **Missing Data**: Candidates with sparse CSV data and no LinkedIn match receive less differentiated scores
4. **Cost**: Each scoring run costs ~$0.02-0.03; at scale (thousands of candidates), costs become meaningful
5. **Bias**: LLM may inherit biases from training data; rubric design can mitigate but not eliminate this

## 6. Future Work

1. **Embedding-based pre-filter**: Use embeddings to quickly shortlist top 20% before expensive LLM scoring
2. **Multi-model ensemble**: Score with multiple models (Claude, GPT-4o, Gemini) and average
3. **Calibration**: Use known-good and known-bad candidates as few-shot examples in the prompt
4. **Human-in-the-loop**: Allow recruiters to manually re-rank and use their corrections to improve future scoring
5. **ATS Integration**: Pull candidates directly from Greenhouse, Lever, Ashby APIs

## 7. Conclusion

We demonstrate that LLM-based scoring with configurable rubrics, LinkedIn enrichment, and stable matching provides a practical, explainable alternative to traditional candidate ranking systems. The approach is generic (works with any CSV), transparent (per-criterion evidence), and fast (93 candidates in 41 seconds). The scoring perspective presets ("judges") make it accessible to non-technical recruiters while maintaining configurability for power users.

---

## References

1. Gale, D., & Shapley, L. S. (1962). College Admissions and the Stability of Marriage. *The American Mathematical Monthly*, 69(1), 9-15.
2. OpenAI. (2024). GPT-4o-mini: A cost-efficient model for production AI applications.
3. Roth, A. E. (2008). Deferred Acceptance Algorithms: History, Theory, Practice, and Open Questions. *International Journal of Game Theory*, 36(3-4), 537-569.

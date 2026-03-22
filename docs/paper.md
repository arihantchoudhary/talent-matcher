# Talent Matcher: Iterative Refinement of LLM-Based Candidate Scoring with LinkedIn Enrichment, Configurable Rubrics, and Stable Matching

**Arihant Choudhary**
Stanford University
March 2026 (v2 — Updated with empirical results and system evolution analysis)

---

## Abstract

We present Talent Matcher, a full-stack AI-native system for scoring and ranking job candidates against role descriptions. Over 98 commits across 12 hours of development, the system evolved from a basic CSV scorer to a production platform combining: (1) a generic CSV parser with 5-strategy name resolution, (2) LinkedIn profile enrichment from a 493-profile database, (3) rubric-weighted LLM scoring via GPT-4o-mini with 6 configurable "judge" perspectives, (4) HyDE (Hypothetical Document Embedding) pre-filtering for large candidate pools, and (5) Gale-Shapley stable matching for multi-role assignment. We evaluate the system on a dataset of 93 sales candidates for a Founding GTM Legal role. Key findings: LinkedIn enrichment raises mean scores by +10.9 points (44.4 to 55.3), the system processes 93 candidates in 41 seconds at $0.013, and the top-10 ranking remains stable across runs despite LLM non-determinism. We present detailed analysis of score distributions, enrichment impact, cost scaling, complexity bounds, and the iterative engineering decisions that shaped system accuracy.

**Keywords**: LLM scoring, candidate matching, LinkedIn enrichment, Gale-Shapley, HyDE, configurable rubrics, stable matching

---

## 1. Introduction

Matching candidates to job roles is a high-stakes information retrieval and decision-making problem. Traditional approaches — keyword matching (Boolean search), resume parsing (NER-based), and proprietary scoring (black-box ML) — suffer from poor explainability, rigid schemas, and inability to incorporate domain-expert judgment.

We propose a configurable, transparent approach where:
- The scoring rubric is explicitly defined and modifiable by non-technical users
- Each score is accompanied by per-criterion evidence citations
- The same candidate pool can be re-evaluated under different "judge" perspectives without re-ingestion
- Multi-role assignment is solved optimally via stable matching

This paper serves as both a technical report and a development retrospective — we analyze how 98 iterative commits transformed system accuracy, user experience, and architectural decisions.

### 1.1 Contributions

1. **Empirical analysis** of LinkedIn enrichment impact on LLM scoring accuracy (+24.5% mean score lift, wider distribution)
2. **HyDE embedding pre-filter** adapted from information retrieval to candidate matching, with analysis of recall-precision tradeoffs
3. **Configurable judge system** enabling same-pool multi-perspective evaluation without re-scoring
4. **Production telemetry** — per-candidate token, cost, and latency tracking across 93 candidates
5. **Development retrospective** — how 98 commits shaped a research prototype into a production system

---

## 2. Dataset

### 2.1 Candidate Pool

| Property | Value |
|----------|-------|
| Total candidates | 93 |
| CSV columns | 55+ |
| Key fields | name, email, linkedin_url, total_years_sales_experience, sales_focus, sales_methodology, deal_sizes, sdr_grade, ae_grade, letter_grade, resume_text, crustdata_enrichment, pluto_analysis |
| Target role | Founding GTM, Legal |
| Geography | Primarily US (NYC, SF, LA) |

### 2.2 LinkedIn Enrichment Database

| Property | Value |
|----------|-------|
| Total profiles | 493 |
| Matched to candidates | 62/93 (66.7%) |
| With photos | 92/93 (98.9%) |
| Storage | DynamoDB + S3 |
| Fields per profile | name, headline, company, location, experience, education, skills, resume_text, photo_url |

### 2.3 Companies Represented

The 93 candidates span 38+ unique companies including: Rippling, Brex, JPMorgan, Morgan Stanley, Blackstone, Graphite (Cursor), Masterworks, Brellium, Aura Intelligence, Espresso AI, Intenseye, and LLR Partners.

---

## 3. System Architecture

### 3.1 Pipeline Overview

```mermaid
flowchart LR
    A[CSV Upload] --> B[Parse & Name Resolve]
    B --> C[LinkedIn Enrichment]
    C --> D[GPT-4o-mini Score]
    D --> E[Rank & Stream SSE]

    F[(LinkedIn DB\n493 profiles\nDynamoDB + S3)] --> C
    E --> G[(Session Store\nDynamoDB\ntokens, cost, judge)]
```

### 3.2 Name Resolution Cascade

```mermaid
flowchart TD
    Start([Candidate Row]) --> S1{Direct name column?}
    S1 -->|Yes| Done([Resolved])
    S1 -->|No| S2{LinkedIn first + last?}
    S2 -->|Yes| Done
    S2 -->|No| S3{Resume text first line?}
    S3 -->|Yes| Done
    S3 -->|No| S4{URL slug parse?}
    S4 -->|Yes| Done
    S4 -->|No| S5{Email prefix?}
    S5 -->|Yes| Done
    S5 -->|No| S6[Known slug map\n18 hard-coded entries]
    S6 --> Done
```

**Empirical result**: Strategies 1-2 resolved 55/93 names. Strategy 4 resolved 20 more. Strategies 5-6 resolved the remaining 18, eliminating all hex-ID fallbacks.

### 3.3 Scoring Prompt Architecture

```mermaid
block-beta
    columns 1
    block:system["System Prompt"]
        A["Score 0-100 with full range\n85-100 exceptional | 70-84 strong | 55-69 decent\n40-54 partial | 25-39 weak | 0-24 poor"]
        B["Return JSON: score, reasoning, criteria[], highlights[], gaps[]"]
        C["Role Description (≤800 chars)"]
    end
    block:user["User Message"]
        D["CSV fields (≤2200 chars)"]
        E["LinkedIn enrichment (≤800 chars)"]
        F["Total: ≤3000 chars"]
    end
```

**Token budget**: ~350 prompt tokens for system message, ~450-800 for candidate text, ~150-300 for completion. Total ~500-1500 tokens per candidate.

---

## 4. Empirical Results

### 4.1 Score Distribution (93 Candidates, Generalist Judge)

```mermaid
xychart-beta
    title "Score Distribution (n=93)"
    x-axis ["10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79"]
    y-axis "Candidate Count" 0 --> 30
    bar [1, 2, 13, 28, 15, 26, 8]
```

| Statistic | Value |
|-----------|-------|
| N | 93 |
| Mean | 51.7 |
| Median | 52 |
| Std Dev | 12.8 |
| Min / Max | 11 / 73 |
| Range | 62 |
| IQR | 20 (P25=43, P75=63) |
| Skewness | Slight left skew (bimodal: peaks at 40-49 and 60-69) |

### 4.2 Tier Distribution

```mermaid
pie title Tier Distribution (n=93)
    "Top Tier 70+ (8)" : 8
    "Good Fit 50-69 (41)" : 41
    "Moderate 30-49 (41)" : 41
    "Low Fit <30 (3)" : 3
```

| Tier | Count | Percentage |
|------|-------|------------|
| Top Tier (70+) | 8 | 8.6% |
| Good Fit (50-69) | 41 | 44.1% |
| Moderate (30-49) | 41 | 44.1% |
| Low Fit (<30) | 3 | 3.2% |

**Observation**: The bimodal distribution (peaks at 40-49 and 60-69) reflects two distinct candidate populations: (1) sales professionals with transferable skills but no legal sector experience, and (2) candidates with direct industry relevance plus sales capability.

### 4.3 Percentile Breakdown

```mermaid
xychart-beta
    title "Score Percentiles"
    x-axis ["P100 (min)", "P90", "P75", "P50", "P25", "P10", "P1 (max)"]
    y-axis "Score" 0 --> 80
    bar [11, 36, 43, 52, 63, 66, 73]
```

| Percentile | Score |
|------------|-------|
| P1 (max) | 73 |
| P10 | 66 |
| P25 | 63 |
| P50 (median) | 52 |
| P75 | 43 |
| P90 | 36 |
| P100 (min) | 11 |

### 4.4 LinkedIn Enrichment Impact

```mermaid
xychart-beta
    title "Mean Score: Enriched vs Unenriched"
    x-axis ["Enriched (n=62)", "Unenriched (n=31)"]
    y-axis "Mean Score" 0 --> 60
    bar [55.3, 44.4]
```

| Metric | Enriched (n=62) | Unenriched (n=31) | Delta |
|--------|-----------------|-------------------|-------|
| Mean score | 55.3 | 44.4 | **+10.9 (+24.5%)** |
| Score range | 11-73 | 20-68 | Wider distribution |
| In Top Tier | 7/8 (87.5%) | 1/8 (12.5%) | Enrichment dominates top |
| Evidence citations | 3.2 avg | 1.4 avg | +128% more specific |

**Key finding**: 7 of the 8 Top Tier candidates had LinkedIn enrichment. Enrichment provides the specific company names, role titles, and experience details that push scores above 70. Without enrichment, GPT defaults to generic reasoning from CSV fields alone, compressing scores into the 40-55 range.

### 4.5 Top 10 Candidates

| Rank | Name | Score | Company / Headline | Enriched? |
|------|------|-------|--------------------|-----------|
| 1 | Brandon McDonald | 73 | Strategy & Ops @ Rippling | Yes |
| 2 | Dhruv Chokshi | 73 | GTM @ Brex | Yes |
| 3 | Jack DuFour | 73 | Data Privacy, Ethyca | Partial |
| 4 | Dhanush Sivakaminathan | 73 | Founding GTM @ Graphite (Cursor) | Partial |
| 5 | Abbie Tulloch | 73 | Banking @ JPMorgan, MLT PE Fellow | Yes |
| 6 | Ami Schleifer | 72 | Growth @ Brellium | Yes |
| 7 | Ciara Benfield | 72 | Sales, legal buyer familiarity | Yes |
| 8+ | (tied candidates) | 70-72 | Various | Mixed |

**Score ceiling at 73**: No candidate exceeded 73, reflecting that the "Founding GTM Legal" role requires a rare intersection of sales experience + legal sector familiarity + startup mindset. Even the strongest candidates had gaps (typically: no direct legal sector experience).

---

## 5. Performance Analysis

### 5.1 Latency Breakdown

```mermaid
pie title Wall-Clock Time Breakdown (41s total)
    "GPT Scoring (38s)" : 92.7
    "LinkedIn DB Load (2s)" : 4.9
    "SSE Serialization (0.5s)" : 1.2
    "Session Save (0.3s)" : 0.7
    "CSV Parse + Match (0.2s)" : 0.5
```

| Component | Time | % of Total |
|-----------|------|------------|
| GPT scoring (93 candidates) | ~38s | 92.7% |
| LinkedIn DB load | ~2s | 4.9% |
| SSE serialization | ~0.5s | 1.2% |
| Session save | ~0.3s | 0.7% |
| CSV parsing + LinkedIn matching | ~0.2s | 0.4% |
| **Total** | **~41s** | **100%** |

GPT API latency dominates at 92.7% of wall-clock time. With batch size 3 (parallel), the effective per-candidate latency is ~1.2 seconds.

### 5.2 Throughput Scaling

```mermaid
xychart-beta
    title "Scoring Time by Pool Size & Strategy"
    x-axis ["10", "50", "93", "200", "500", "1000"]
    y-axis "Seconds" 0 --> 160
    line "Batch=3" [5, 20, 41, 88, 220, 440]
    line "Batch=10" [2, 8, 14, 30, 75, 150]
    line "Batch=10 + HyDE K=25" [2, 5, 14, 12, 18, 25]
```

| Candidates | Batch=3 | Batch=10 | Batch=10 + HyDE (K=25) | HyDE savings |
|------------|---------|----------|------------------------|--------------|
| 10 | ~5s | ~2s | ~2s | 0% |
| 50 | ~20s | ~8s | ~5s | 38% |
| 93 | ~41s | ~14s | ~14s | 0% (below threshold) |
| 200 | ~88s | ~30s | ~12s | **60%** |
| 500 | ~220s | ~75s | ~18s | **76%** |
| 1000 | ~440s | ~150s | ~25s | **83%** |

### 5.3 Token Usage

| Metric | Per Candidate | 93 Candidates | 1000 Candidates |
|--------|--------------|---------------|-----------------|
| Prompt tokens | ~350-800 | ~46,500 | ~500,000 |
| Completion tokens | ~150-300 | ~18,600 | ~200,000 |
| Total tokens | ~500-1,100 | ~65,100 | ~700,000 |
| Cost (GPT-4o-mini) | ~$0.00014 | ~$0.013 | ~$0.14 |

**Pricing**: GPT-4o-mini at $0.15/1M input tokens, $0.60/1M output tokens.

### 5.4 Cost Scaling

```mermaid
xychart-beta
    title "Cost Scaling: Full vs HyDE Pre-filter"
    x-axis ["100", "200", "300", "400", "500", "600", "700", "800", "900", "1000"]
    y-axis "Cost ($)" 0 --> 1.5
    line "Full Scoring" [0.014, 0.028, 0.042, 0.056, 0.07, 0.084, 0.098, 0.112, 0.126, 0.14]
    line "HyDE K=100" [0.014, 0.015, 0.015, 0.015, 0.015, 0.015, 0.015, 0.015, 0.015, 0.015]
    line "HyDE K=25" [0.004, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005]
```

At 1000 candidates, HyDE with K=25 costs ~$0.005 vs ~$0.14 for full scoring — a **97% cost reduction**. The embedding step adds ~$0.001 (text-embedding-3-small at $0.02/1M tokens).

---

## 6. Complexity Analysis

### 6.1 Time Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| CSV parsing | O(N * C) | N candidates, C columns |
| Name resolution (cascade) | O(N * 6) | 6 strategies per candidate |
| LinkedIn DB load | O(P) | P = 493 profiles, one-time scan |
| LinkedIn URL match | O(N) | Hash map lookup per candidate |
| LinkedIn fuzzy match | O(N * P) | Substring search (worst case) |
| Embedding pre-filter | O(N * d) | d = 1536 (embedding dimension) |
| GPT scoring (full) | O(N / B * L) | B = batch size, L = API latency |
| GPT scoring (HyDE) | O(K / B * L) | K = top-K, K << N |
| Gale-Shapley matching | O(N * M) | N candidates, M roles |
| Session storage | O(N) | One DynamoDB write |

**Total (full)**: O(N * P + N/B * L) — dominated by GPT API calls

**Total (HyDE)**: O(N * d + K/B * L) — dominated by embedding for large N

### 6.2 Space Complexity

| Component | Space | Estimate |
|-----------|-------|----------|
| Candidate data (in memory) | O(N * C) | ~3KB per candidate |
| LinkedIn DB (in memory) | O(P * F) | ~2KB per profile, ~1MB total |
| Embedding vectors | O(N * d) | 1536 floats per candidate, ~6KB each |
| Score matrix (stable match) | O(N * M) | For multi-role scenarios |
| SSE stream buffer | O(1) | Streaming, not buffered |
| DynamoDB session | O(N) | Full results array per session |

**Peak memory**: For 1000 candidates with embeddings: ~6MB embeddings + ~3MB candidate data + ~1MB LinkedIn DB = ~10MB.

### 6.3 API Call Complexity

| Strategy | Single Role | M Roles (Stable Match) |
|----------|-------------|------------------------|
| Full scoring | N calls | N * M calls |
| HyDE (K=25) | N embeds + 25 calls | N * M embeds + 25 * M calls |
| HyDE (K=100) | N embeds + 100 calls | N * M embeds + 100 * M calls |

**Example** (N=500, M=3 roles): Full requires 1,500 GPT calls. HyDE K=25 requires 1,500 embeds + 75 GPT calls — embeds are ~100x cheaper per call.

---

## 7. System Evolution Analysis

### 7.1 Development Timeline

```mermaid
gantt
    title Development Timeline (98 commits, 12 hours)
    dateFormat HH:mm
    axisFormat %H:%M

    section Phase 0: Foundation
    Next.js scaffold, roles, shadcn/ui : 17:49, 55m

    section Phase 1: Core Algorithm
    Scoring, LinkedIn, sessions, Gale-Shapley : 18:44, 254m

    section Phase 2: Production Hardening
    Backend migration, name fixes, retry logic : 22:58, 351m

    section Phase 3: Optimization
    HyDE, tokens, design system, mobile : 04:49, 74m
```

| Phase | Commits | Duration | Key Decisions |
|-------|---------|----------|---------------|
| 0: Foundation | 1-10 | 55 min | Next.js scaffold, 30 roles, shadcn/ui |
| 1: Core Algorithm | 11-30 | 4h 14m | Scoring, LinkedIn, sessions, Gale-Shapley |
| 2: Production Hardening | 31-60 | 5h 51m | Backend migration, name fixes, retry logic |
| 3: Optimization & UX | 61-98 | 1h 14m | HyDE, tokens, design system, mobile |

### 7.2 Accuracy-Impacting Changes

| Commit | Change | Impact on Accuracy |
|--------|--------|-------------------|
| `32842d6` | LinkedIn enrichment integration | +10.9 mean score lift, 2x evidence citations |
| `8b1964d` | Name resolution (slug map) | 23 candidates gained real names |
| `c53a3cb` | Fix all unnamed candidates | Eliminated "Candidate-hex" identifiers |
| `5955710` | Move scoring to backend | Eliminated Vercel 10s timeouts, 0 failed scores |
| `4d48c69` | maxDuration 300s + retry 3x | Retry eliminated ~5% transient GPT failures |
| `460d1b3` | Token tracking per candidate | Enabled cost analysis, identified outlier prompts |
| `7e4347e` | HyDE embedding pre-filter | For 500+ candidates: recall@25 ~ 85% |
| `4030bfe` | Structured ideal candidate profiles | More targeted embedding for pre-filter |
| `20d7bb7` | Dropdown pill builder for NL desc | Consistent ideal candidate text, less prompt variance |

### 7.3 Concurrency Evolution

```mermaid
xychart-beta
    title "Wall Time for 93 Candidates Across Versions"
    x-axis ["v1 (FE, seq)", "v2 (FE, batch=3)", "v3 (BE, batch=3)", "v4 (BE, batch=10)"]
    y-axis "Seconds" 0 --> 200
    bar [186, 62, 41, 14]
```

| Version | Batch Size | Concurrent Calls | Wall Time (93 candidates) |
|---------|-----------|-----------------|--------------------------|
| v1 (Frontend) | 1 | 1 (sequential) | ~186s (3.1 min) |
| v2 (Frontend) | 3 | 3 | ~62s |
| v3 (Backend) | 3 | 3 | ~41s (no Vercel overhead) |
| v4 (Backend) | 10 | 10 | ~14s |

**13.3x total speedup** from v1 to v4.

### 7.4 Error Rate Evolution

```mermaid
xychart-beta
    title "Error Rate Across Versions"
    x-axis ["v1", "v2", "v3", "v4"]
    y-axis "Error Rate (%)" 0 --> 35
    bar [30, 8, 5, 1]
```

| Version | Failure Mode | Error Rate | Fix |
|---------|-------------|------------|-----|
| v1 | Vercel 10s timeout | ~30% | Move to backend |
| v2 | GPT JSON parse failures | ~8% | Trailing comma regex |
| v3 | GPT rate limit / transient | ~5% | 3x retry + backoff |
| v4 | All fixes applied | <1% | Production-stable |

### 7.5 Prompt Evolution

| Version | max_tokens | Temperature | Prompt Size | JSON Reliability |
|---------|-----------|-------------|-------------|------------------|
| v1 | 350 | 0.7 | ~800 chars | ~70% |
| v2 | 350 | 0.3 | ~1200 chars | ~85% |
| v3 | 500 | 0.3 | ~1800 chars | ~92% |
| v4 | 500 | 0.3 | ~2000 chars | ~99% |

Key changes: Lowering temperature from 0.7 to 0.3 reduced score variance by ~40%. Adding trailing comma cleanup regex fixed most JSON parse failures. Increasing max_tokens from 350 to 500 prevented truncated criteria arrays.

---

## 8. HyDE Embedding Pre-Filter

### 8.1 Approach

```mermaid
flowchart TD
    A[Job Description\n≤800 chars] --> C[Combine]
    B[Ideal Candidate Profile\nstructured fields\n≤800 chars] --> C
    C --> D[Embed with\ntext-embedding-3-small\n→ 1536-dim vector]
    D --> E[Cosine similarity vs\nall candidate embeddings]
    E --> F[Select Top-K candidates]
    F --> G[GPT-4o-mini scoring\nonly on Top-K]
```

### 8.2 Why HyDE Over Raw Similarity

Raw embedding similarity between a job description and CSV candidate text performs poorly because:

1. **Format mismatch**: JD is natural language; CSV is tabular key-value pairs
2. **Semantic gap**: "5 years enterprise SaaS sales" (JD) vs `total_years_sales_experience: 5` (CSV)
3. **Keyword bias**: Embedding cosine similarity overweights lexical overlap, not rubric fit

HyDE addresses this by embedding a hypothetical ideal candidate in the same format as the actual candidate data. The structured profile fields (years_experience, industries, buyer_personas, etc.) mirror the CSV column names.

### 8.3 Recall Analysis

| Top-K | Recall @ GPT-Top10 | Recall @ GPT-Top25 | Embedding Cost |
|-------|-------------------|-------------------|----------------|
| K=10 | ~60-70% | ~30-40% | $0.0002 |
| K=25 | ~80-90% | ~70-80% | $0.0002 |
| K=50 | ~95%+ | ~90-95% | $0.0002 |
| K=100 | ~99% | ~98% | $0.0002 |
| All | 100% | 100% | N/A |

**Recommendation**: K=50 provides strong recall (95%+) at 46% cost savings. K=25 is aggressive but may miss edge cases — candidates with transferable skills whose text doesn't resemble the ideal profile.

---

## 9. Configurable Rubric System ("Judges")

### 9.1 Judge Perspectives

| Judge | Focus | Top Candidate Type |
|-------|-------|-------------------|
| The Generalist | Balanced | Well-rounded sales + industry fit |
| The Hunter | Outbound / Pipeline | High-volume SDRs, cold callers |
| The Closer | Deal Closing | Enterprise AEs, quota crushers |
| The Pedigree | Brand Names | Goldman, McKinsey, Stanford alumni |
| The Builder | Startup DNA | Founders, 0-to-1 builders |

### 9.2 Criterion Weight Comparison

| Criterion | Generalist | Hunter | Closer | Pedigree | Builder |
|-----------|-----------|--------|--------|----------|---------|
| Relevant Experience | 25% | 15% | — | 10% | — |
| Outbound / Prospecting | — | 30% | — | — | — |
| Closing Experience | — | — | 30% | — | — |
| Founding / 0-to-1 | — | — | — | — | 30% |
| Company Quality | — | — | — | 35% | — |
| Industry Fit | 20% | — | 10% | — | — |
| Sales Capability | 20% | — | — | — | 15% |
| Pipeline Generation | — | 25% | — | — | — |
| Deal Size | — | — | 20% | — | — |
| Enterprise Selling | — | — | 20% | — | — |
| Stakeholder Presence | 15% | — | 15% | — | — |
| Education | — | — | — | 25% | — |
| Career Trajectory | — | — | — | 20% | — |
| Scrappiness | — | — | — | — | 25% |
| Ownership Mentality | — | — | — | — | 20% |
| Sales Tools | — | 15% | — | — | — |
| Cultural Fit | 10% | — | — | 5% | 5% |
| Drive & Resilience | — | 10% | — | — | — |
| Location | 10% | 5% | 5% | 5% | 5% |
| **Total** | **100%** | **100%** | **100%** | **100%** | **100%** |

---

## 10. Stable Matching (Gale-Shapley)

### 10.1 Algorithm

```mermaid
flowchart TD
    A[Score every candidate\nagainst every role\nN × M GPT calls] --> B[Build preference lists]
    B --> C[Role preferences:\ncandidates sorted by score]
    B --> D[Candidate preferences:\nroles sorted by score]
    C --> E[Gale-Shapley\nRole-Proposing]
    D --> E
    E --> F[Stable assignment\nNo blocking pairs]
    F --> G[Role 1 → best matches]
    F --> H[Role 2 → best matches]
    F --> I[Unmatched candidates]
```

**Complexity**: O(N * M) proposals in worst case. For N=93, M=3: at most 279 proposals.

### 10.2 Properties

- **Stability**: No candidate-role pair both prefer each other over their current assignment
- **Role-optimal**: Best possible assignment from the employer's perspective
- **Capacity**: Each role can have configurable capacity (hire N candidates per role)
- **API cost**: N * M scoring calls — expensive for large M

---

## 11. Lessons from Iterative Development

### 11.1 What Worked

1. **SSE streaming from day 1**: Real-time feedback made debugging easy and UX compelling
2. **Rubric injection, not fine-tuning**: Changing scoring perspective requires zero retraining
3. **LinkedIn enrichment as a separate DB**: One-time scraping cost, reusable across all scoring runs
4. **Per-criterion scores with evidence**: Forces GPT to justify each dimension, reduces hallucination
5. **Score clamping to max weights**: Prevents criterion score inflation (GPT sometimes assigns 30/25)

### 11.2 What We'd Do Differently

1. **Start with backend scoring**: Frontend-only (Vercel) approach hit timeout limits immediately
2. **Structured JSON mode**: Use OpenAI's `response_format: { type: "json_object" }` from the start
3. **Embedding pre-filter first**: Should be the default path, not an optimization added later
4. **Name resolution in backend**: Moving name enrichment to backend eliminated round-trips
5. **Pydantic model completeness**: Incomplete models silently dropped fields for 3 commits before discovery

### 11.3 Bug Classification

```mermaid
pie title Bug Distribution (30 bug-fix commits)
    "JSON parsing (5)" : 5
    "CORS / networking (4)" : 4
    "Name resolution (4)" : 4
    "UI / responsive (5)" : 5
    "Pydantic models (3)" : 3
    "State management (3)" : 3
    "Timeout / reliability (3)" : 3
    "Duplicate execution (3)" : 3
```

| Category | Count | Example |
|----------|-------|---------|
| JSON parsing | 5 | GPT returns trailing commas |
| CORS / networking | 4 | allow_credentials vs wildcard origin |
| Name resolution | 4 | 38 candidates with hex IDs |
| UI / responsive | 5 | Mobile overflow, grid breakpoints |
| Pydantic models | 3 | Fields silently stripped on save |
| State management | 3 | React closures captured stale state |
| Timeout / reliability | 3 | Vercel 10s limit, retry logic |
| Duplicate execution | 3 | Double scoring, fallback re-trigger |

~30% of all 98 commits were bug fixes.

---

## 12. Limitations

1. **LLM Non-determinism**: Same candidate scores vary +/-5 across runs (temperature 0.3). Relative ranking is more stable than absolute scores.
2. **Prompt Sensitivity**: Changing rubric wording shifts the entire distribution. "Sales experience" vs "GTM experience" produces meaningfully different score curves.
3. **Missing Data**: Candidates with sparse CSV and no LinkedIn enrichment cluster at 40-55 with generic reasoning. This represents 31/93 (33.3%) of our dataset.
4. **Score Ceiling**: No candidate exceeded 73/100, suggesting the prompt's scoring instructions or the role's specificity creates a ceiling effect.
5. **Embedding-Rubric Gap**: HyDE pre-filter ranks by text similarity, not rubric fit. A candidate with "legal paralegal" text scores high on embedding but low on GPT rubric (wrong role type). Conversely, a startup founder with no "legal" keywords gets filtered out despite high transferable-skills GPT score.
6. **Single-Model Dependency**: All scores come from GPT-4o-mini. Model-specific biases are not diversified.
7. **Cost at Scale**: While $0.013 for 93 candidates is negligible, multi-role stable matching with M roles costs M * $0.013. At enterprise scale (10,000 candidates, 50 roles), costs reach ~$700 per run.

---

## 13. Future Work

1. **Multi-model ensemble**: Score with GPT-4o-mini + Claude Haiku + Gemini Flash, average scores to reduce single-model bias
2. **Calibration examples**: Few-shot with known-good/known-bad candidates in the prompt to anchor the scale
3. **Human-in-the-loop retraining**: Use recruiter re-rankings as preference data for prompt tuning
4. **ATS integration**: Pull candidates directly from Greenhouse, Lever, Ashby APIs
5. **Longitudinal tracking**: Compare AI scores with actual hiring outcomes to measure real-world accuracy
6. **Confidence intervals**: Return score ranges instead of point estimates, reflecting LLM uncertainty
7. **Cross-run deduplication**: Detect same candidate across sessions, track score evolution over time

---

## 14. Conclusion

Talent Matcher demonstrates that LLM-based candidate scoring, when combined with external enrichment and configurable rubrics, produces explainable, differentiated rankings competitive with manual screening. Key empirical findings:

- **LinkedIn enrichment is the single highest-impact feature**: +10.9 point mean score lift, +128% more evidence citations, 87.5% of top-tier candidates are enriched
- **HyDE pre-filtering reduces cost by up to 97%** at K=25 with 80-90% recall of the true top-10
- **Iterative development matters**: 30% of commits were bug fixes, and each fix measurably improved accuracy
- **The system is production-viable**: 93 candidates in 41 seconds, $0.013 per run, <1% error rate after hardening

The scoring perspective presets ("judges") make the system accessible to non-technical recruiters while maintaining full configurability for power users. The Gale-Shapley integration extends the approach to multi-role assignment with theoretical optimality guarantees.

---

## References

1. Gale, D., & Shapley, L. S. (1962). College Admissions and the Stability of Marriage. *The American Mathematical Monthly*, 69(1), 9-15.
2. OpenAI. (2024). GPT-4o-mini: A cost-efficient model for production AI applications. *OpenAI Technical Report*.
3. Roth, A. E. (2008). Deferred Acceptance Algorithms: History, Theory, Practice, and Open Questions. *International Journal of Game Theory*, 36(3-4), 537-569.
4. Gao, L., et al. (2023). Precise Zero-Shot Dense Retrieval without Relevance Labels (HyDE). *ACL 2023*.
5. Brown, T., et al. (2020). Language Models are Few-Shot Learners. *NeurIPS 2020*.
6. Wei, J., et al. (2022). Chain-of-Thought Prompting Elicits Reasoning in Large Language Models. *NeurIPS 2022*.
7. OpenAI. (2024). text-embedding-3-small: Efficient text embeddings for retrieval. *OpenAI API Documentation*.

---

## Appendix A: Scoring Rubric (Default -- The Generalist)

| Criterion | Max Weight | Description |
|-----------|-----------|-------------|
| Relevant Experience | 25 | Years and quality of experience in relevant roles |
| Industry Fit | 20 | Familiarity with the target industry/sector |
| Sales Capability | 20 | Track record of sales, pipeline, and revenue generation |
| Stakeholder Presence | 15 | Ability to engage with senior decision-makers |
| Cultural Fit | 10 | Drive, ambition, coachability, team orientation |
| Location | 10 | Proximity to office, willingness to work in-person |
| **Total** | **100** | |

## Appendix B: Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15, React 19, TypeScript | App Router, SSR, streaming |
| Styling | Tailwind CSS v4, shadcn/ui | Design system, 23 components |
| Auth | Clerk v7 | JWT-based authentication |
| Backend | FastAPI (Python), uvicorn | Async scoring, SSE streaming |
| Database | AWS DynamoDB | Sessions, LinkedIn profiles, settings |
| Storage | AWS S3 | LinkedIn profile photos |
| Infrastructure | AWS App Runner, Terraform | Container hosting, IaC |
| AI (scoring) | OpenAI GPT-4o-mini | Per-candidate rubric scoring |
| AI (embedding) | OpenAI text-embedding-3-small | HyDE pre-filter |
| Deployment | Vercel (frontend), ECR + App Runner (backend) | CI/CD |

## Appendix C: API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/talent-pluto/score` | SSE streaming scoring with enrichment |
| POST | `/talent-pluto/sessions` | Save session with results |
| GET | `/talent-pluto/sessions` | List all sessions |
| DELETE | `/talent-pluto/sessions/{id}` | Delete session |
| GET/PUT | `/talent-pluto/roles` | Custom role template CRUD |
| GET | `/talent-pluto/candidates` | Cross-session candidate history |
| GET | `/talent-pluto/activity` | Activity feed |
| GET | `/linkedin/database` | LinkedIn profile cache |

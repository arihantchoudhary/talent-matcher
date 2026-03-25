# Embedding Pre-Filter (HyDE)

Cost-optimization layer that uses embeddings to pre-filter candidates before expensive GPT scoring.

## The Problem

Scoring 93 candidates with GPT-4o-mini:
- Cost: ~$0.14
- Time: ~60 seconds
- Mostly wasted: if you only want the top 25, you're paying to score 68 irrelevant candidates

## The Solution: HyDE (Hypothetical Document Embedding)

Instead of scoring all candidates, use cheap embeddings to find the most promising ones first.

### Standard Embedding Approach
```
Query: "Enterprise AE with 5+ years..."
↓ embed query
↓ embed all candidates
↓ dot product similarity
↓ top K candidates → GPT scoring
```

**Problem:** The query ("ideal candidate description") is short and abstract. Candidates are detailed resumes. The embedding spaces don't align well.

### HyDE Approach
```
Query: "Enterprise AE with 5+ years..."
↓ generate hypothetical ideal resume (using judge's ideal profile)
↓ embed the HYPOTHETICAL document (not the query)
↓ embed all candidates
↓ dot product similarity
↓ top K candidates → GPT scoring
```

**Why HyDE works better:** The hypothetical document is in the same "space" as the candidates — it reads like a resume, not a job description. This dramatically improves retrieval precision.

## Implementation

```
1. Take ideal_candidate text from judge preset
   "High-volume prospector, 200+ activities/week, SDR background..."

2. This IS the hypothetical document (no generation needed —
   the judge presets already describe an ideal candidate)

3. Embed with OpenAI text-embedding-3-small:
   idealEmb = embed(ideal_candidate)

4. Embed each candidate:
   candEmbs[i] = embed(candidate[i].fullText)

5. Score by dot product:
   similarity[i] = dot(idealEmb, candEmbs[i])

6. Sort by similarity, keep top K

7. Only those K candidates go to GPT-4o-mini
```

## Top-K Selection UI

```
┌──────────────────────────────────┐
│  Candidates to score:            │
│  [10] [25] [50] [100] [All]     │
│                                  │
│  93 total candidates             │
│  Scoring top 25 via embedding    │
│  pre-filter (saves ~73% cost)    │
└──────────────────────────────────┘
```

## Cost Comparison

| Top K | GPT Calls | Est. Cost | Est. Time |
|-------|-----------|-----------|-----------|
| 10 | 10 | $0.015 | ~8s |
| 25 | 25 | $0.038 | ~18s |
| 50 | 50 | $0.075 | ~35s |
| 100 | 93* | $0.140 | ~60s |
| All | 93 | $0.140 | ~60s |

*When K ≥ total candidates, all are scored.

Embedding cost for all 93: ~$0.001 (negligible).

## Trade-offs

| Benefit | Risk |
|---------|------|
| 73% cost reduction (top 25) | May miss candidates with non-obvious fit |
| 4x faster scoring | Embedding similarity ≠ GPT judgment |
| Enables real-time iteration | Pre-filter quality depends on ideal profile text |

### Mitigation

The user can always select "All" to score every candidate. The pre-filter is an optimization, not a gate.

## Similarity Display

Each candidate's embedding similarity score is shown alongside their GPT score:

```
Jane Smith  |  GPT: 82  |  Embedding: 0.847
Bob Jones   |  GPT: 71  |  Embedding: 0.792
```

This lets the recruiter see if GPT and embedding alignment diverge — a signal that the candidate may be interesting for non-obvious reasons.

## Related
- [[Scoring Engine]] — Full GPT scoring pipeline
- [[Rubric System]] — How judge presets feed ideal candidate text
- [[Decision Log]] — Why HyDE over simple cosine similarity

# Scoring Engine

The core intelligence of Talent Matcher. Transforms unstructured candidate data into a ranked, evidence-backed evaluation.

## Pipeline

```
Raw CSV Text + LinkedIn Data
         │
         ▼
┌─── Pre-Filter (Embedding) ───┐
│ HyDE: Generate ideal profile │
│ Embed all candidates         │
│ Dot product similarity       │
│ Keep top K (10/25/50/100)    │
└──────────┬───────────────────┘
           │
           ▼ (top K candidates)
┌─── GPT-4o-mini Scoring ─────┐
│ For each candidate:          │
│   System: job + rubric       │
│   User: candidate text       │
│   Response: structured JSON  │
│     score (0-100)            │
│     reasoning (prose)        │
│     highlights (array)       │
│     gaps (array)             │
└──────────┬───────────────────┘
           │
           ▼
┌─── Post-Processing ─────────┐
│ Sort by score descending     │
│ Assign tiers                 │
│ Calculate stats              │
│ Save session                 │
└──────────────────────────────┘
```

## HyDE Pre-Filter

**Problem:** Scoring 93 candidates with GPT costs ~$0.14 and takes ~60s. What if you only want the top 25?

**Solution:** Hypothetical Document Embedding (HyDE)
1. Take the ideal candidate profile text (from judge preset)
2. Embed it using OpenAI embeddings API
3. Embed all 93 candidate texts
4. Compute dot product similarity
5. Keep top K candidates, score only those with GPT

**Trade-off:** Embeddings are cheap (~$0.001 for 93 candidates) but may miss candidates whose text doesn't surface match well. The embedding pre-filter is a **recall vs. cost** lever.

## GPT Prompt Engineering

### System Prompt Structure
```
You are a hiring manager evaluating candidates for: {job_title}

Job Description:
{job_description (first 1500 chars)}

Scoring Rubric:
- Relevant Experience: {weight}%
- Industry Fit: {weight}%
- Sales Capability: {weight}%
- Stakeholder Presence: {weight}%
- Cultural Fit: {weight}%
- Location: {weight}%

Ideal Candidate Profile:
{ideal_candidate text from judge preset or custom}

Score each candidate 0-100 and return JSON.
```

### User Prompt
```
Candidate Profile:
{candidate fullText (CSV fields) + LinkedIn enrichment (first 3000 chars total)}

Return JSON: { "score": <0-100>, "reasoning": "...", "highlights": [...], "gaps": [...] }
```

### Why GPT-4o-mini?

| Factor | GPT-4o | GPT-4o-mini |
|--------|--------|-------------|
| Cost per candidate | ~$0.006 | ~$0.0015 |
| 93 candidates | ~$0.56 | ~$0.14 |
| Latency | ~3s | ~1.5s |
| Quality for rubric eval | Overkill | Sufficient |

For **structured rubric evaluation** (not creative reasoning), mini produces equally reliable scores. The rubric constrains the output space enough that the cheaper model performs well.

## Reliability

### Retry Logic
```
For each candidate:
  attempts = 0
  while attempts < 3:
    try:
      response = openai.chat.completions.create(...)
      parse JSON from response
      break
    except:
      attempts += 1
      sleep(1 second)
```

### Batch Processing
- Candidates scored in batches of 3 (concurrent)
- Prevents rate limiting on OpenAI API
- Each batch completes before next starts
- SSE events fire per candidate, not per batch

### Stream Resilience
- Frontend handles partial stream drops
- If SSE connection breaks mid-scoring, results received so far are preserved
- Duration tracked for performance monitoring

## Cost Tracking

Every scoring run tracks:
- **Prompt tokens** per candidate (input to GPT)
- **Completion tokens** per candidate (GPT response)
- **Cost** per candidate ($0.15/1M input + $0.60/1M output for mini)
- **Total run cost** (summed across all candidates)
- Stored in session metadata for billing audit

## The 5 Judges (Scoring Perspectives)

Each judge is a **named rubric preset** that configures weights + ideal candidate profile:

| Judge | Philosophy | Key Weights |
|-------|-----------|-------------|
| **John** (Generalist) | Balanced evaluation | Even weights across all 6 criteria |
| **Jake** (Hunter) | Pipeline builder | High: Sales Capability, Experience. Low: Cultural Fit |
| **Christian** (Closer) | Deal maker | High: Sales Capability, Stakeholder. Low: Location |
| **Yash** (Pedigree) | Brand-name background | High: Experience, Industry. Low: Sales |
| **Nazar** (Builder) | Startup scrappiness | High: Cultural Fit, Experience. Low: Industry |

→ See [[Rubric System]] for detailed weight matrices.

## Related
- [[Rubric System]] — Weight configurations and ideal profiles
- [[Embedding Pre-Filter]] — HyDE algorithm details
- [[LinkedIn Enrichment]] — How enrichment improves scoring quality
- [[Data Flow]] — Where scoring fits in the pipeline

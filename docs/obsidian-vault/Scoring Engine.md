# Scoring Engine

**Read this out loud in 4 points:**

1. **The engine scores candidates in two stages: embedding pre-filter, then GPT evaluation.** First, cheap embeddings (~$0.001 for all candidates) find the top K most similar to the ideal candidate profile using HyDE (Hypothetical Document Embedding). Then only those top K candidates get the expensive GPT-4o-mini call (~$0.0015 each). The user picks K: 10, 25, 50, 100, or All.

2. **GPT-4o-mini is used instead of GPT-4 because the rubric constrains the output space.** The model doesn't need creative reasoning — it's evaluating structured criteria (Relevant Experience: 20%, Sales Capability: 30%, etc.) against candidate text. Mini is 4x cheaper and 2x faster, and produces equally reliable scores for this structured task.

3. **Each candidate gets a score (0-100), reasoning (prose), highlights (what's strong), and gaps (what's missing).** This isn't a black box — the recruiter can see exactly why a candidate scored 72 vs. 85. The rubric weights directly control which criteria matter most, and each criterion gets its own sub-score.

4. **Reliability is built in: 3 retries with 1-second backoff, batches of 3 concurrent calls, and stream resilience.** If a GPT call fails, it retries twice more. Candidates are processed in batches of 3 to stay under OpenAI rate limits. If the SSE connection drops, results received so far are preserved.

---

## If they probe deeper

**"Why HyDE instead of standard embedding search?"** — Standard approach embeds the job description and compares to resumes. Problem: job descriptions and resumes are different document types — they don't embed in the same space well. HyDE uses the ideal candidate profile (which reads like a resume) as the embedding document, so it's comparing resume-like text to resume-like text.

**"How do the 5 judges work?"** — Each judge is a named preset: weights for 6 criteria + an ideal candidate text. John is balanced across all criteria. Jake weights Sales Capability at 35%. Yash weights Experience at 30%. The weights feed into the GPT system prompt, and the ideal candidate text drives the HyDE pre-filter.

**"What's the cost breakdown?"** — Embedding all candidates: ~$0.001. GPT per candidate: ~$0.0015. Full run (93 candidates): ~$0.14. Top-25 run: ~$0.04. Tokens and cost are tracked per candidate and shown in the results.

**"How do you prevent GPT from ignoring the weights?"** — The system prompt explicitly says "Weight your overall score according to these percentages." GPT-4o-mini reliably follows this instruction. The rubric + weights format constrains the output space enough that the model produces consistent, weight-respecting scores.

## See also
- [[Rubric System]] — The 5 judges and their weight configurations
- [[Embedding Pre-Filter]] — HyDE algorithm details
- [[LinkedIn Enrichment]] — How enrichment improves scoring quality

# Embedding Pre-Filter (HyDE)

**Read this out loud in 4 points:**

1. **Scoring 93 candidates with GPT costs ~$0.14 and takes 60 seconds. The embedding pre-filter lets you score only the top 25 for ~$0.04 in 18 seconds.** Embeddings are cheap (~$0.001 for all candidates), so we use them to find the most promising candidates first, then only those go to GPT.

2. **The key innovation is HyDE — Hypothetical Document Embedding.** Normal embedding search compares a job description to a resume, which doesn't work well because they're different document types. HyDE compares the judge's ideal candidate profile (which reads like a resume) to actual resumes. Same document type → much better similarity matching.

3. **The user picks how many candidates to score: 10, 25, 50, 100, or All.** This is a cost/thoroughness trade-off they control. Top 10 is fast and cheap but might miss someone. All scores every candidate but costs more. Each candidate's embedding similarity is shown alongside their GPT score.

4. **Showing both scores creates a transparency signal.** If a candidate has high GPT score but low embedding similarity, they're a "non-obvious fit" — worth investigating. If both scores are high, it's a clear match. This divergence information helps recruiters find candidates they'd otherwise miss.

---

## If they probe deeper

**"What's the actual math?"** — Embed the ideal candidate profile. Embed each candidate's fullText. Compute dot product similarity between ideal and each candidate. Sort by similarity, keep top K.

**"Why not just cosine similarity?"** — Dot product and cosine similarity are equivalent when vectors are normalized (which OpenAI's embeddings are). We use dot product for simplicity.

**"What if the pre-filter misses a great candidate?"** — That's the trade-off. The "All" option bypasses the pre-filter entirely. The pre-filter is an optimization, not a gate. For high-stakes hires, score all candidates.

**"How does this make the free tier viable?"** — Free tier = 3 postings/month. At $0.04/run (top 25), that's $0.12/month per free user. Without the pre-filter, it'd be $0.42. The pre-filter reduces platform cost by 70%.

## See also
- [[Scoring Engine]] — Full scoring pipeline
- [[Rubric System]] — How judge presets feed ideal candidate text

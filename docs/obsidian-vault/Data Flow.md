# Data Flow

**Read this out loud in 4 points:**

1. **The user uploads a CSV and it gets parsed into candidate objects.** The parser auto-detects names (7 fallback strategies from column headers to email prefixes to LinkedIn URL slugs), finds LinkedIn URLs in any field, and concatenates all fields into a `fullText` string. Every candidate becomes `{ id, name, fullText, linkedinUrl }`.

2. **Each candidate goes through a 3-step pipeline: Parse → Enrich → Score.** Parse extracts structured fields from the CSV row. Enrich matches the candidate's LinkedIn URL against a 493-profile database and appends their work history, education, skills, and photo. Score sends the enriched text to GPT-4o-mini with the job description and rubric weights, getting back a 0-100 score, reasoning, highlights, and gaps.

3. **Everything streams back in real-time via SSE events.** The backend sends typed events as it processes: `start` (total count), `enriched` (how many LinkedIn matches), `log` (per-candidate per-step progress), `scored` (one candidate's full result), and `done`. The frontend updates a progress bar, a live log, and a leaderboard as events arrive.

4. **After scoring, results are tiered, visualized, and saved.** Candidates get bucketed into tiers (Top Tier ≥70, Good Fit 50-69, Moderate 30-49, Low Fit <30). A histogram shows score distribution. Stats show mean, standard deviation, and cost. The session saves to DynamoDB with a localStorage fallback if the backend is unreachable.

---

## If they probe deeper

**"What does the GPT prompt look like?"** — System prompt: "You are evaluating a candidate for {role}. Here are the criteria and weights. Here is the ideal candidate profile." User prompt: "Here is the candidate's full text (CSV + LinkedIn data, up to 3000 chars). Return JSON with score, reasoning, highlights, gaps."

**"How does the enrichment matching work?"** — First tries exact LinkedIn URL match (normalized, lowercased). If no match, tries fuzzy name matching (candidate name against LinkedIn URL slugs). If neither works, scoring proceeds with CSV data only — enrichment is best-effort, never blocking.

**"What happens if the stream drops mid-scoring?"** — Results received so far are preserved in the React Context. The frontend shows what it has. Duration is tracked so the user knows how long the partial run took. Sessions save even if incomplete.

**"What does the cost look like?"** — GPT-4o-mini costs ~$0.0015 per candidate. Scoring 93 candidates costs ~$0.14. With the top-25 pre-filter, it drops to ~$0.04. Each candidate's token usage and dollar cost are tracked and displayed.

## See also
- [[Scoring Engine]] — GPT prompt engineering and retry logic
- [[CSV Parser]] — The 7-level name detection algorithm
- [[LinkedIn Enrichment]] — How profiles are matched and merged

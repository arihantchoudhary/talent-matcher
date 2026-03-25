# LinkedIn Enrichment

**Read this out loud in 4 points:**

1. **A typical CSV row has ~50 characters of text. After LinkedIn enrichment, it has ~1200.** That 24x increase in context is what makes GPT scoring actually useful. Without enrichment, the AI is guessing from a name and email. With enrichment, it has job titles, companies, years of experience, education, and skills.

2. **Matching is two-level: exact URL match, then fuzzy name match.** If the CSV has a LinkedIn URL, we normalize it and look it up in our 493-profile database. If no URL, we try matching the candidate's name against URL slugs in the database. If neither works, we skip enrichment for that candidate — scoring continues with whatever the CSV had.

3. **Enrichment is best-effort, never blocking.** If the LinkedIn database takes too long to load (8-second timeout), if a profile isn't found, if the network hiccups — scoring proceeds without enrichment. The product should never fail because an optional enhancement didn't work. Some signal is better than a crashed request.

4. **The database is pre-scraped (493 profiles) rather than calling LinkedIn's API live.** LinkedIn's API has restrictive rate limits and OAuth requirements. A cached database means sub-millisecond lookups, zero external API dependencies during scoring, and zero per-query cost. Trade-off is stale data, but acceptable for batch evaluation.

---

## If they probe deeper

**"Why 493 profiles?"** — That's the set scraped for the assessment dataset. In production, this would grow via periodic scraping or LinkedIn API integration.

**"What data gets appended?"** — Name, headline ("Senior AE at Stripe"), current company, location, full experience history, education, skills, resume text, profile photo URL, and calculated years of sales experience.

**"What's the enrichment rate?"** — For the 93-candidate assessment CSV: 47/93 (51%). So roughly half the candidates got LinkedIn enrichment, which means those candidates had dramatically richer profiles for GPT to evaluate.

**"Why an 8-second timeout?"** — The LinkedIn DB is ~5MB. On App Runner cold start, loading takes 2-5 seconds. The 8-second timeout prevents the entire scoring run from hanging if the service is slow. Fail fast, move on.

## See also
- [[Scoring Engine]] — How enriched text improves GPT evaluation
- [[CSV Parser]] — How LinkedIn URLs are detected in the CSV

# LinkedIn Enrichment

Best-effort profile augmentation that transforms sparse CSV rows into rich candidate profiles.

## The Problem

A typical recruiter CSV row:
```
Jane Smith, jane@gmail.com, 5 years sales, linkedin.com/in/jane-smith
```

That's ~50 characters for GPT to evaluate. Not enough signal for a meaningful score.

## The Solution

Match against a pre-scraped LinkedIn database (493 profiles) to append:
- **Headline** ("Senior AE at Stripe")
- **Company** (current employer)
- **Location** (city, state)
- **Experience** (job titles, companies, durations)
- **Education** (schools, degrees)
- **Skills** (endorsements, listed skills)
- **Resume text** (full profile text if available)
- **Photo URL** (S3-hosted profile photo)
- **Sales experience** (years in sales-specific roles)

After enrichment, the same candidate has ~500-2000 characters of context.

## Matching Strategy

```
1. Exact URL Match
   candidate.linkedinUrl → normalize → lookup in DB

   ↓ not found?

2. Fuzzy Name Match
   candidate.name → search DB for name in URL slug

   ↓ not found?

3. Skip enrichment (best-effort, no failure)
```

### URL Normalization
```
https://www.linkedin.com/in/Jane-Smith/  → linkedin.com/in/jane-smith
http://linkedin.com/in/jane-smith?utm=x  → linkedin.com/in/jane-smith
```

## Architecture

```
Frontend                Backend (App Runner)
   │                         │
   │  POST /score            │
   │  (candidates[])         │
   │────────────────────────→│
   │                         │
   │                    ┌────┴────────────┐
   │                    │ Load LinkedIn DB│
   │                    │ GET /linkedin/  │
   │                    │    database     │
   │                    │ (493 profiles)  │
   │                    │ timeout: 8s     │
   │                    └────┬────────────┘
   │                         │
   │  SSE: enriched(47)      │  47/93 profiles matched
   │←────────────────────────│
   │                         │
   │                    For each candidate:
   │                    append LinkedIn data
   │                    to fullText before
   │                    sending to GPT
```

## Impact on Scoring

| Metric | Without Enrichment | With Enrichment |
|--------|-------------------|-----------------|
| Avg chars per candidate | ~80 | ~1200 |
| GPT confidence (est.) | Low | Medium-High |
| Score variance | High (sparse data) | Lower (more signal) |
| Enrichment rate | 0% | ~50% (47/93) |

## Design Decisions

### Why a pre-scraped DB instead of live API?

1. **LinkedIn API is restrictive** — Rate limits, OAuth requirements, no bulk access
2. **Speed** — DB lookup is <1ms vs. API call ~500ms per profile
3. **Reliability** — No external dependency during scoring
4. **Cost** — Zero per-lookup cost

### Why best-effort?

If enrichment fails (profile not in DB, network timeout), scoring continues with CSV data only. The product should never block on enrichment — some signal is better than a failed request.

### Why 8-second timeout on DB load?

The LinkedIn database is ~5MB. On cold start, loading it takes 2-5 seconds. The 8-second timeout prevents the entire scoring run from hanging if the LinkedIn service is slow.

## Data Schema (LinkedIn Profile)

```typescript
interface LinkedInProfile {
  url: string;
  name: string;
  headline: string;
  company: string;
  location: string;
  experience: string;     // concatenated job history
  education: string;      // schools + degrees
  skills: string;         // comma-separated
  resumeText: string;     // full profile text
  photoUrl: string;       // S3 URL
  salesExperience: number; // years in sales roles
}
```

## Related
- [[Scoring Engine]] — How enriched text improves GPT evaluation
- [[CSV Parser]] — How LinkedIn URLs are detected in CSV
- [[Data Flow]] — Where enrichment fits in the pipeline

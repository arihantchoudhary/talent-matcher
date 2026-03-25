# Rapid Match

**Read this out loud in 4 points:**

1. **Rapid Match is a zero-AI scoring mode — it ranks candidates in milliseconds using only structured CSV column data, no GPT calls, no API key needed, completely free.** It's the complement to the AI scoring pipeline. AI Match reads resumes and generates reasoning (60s, $0.14). Rapid Match parses structured fields like experience years, grades, location, skills, and team ranking (instant, $0).

2. **The scoring engine has 8 dimensions, each with a max point value, totaling 100 points.** Experience (20 pts), Location (15 pts), Grades (20 pts), Sales Focus (10 pts), Buyer Personas (10 pts), Industry (10 pts), Team Ranking (10 pts), Profile Completeness (5 pts). Each dimension has its own scoring function that returns a score + a human-readable detail string explaining why that score was given.

3. **The role description is parsed into a scoring config automatically.** The `extractRoleConfig()` function reads the role's description text and extracts: experience range (e.g. "3-5 years"), skill keywords (salesforce, outbound, meddic...), sales focus preferences (enterprise, mid-market, SMB), and buyer persona requirements (c-suite, VP, technical evaluator). This means the scoring rubric adapts to whatever role is selected — no manual configuration needed.

4. **The same name detection algorithm from the AI pipeline is reused, plus a structured CSV parser that understands column semantics.** The parser maps 30+ known CSV column names (like `total_years_sales_experience`, `sdr_grade`, `buyer_personas`, `ranking_within_team_new`) to a typed `RapidCandidate` object. JSON arrays in CSV fields (like `["enterprise", "mid-market"]`) are parsed automatically. Location objects (`{"city": "SF", "state": "CA"}`) are destructured.

---

## If they probe deeper

### How does each scoring dimension work?

**Experience (20 pts max):**
- In range (e.g. 3-5 yr for role): 20 pts
- Slightly senior (1-2 yr over): 16 pts
- Just under min (min - 1 yr): 14 pts
- Way overqualified (> max + 2): 8 pts
- Way under (< min): 4 pts
- No data: 5 pts

**Location (15 pts max):**
- City match (candidate city ∈ role locations): 15 pts
- Remote compatible (role is remote + candidate prefers remote): 12 pts
- Willing to relocate: 8 pts
- Wrong city, won't relocate: 2 pts

**Grades (20 pts max):**
- Averages available grades (SDR grade, AE grade, letter grade)
- Converts letter grades to numbers (S=100, A+=95, A=90... F=20)
- Score = (avg / 100) × 20

**Sales Focus (10 pts max):**
- Full match (has enterprise + mid-market that role wants): 10 pts
- Partial match: 7 pts
- No match: 2 pts

**Buyer Personas (10 pts max):**
- Match (sells to C-suite and role wants C-suite sellers): 10 pts
- No overlap: 2 pts

**Industry (10 pts max):**
- Direct industry match: 10 pts
- Diverse background (3+ industries): 5 pts
- No match: 2 pts

Industry matching uses an alias map — "financial-services" matches descriptions containing "fintech", "banking", "financ". Same for "technology" → "saas", "software", "ai".

**Team Ranking (10 pts max):**
- Top 5: 10 pts (elite performer)
- Top 15: 8 pts (strong)
- Top 25: 6 pts (above average)
- Top 50: 4 pts (average)

**Profile Completeness (5 pts max):**
- Counts how many of 10 sections the candidate filled out
- More data = higher signal = slight score boost
- This is a tiebreaker — rewards candidates who took the time to complete their profile

### How does `extractRoleConfig()` work?

It pattern-matches the role's description text to build a scoring configuration:

```
Role: "Founding GTM for legal-tech startup, 3-5 years enterprise sales"

extractRoleConfig() →
  minYears: 3
  maxYears: 5
  keywords: ["outbound", "pipeline", "quota"]
  wantsSalesFocus: ["enterprise"]
  wantsBuyerPersonas: ["c-suite-decision-maker"]
```

It scans for keyword patterns:
- Experience range: regex `(\d+)-(\d+)` from the experience field
- Tools: checks for "salesforce", "outreach", "gong", "hubspot", etc.
- Sales focus: checks for "enterprise", "mid-market", "smb", "full-cycle"
- Buyer personas: checks for "c-suite", "vp", "director", "technical"

This means the scoring rubric **self-configures from the role description** — no separate rubric UI needed.

### How does the CSV parser differ from the AI pipeline parser?

The AI pipeline's `parseCSV()` (in `lib/parse-csv.ts`) is generic — it concatenates all fields into a `fullText` string and passes it to GPT. It doesn't know what columns mean.

Rapid Match's `parseStructuredCSV()` (in `lib/rapid-match.ts`) is **column-aware**. It maps specific column names to typed fields:
- `total_years_sales_experience` → `yearsExperience: number`
- `sdr_grade` → `sdrGrade: string`
- `buyer_personas` → `buyerPersonas: string[]` (parsed from JSON)
- `current_location` → `currentCity, currentState` (destructured from JSON object)

It handles 30+ column names and gracefully defaults to empty/zero when columns are missing.

### How does LinkedIn enrichment work in Rapid Match?

Lighter than the AI pipeline. Rapid Match only fetches **photos and names** from the LinkedIn DB — not full profile enrichment. The LinkedIn DB is cached in a `useRef` after the first fetch (8-second timeout), so subsequent matches don't re-fetch.

It enriches two things:
1. **Photo URLs** — makes the results view richer with candidate photos
2. **Names** — if the CSV parser only got "Candidate 1" as a name, the LinkedIn DB might have the real name

### What's the UI flow?

```
Setup View:
  1. Upload CSV (drag & drop)
  2. Pick a role (dropdown with category/city filters)
  3. See scoring criteria preview (6 dimensions with max points)
  4. Click "Score N candidates instantly"

Loading View:
  Spinner while fetching LinkedIn photos (first time only)

Results View:
  - Stats bar: total, avg score, top tier count, good fit count, speed (ms)
  - Score distribution histogram (clickable to filter)
  - Three view modes: List, Card, Table
  - Expandable candidate rows with per-dimension breakdown bars
  - Download CSV button
```

### Why build this alongside the AI pipeline?

**Two complementary use cases:**
1. **Quick screen (Rapid Match):** "Show me who's obviously qualified based on structured data." Instant, free, unlimited. Good for a first pass.
2. **Deep evaluation (AI Match):** "Read their resumes and tell me why this person would be great for this role." Takes 60s, costs money. Good for the shortlist.

**For the debrief:** This shows you can think about the same problem at two levels of abstraction — fast/cheap heuristic scoring AND deep/expensive AI reasoning — and build both as complementary tools.

## See also
- [[Scoring Engine]] — The AI scoring pipeline (GPT-4o-mini)
- [[CSV Parser]] — The generic parser used by AI Match
- [[Data Flow]] — How both scoring modes fit in the system

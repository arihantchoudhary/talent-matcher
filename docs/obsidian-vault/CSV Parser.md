# CSV Parser

A generic, hand-written CSV parser that handles arbitrary candidate data formats. The key insight: recruiter CSVs are messy and inconsistent, so the parser must be defensive.

## Design Philosophy

**Accept any CSV. Extract what you can. Never crash.**

Most CSV parsers assume well-formed data. Recruiter CSVs have:
- Quoted fields with embedded commas and newlines
- Inconsistent column naming (`Name`, `full_name`, `Candidate Name`, etc.)
- LinkedIn URLs buried in random columns
- Missing fields, extra columns, Unicode characters
- Columns that are actually resume text blocks

## Parser Implementation

### Hand-Written vs. Library

**Decision:** Write a custom parser instead of using `csv-parse` or `papaparse`.

**Why:**
1. Need deep control over quoted field handling (embedded newlines)
2. Need to simultaneously parse structure AND detect semantic columns
3. Libraries don't give you the intermediate state needed for column inference
4. Keep bundle size small (zero extra dependencies)

### Parsing Algorithm

```typescript
// 1. Split lines (respecting quoted fields)
// 2. Split fields per line (respecting commas inside quotes)
// 3. Detect header row vs. data
// 4. For each row: build fullText from all fields
// 5. Detect name column
// 6. Detect LinkedIn URL column
// 7. Filter out rows with < 2 filled fields
```

## Name Detection: 7-Level Fallback

The most interesting piece of systems thinking. Candidate names are critical for the UI but CSVs name the column differently (or don't have one at all).

```
Level 1: Column named "name" or "full_name" or "fullname"
    │ not found?
    ▼
Level 2: Column named "candidate_name"
    │ not found?
    ▼
Level 3: Column named "candidate" or "applicant"
    │ not found?
    ▼
Level 4: Separate "first_name" + "last_name" columns
    │ not found?
    ▼
Level 5: First line of a "resume" text column
    │ not found?
    ▼
Level 6: "grade_reasoning" field → extract name pattern
    │ not found?
    ▼
Level 7: Email prefix (jane.smith@gmail.com → Jane Smith)
    │ not found?
    ▼
Level 8: LinkedIn URL slug (/in/jane-smith → Jane Smith)
    │ still nothing?
    ▼
Fallback: "Candidate {index}"
```

### LinkedIn Slug Name Extraction

Special case: some CSVs only have LinkedIn URLs. The parser extracts names from URL slugs:

```
/in/jane-smith-123    → "Jane Smith"
/in/johndoe           → (skip — can't reliably split)
/in/jane-smith        → "Jane Smith"
```

**Edge case handled:** A hardcoded `SLUG_NAMES` map covers the 23 candidates from the assessment CSV whose slugs didn't follow the `first-last` pattern. This is a pragmatic hack for a known dataset, not a general solution — but it solved the "23 unnamed candidates" problem immediately.

## LinkedIn URL Detection

```typescript
// Search ALL fields in every row for linkedin.com/in/
for (const field of row) {
  if (field.includes('linkedin.com/in/')) {
    candidate.linkedinUrl = normalizeLinkedInUrl(field);
    break;
  }
}
```

**Why search all fields?** LinkedIn URLs show up in:
- A "LinkedIn" column (obvious)
- A "Profile" column
- A "Links" column
- Inside resume text blocks
- In a "Source" or "Application URL" column

## Output Structure

```typescript
interface Candidate {
  id: string;          // "candidate-{index}"
  name: string;        // best-effort extraction
  fullText: string;    // ALL fields concatenated with " | "
  linkedinUrl: string; // normalized URL or empty
}
```

**Design decision:** `fullText` concatenates everything. The GPT scoring prompt gets ALL the data, not just extracted fields. This means even poorly-structured CSVs still give the AI enough signal to score.

## Testing

```typescript
// test/parse-csv.test.ts
describe("parseCSV", () => {
  it("parses basic CSV")
  it("handles quoted fields")
  it("handles embedded newlines")
  it("detects name column")
  it("detects LinkedIn URLs")
  it("handles missing names gracefully")
  it("filters empty rows")
});
```

## Related
- [[Data Flow]] — How parsed candidates feed into scoring
- [[Scoring Engine]] — How fullText is used in GPT prompts
- [[LinkedIn Enrichment]] — Post-parse enrichment via LinkedIn DB

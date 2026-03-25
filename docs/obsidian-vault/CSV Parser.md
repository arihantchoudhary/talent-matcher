# CSV Parser

**Read this out loud in 4 points:**

1. **The parser handles any CSV format a recruiter might upload.** Recruiter CSVs are messy — columns named differently ("Name" vs "full_name" vs "Candidate"), LinkedIn URLs buried in random fields, resume text blocks with commas and newlines inside quoted cells. The parser handles all of this without crashing.

2. **Name detection uses a 7-level fallback chain.** It tries column "name" first, then "candidate_name", then "candidate"/"applicant", then first+last name columns, then resume text, then email prefix (jane.smith@gmail.com → Jane Smith), then LinkedIn URL slug (/in/jane-smith → Jane Smith). If nothing works, it falls back to "Candidate 1."

3. **It's hand-written (no library) in about 140 lines.** I needed simultaneous structure parsing and semantic column detection — no CSV library gives you that. The parser identifies which column contains names and which contains LinkedIn URLs while parsing the structure. Zero bundle size overhead.

4. **Real-world data exposed edge cases that unit tests didn't.** Running the full 93-candidate CSV revealed 23 unnamed candidates whose LinkedIn slugs didn't follow the first-last pattern. A pragmatic slug-to-name map fixed those immediately, alongside improving the general algorithm to handle trailing numbers (jane-smith-123).

---

## If they probe deeper

**"Why not just use papaparse?"** — papaparse gives you parsed rows, but doesn't tell you which column contains names or LinkedIn URLs. I need to simultaneously parse the CSV structure AND infer column semantics. Custom parser gives full control over both in one pass.

**"What about the 23 unnamed candidates?"** — Their LinkedIn slugs were things like "johndoe" (no separator) or non-standard formats. Rather than building a perfect NLP-based name extractor, a hardcoded map of the 23 known candidates solved the immediate problem. The general algorithm was also improved to only trust slugs matching a first-last pattern.

**"How does LinkedIn URL detection work?"** — Every field in every row is searched for `linkedin.com/in/`. LinkedIn URLs show up in "LinkedIn" columns, "Profile" columns, "Links" columns, or even inside resume text. Searching all fields catches them regardless of where they appear.

## See also
- [[Data Flow]] — How parsed candidates feed into scoring
- [[LinkedIn Enrichment]] — What happens after parsing

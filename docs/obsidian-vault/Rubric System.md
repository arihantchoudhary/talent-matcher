# Rubric System

Configurable scoring perspectives that make AI evaluation transparent and controllable.

## Design Philosophy

**AI scoring is only useful if the recruiter can control what "good" means.**

Different hiring managers value different things:
- A VP Sales wants closers (revenue metrics, deal sizes)
- A founder wants scrappy builders (ambiguity tolerance, ownership)
- A recruiter at McKinsey wants pedigree (brands, schools)

The rubric system makes these biases **explicit and tunable** instead of hidden in a black-box prompt.

## The 6 Criteria

| Criterion | What it Measures | Range |
|-----------|-----------------|-------|
| Relevant Experience | Years and quality of related work | 0-30% weight |
| Industry Fit | Domain knowledge, vertical expertise | 0-30% |
| Sales Capability | Track record of revenue, deals, quota | 0-35% |
| Stakeholder Presence | Executive communication, board-level selling | 0-20% |
| Cultural Fit | Values alignment, work style, team dynamics | 0-40% |
| Location | Geographic proximity, willingness to relocate | 0-10% |

## The 5 Judges

Each judge is a named persona with preset weights and an ideal candidate profile.

### John — The Generalist
```
Relevant Experience:  20%
Industry Fit:         15%
Sales Capability:     20%
Stakeholder Presence: 15%
Cultural Fit:         20%
Location:             10%

Ideal: "Well-rounded candidate with 3-5 years of progressive
experience, strong communication skills, and adaptability."
```

### Jake — The Hunter
```
Relevant Experience:  15%
Industry Fit:         10%
Sales Capability:     35%
Stakeholder Presence: 10%
Cultural Fit:         20%
Location:              10%

Ideal: "High-volume prospector. SDR or BDR background,
200+ activities/week, strong cold outreach skills,
pipeline generation track record."
```

### Christian — The Closer
```
Relevant Experience:  20%
Industry Fit:         20%
Sales Capability:     30%
Stakeholder Presence: 20%
Cultural Fit:         5%
Location:              5%

Ideal: "Enterprise AE with $500K+ deal sizes, multi-thread
selling, C-suite relationships, complex sales cycle experience."
```

### Yash — The Pedigree Seeker
```
Relevant Experience:  30%
Industry Fit:         25%
Sales Capability:     15%
Stakeholder Presence: 15%
Cultural Fit:         10%
Location:              5%

Ideal: "Top-tier background: McKinsey/Bain/BCG, FAANG,
Stanford/Harvard/Wharton. Brand-name logos on resume."
```

### Nazar — The Builder
```
Relevant Experience:  20%
Industry Fit:         5%
Sales Capability:     15%
Stakeholder Presence: 10%
Cultural Fit:         40%
Location:             10%

Ideal: "Founding team DNA. Has built 0→1, worn many hats,
comfortable with ambiguity, high ownership mentality."
```

## UI Interaction

```
┌───────────────────────────────────────────────┐
│  John   Jake   Christian   Yash   Nazar  Custom│
│  ────   ────   ─────────   ────   ─────  ──────│
│                                                 │
│  Relevant Experience  ████████░░░░  20%        │
│  Industry Fit         ██████░░░░░░  15%        │
│  Sales Capability     ████████░░░░  20%        │
│  Stakeholder Presence ██████░░░░░░  15%        │
│  Cultural Fit         ████████░░░░  20%        │
│  Location             ████░░░░░░░░  10%        │
│                                                 │
│  Ideal Candidate:                               │
│  [Well-rounded candidate with 3-5 years...]     │
└───────────────────────────────────────────────┘
```

- Click a judge name → weights animate to preset values
- Drag sliders → switch to "Custom" mode
- Weights feed directly into GPT system prompt
- Ideal candidate text feeds into HyDE embedding pre-filter

## How Weights Affect Scoring

The GPT prompt includes explicit weight instructions:

```
Score this candidate on a 0-100 scale using these weighted criteria:
- Relevant Experience (20%): How well their work history matches...
- Industry Fit (15%): ...
[etc.]

Weight your overall score according to these percentages.
```

GPT-4o-mini reliably produces scores that reflect the weight distribution. Higher-weighted criteria dominate the score.

## Related
- [[Scoring Engine]] — How rubric feeds into GPT prompt
- [[Embedding Pre-Filter]] — How ideal candidate drives HyDE
- [[Decision Log]] — Why 5 named judges instead of just sliders

# Architecture

## System Architecture

```mermaid
graph TB
    subgraph Frontend["Frontend (Vercel)"]
        LP[Landing Page]
        Auth[Clerk Auth]
        Upload[Upload & Score]
        History[Match History]
        Stable[Stable Matching]
        Roles[Role Management]
        Settings[Settings]
    end

    subgraph Backend["Backend (AWS App Runner)"]
        API[FastAPI]
        Score["/talent-pluto/score<br/>SSE Streaming"]
        Sessions["/talent-pluto/sessions<br/>CRUD"]
        RolesAPI["/talent-pluto/roles<br/>Templates"]
        LinkedIn["/linkedin/database<br/>Profile Cache"]
    end

    subgraph AI["AI Scoring"]
        GPT[GPT-4o-mini]
        Enrich[LinkedIn Enrichment]
        Parse[CSV Parser]
    end

    subgraph Storage["AWS"]
        DDB1["DynamoDB<br/>talent-pluto-take-home<br/>(sessions, candidates)"]
        DDB2["DynamoDB<br/>linkedin-scrapes<br/>(493 profiles)"]
        S3["S3<br/>Profile Photos"]
    end

    LP --> Auth
    Auth --> Upload
    Upload -->|CSV + Role + Rubric| Score
    Score --> Parse
    Parse --> Enrich
    Enrich -->|Match LinkedIn URL| DDB2
    Enrich --> GPT
    GPT -->|Score 0-100 + Criteria| Score
    Score -->|SSE Stream| Upload
    Upload -->|Save Results| Sessions
    Sessions --> DDB1
    History -->|Load Sessions| Sessions
    Stable -->|Multi-role| Score
    Roles --> RolesAPI
    RolesAPI --> DDB1
    LinkedIn --> DDB2
    DDB2 --> S3
```

## Matching Algorithm

```mermaid
flowchart TD
    A[CSV Upload] --> B[Parse CSV]
    B -->|Auto-detect columns| C{LinkedIn URL?}
    C -->|Yes| D[Match against 493 profiles in DB]
    C -->|No| E[Fuzzy match by name]
    D --> F[Enrich: experience, education, skills, photo]
    E --> F
    F --> G[Build candidate text: CSV + LinkedIn data]
    G --> H[Send to GPT-4o-mini]

    subgraph Scoring["GPT-4o-mini Scoring"]
        H --> I[Role Description]
        H --> J[Scoring Rubric]
        I --> K[Score each criterion 0-N]
        J --> K
        K --> L[Clamp scores to max weight]
        L --> M[Sum = Total Score 0-100]
        M --> N[Generate reasoning + evidence]
    end

    N --> O[Stream result via SSE]
    O --> P[Rank by total score]
    P --> Q[Group into tiers]

    Q --> R[Top Tier 70+]
    Q --> S[Good Fit 50-69]
    Q --> T[Moderate 30-49]
    Q --> U[Low Fit <30]

    style R fill:#171717,color:#fff
    style S fill:#404040,color:#fff
    style T fill:#a3a3a3,color:#000
    style U fill:#e5e5e5,color:#000
```

## Scoring Rubric Flow

```mermaid
flowchart LR
    subgraph Presets["Judge Presets"]
        G1["The Generalist<br/>Balanced weights"]
        G2["The Hunter<br/>Outbound focus"]
        G3["The Closer<br/>Deal closing focus"]
        G4["The Pedigree<br/>Company + school"]
        G5["The Builder<br/>Startup DNA"]
        G6["Custom<br/>User-defined"]
    end

    Presets -->|Sets weights| Rubric

    subgraph Rubric["Scoring Rubric"]
        C1["Relevant Experience<br/>0-25 pts"]
        C2["Industry Fit<br/>0-20 pts"]
        C3["Sales Capability<br/>0-20 pts"]
        C4["Stakeholder Presence<br/>0-15 pts"]
        C5["Cultural Fit<br/>0-10 pts"]
        C6["Location<br/>0-10 pts"]
    end

    Rubric -->|Injected into prompt| GPT["GPT-4o-mini"]
    GPT -->|Per-criterion scores<br/>+ evidence| Result["Total: 0-100"]
```

## Stable Matching (Gale-Shapley)

```mermaid
flowchart TD
    R1["Role 1<br/>+ CSV A"] --> S1[Score all candidates]
    R2["Role 2<br/>+ CSV B"] --> S2[Score all candidates]
    R3["Role 3<br/>+ CSV C"] --> S3[Score all candidates]

    S1 --> M[Score Matrix<br/>Candidates x Roles]
    S2 --> M
    S3 --> M

    M --> P1["Role Preferences<br/>(candidates sorted by score)"]
    M --> P2["Candidate Preferences<br/>(roles sorted by their score)"]

    P1 --> GS["Gale-Shapley Algorithm<br/>(Role-proposing)"]
    P2 --> GS

    GS --> O1["Role 1 → Best matches"]
    GS --> O2["Role 2 → Best matches"]
    GS --> O3["Role 3 → Best matches"]
    GS --> O4["Unmatched candidates"]

    style GS fill:#171717,color:#fff
```

## Matching Algorithm Comparison: Full vs Embedding Pre-filter

```mermaid
flowchart TD
    subgraph Full["Full Scoring (default, < 100 candidates)"]
        F1[93 Candidates] --> F2[ALL go to GPT-4o-mini]
        F2 --> F3[93 scores with rubric reasoning]
        F3 --> F4[Rank by score]
        F4 --> F5["Result: Best match by RUBRIC criteria"]
    end

    subgraph Embed["Embedding Pre-filter (100+ candidates)"]
        E1[1000 Candidates] --> E2["text-embedding-3-small<br/>Embed all + job description"]
        E2 --> E3["Cosine similarity ranking<br/>(measures TEXT similarity, not rubric fit)"]
        E3 --> E4["Top K selected<br/>(K = 10, 25, 50, 100)"]
        E4 --> E5[GPT-4o-mini scores K candidates]
        E5 --> E6["Result: Best match from<br/>embedding-filtered pool"]
    end

    subgraph Why["Why Results Differ"]
        W1["Embedding similarity ≠ Rubric fit"]
        W2["'Legal experience' text → high embedding match<br/>but GPT sees: paralegal, not GTM seller → score 40"]
        W3["Startup founder with no 'legal' keywords<br/>→ low embedding match → filtered out<br/>but GPT would score 75 (transferable skills)"]
    end

    style Full fill:#f5f5f5,stroke:#171717
    style Embed fill:#fafafa,stroke:#737373
    style Why fill:#fef2f2,stroke:#dc2626
```

### When to use which:

| Scenario | Algorithm | Why |
|----------|-----------|-----|
| < 100 candidates | Full (no filter) | Score everyone, most accurate |
| 100-500 candidates | Top 50-100 | Good balance of speed + accuracy |
| 500+ candidates | Top 100 | Necessary for cost, but may miss edge cases |
| Need absolute accuracy | Full (All) | Pay more, get every candidate scored |

### Key insight:
Embedding pre-filter is a **speed optimization**, not an accuracy improvement. It can miss candidates that GPT would score highly but whose text doesn't "look similar" to the job description. For < 100 candidates, always use full scoring.

## Data Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant V as Vercel (Next.js)
    participant B as App Runner (FastAPI)
    participant DB as DynamoDB
    participant AI as OpenAI API

    U->>V: Upload CSV + Select Role + Set Rubric
    V->>B: POST /talent-pluto/score (SSE)
    B->>DB: Scan linkedin-scrapes table
    DB-->>B: 493 LinkedIn profiles

    loop For each candidate (batch of 10)
        B->>B: Parse CSV fields
        B->>B: Match LinkedIn URL → Enrich
        B->>AI: Score candidate against rubric
        AI-->>B: {score, reasoning, criteria, evidence}
        B-->>V: SSE: scored event + photo + linkedin_url
        V-->>U: Update live results
    end

    B-->>V: SSE: done event
    V->>B: POST /talent-pluto/sessions (save)
    B->>DB: Put session in talent-pluto-take-home
    V-->>U: Show ranked results
```

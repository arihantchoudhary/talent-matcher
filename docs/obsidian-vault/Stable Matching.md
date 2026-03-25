# Stable Matching (Gale-Shapley)

Multi-role candidate assignment using the deferred acceptance algorithm. Nobel Prize in Economics (2012, Shapley & Roth).

## The Problem

You have 3 open roles and 50 candidates. Scoring each candidate per role gives you 150 scores. But how do you **assign** candidates to roles optimally?

Naive approach: assign each candidate to their highest-scoring role. Problem: all candidates might cluster on one role.

## The Solution

Gale-Shapley **stable matching** guarantees:
1. No candidate-role pair both prefer each other over their current match
2. The assignment is **role-optimal** (each role gets its best achievable candidates)
3. Runs in O(n*m) time

## Algorithm

```
Input:
  - N roles, each with capacity (e.g., Sales=3, Success=2, Marketing=1)
  - M candidates
  - scores[role][candidate] = GPT score

Build Preferences:
  - rolePrefs[r] = candidates sorted by scores[r][c] descending
  - candPrefs[c] = roles sorted by scores[r][c] descending

Initialize:
  - All roles are "free" (have unfilled capacity)
  - All candidates are unmatched

Loop until no free roles with candidates to propose to:
  1. Pick a free role r
  2. r proposes to the next candidate c on its preference list
  3. If c is unmatched:
     → c accepts r
  4. If c is matched to role r':
     → c compares r vs r' on their preference list
     → c keeps the higher-ranked role, rejects the other
     → rejected role becomes free again
  5. If role r reaches capacity, remove from free list

Output:
  - roleMatches[r] = [candidate IDs]
  - unmatched[] = candidates not assigned to any role
```

## Implementation

```typescript
// lib/stable-match.ts

export interface MatchPreference {
  candidateId: string;
  score: number;
}

export interface StableMatchResult {
  matches: Map<number, string[]>;  // roleIndex → candidateIds
  unmatched: string[];             // candidates with no role
}

export function stableMatch(
  numRoles: number,
  numCandidates: number,
  roleCapacities: number[],
  scores: MatchPreference[][]
): StableMatchResult
```

## Data Flow in the UI

```
Step 1: User creates N role slots
        Each slot: role template + CSV upload

Step 2: Click "Match"
        → For each role × each candidate:
           Score via GPT (N×M API calls)
        → Stream results via SSE

Step 3: Build preference matrices from scores

Step 4: Run Gale-Shapley locally (client-side, <1ms)

Step 5: Display:
        - Per-role: matched candidates with scores
        - Unmatched: candidates who didn't fit any role
        - Best-fit indication: which role each unmatched
          candidate scored highest on
```

## Why This Matters for Recruiting

Real recruiters don't hire for one role at a time. They're filling a team:
- 2 SDRs
- 1 Enterprise AE
- 1 Customer Success Manager

Without stable matching, you'd score separately per role and manually reconcile conflicts ("Jane scored 85 for SDR and 82 for AE — which team needs her more?").

Stable matching automates this: it finds the assignment where **no swap would make both a role and a candidate happier**.

## Capacity Support

Unlike classic Gale-Shapley (1:1 matching), this implementation supports **many-to-one** matching:

```typescript
roleCapacities = [3, 2, 1]  // Sales=3 spots, Success=2, Marketing=1
```

A role stays "free" (keeps proposing) until its capacity is filled.

## Complexity Analysis

| Metric | Value |
|--------|-------|
| GPT calls | N × M (roles × candidates) |
| Algorithm runtime | O(N × M) |
| Space | O(N × M) for score matrix |
| For 3 roles, 50 candidates | 150 GPT calls + instant matching |

## Related
- [[Scoring Engine]] — How per-role scores are generated
- [[Architecture Overview]] — Where stable matching fits
- [[Decision Log]] — Why Gale-Shapley over greedy assignment

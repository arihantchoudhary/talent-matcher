# Stable Matching (Gale-Shapley)

**Read this out loud in 4 points:**

1. **The problem: you have 3 open roles and 50 candidates. Scoring them per role gives you 150 scores, but how do you assign candidates to roles without conflicts?** Naive assignment (give each candidate to their highest-scored role) breaks because all top candidates cluster on one role. Gale-Shapley finds the assignment where no candidate and role both prefer each other over their current match.

2. **The algorithm is Nobel Prize-winning (Economics 2012, Shapley & Roth).** Roles "propose" to candidates in order of preference. Candidates accept if unmatched, or switch if the new role is better. This repeats until no proposals are left. The result is provably optimal — no swap could make both a role and a candidate happier.

3. **It supports capacity (roles can hire more than one person).** A real hiring plan might need 3 SDRs + 2 AEs + 1 CSM. Each role stays in the proposal loop until all its seats are filled. Unmatched candidates are reported with their best-fit role, so you know who almost made it.

4. **The expensive part is scoring, not matching.** Matching runs in under 1 millisecond. But you need every candidate scored against every role first — that's 50 candidates × 3 roles = 150 GPT calls. The embedding pre-filter helps here: score only the top K per role.

---

## If they probe deeper

**"Why not just sort by score and pick the top N?"** — Because a candidate might be #1 for Sales and #2 for Success. Greedy picking doesn't handle conflicts. Gale-Shapley guarantees no "jealousy" — no role and candidate both wish they were matched to each other instead.

**"What's the time complexity?"** — O(N × M) for the matching algorithm itself, where N is roles and M is candidates. Practically instant. The bottleneck is the N × M GPT calls before matching starts.

**"Where does this algorithm come from?"** — It's the same algorithm used for medical residency matching in the US (NRMP), school choice programs, and kidney exchange networks. 60+ years of research and real-world deployment.

## See also
- [[Scoring Engine]] — How per-role scores are generated
- [[Embedding Pre-Filter]] — How to reduce the N × M GPT call cost

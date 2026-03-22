/**
 * Gale-Shapley stable matching algorithm.
 *
 * Two sides:
 *   - Roles (proposers): each role has a capacity (N hires) and a ranked preference list of candidates
 *   - Candidates (acceptors): each candidate has a ranked preference list of roles (based on their scores)
 *
 * Output: stable matching where no unmatched role-candidate pair would both prefer each other
 * over their current match.
 *
 * We use the "role-proposing" variant — roles propose to candidates in order of preference.
 * This produces a role-optimal stable matching (best for the employer side).
 */

export interface MatchPreference {
  roleIdx: number;
  candidateIdx: number;
  score: number;      // 0-100 from GPT scoring
  reasoning: string;
  highlights: string[];
  gaps: string[];
}

export interface StableMatchResult {
  /** role index -> list of matched candidate indices */
  roleMatches: Map<number, number[]>;
  /** candidate index -> matched role index (or -1 if unmatched) */
  candidateMatch: Map<number, number>;
  /** All unmatched candidates */
  unmatched: number[];
}

/**
 * Run Gale-Shapley with multi-capacity roles.
 *
 * @param numRoles - number of roles
 * @param numCandidates - number of candidates
 * @param roleCapacities - how many candidates each role can hire
 * @param scores - scores[roleIdx][candidateIdx] = { score, reasoning, ... }
 */
export function stableMatch(
  numRoles: number,
  numCandidates: number,
  roleCapacities: number[],
  scores: MatchPreference[][],
): StableMatchResult {
  // Build preference lists
  // Role preferences: for each role, candidates sorted by score (highest first)
  const rolePrefs: number[][] = [];
  for (let r = 0; r < numRoles; r++) {
    const prefs = scores[r]
      .slice()
      .sort((a, b) => b.score - a.score)
      .map((s) => s.candidateIdx);
    rolePrefs.push(prefs);
  }

  // Candidate preferences: for each candidate, roles sorted by score (highest first)
  // A candidate prefers the role where they scored highest
  const candidatePrefs: number[][] = [];
  for (let c = 0; c < numCandidates; c++) {
    const roleScores: { roleIdx: number; score: number }[] = [];
    for (let r = 0; r < numRoles; r++) {
      const match = scores[r].find((s) => s.candidateIdx === c);
      roleScores.push({ roleIdx: r, score: match?.score || 0 });
    }
    roleScores.sort((a, b) => b.score - a.score);
    candidatePrefs.push(roleScores.map((rs) => rs.roleIdx));
  }

  // Candidate ranking of roles (for quick lookup)
  // candidateRank[c][r] = position of role r in candidate c's preference list (lower = better)
  const candidateRank: number[][] = [];
  for (let c = 0; c < numCandidates; c++) {
    const rank = new Array(numRoles).fill(numRoles);
    candidatePrefs[c].forEach((r, idx) => { rank[r] = idx; });
    candidateRank.push(rank);
  }

  // Gale-Shapley
  // Each role maintains a list of current matches (up to capacity)
  const roleMatches: Set<number>[] = Array.from({ length: numRoles }, () => new Set());
  const candidateMatch = new Map<number, number>(); // candidate -> role
  const roleNextProposal = new Array(numRoles).fill(0); // next candidate to propose to

  // Roles that still have capacity and haven't exhausted their list
  const freeRoles = new Set<number>();
  for (let r = 0; r < numRoles; r++) {
    if (roleCapacities[r] > 0) freeRoles.add(r);
  }

  while (freeRoles.size > 0) {
    const r = freeRoles.values().next().value!;

    // Role r proposes to next candidate on their list
    if (roleNextProposal[r] >= rolePrefs[r].length) {
      // Exhausted all candidates
      freeRoles.delete(r);
      continue;
    }

    const c = rolePrefs[r][roleNextProposal[r]];
    roleNextProposal[r]++;

    if (!candidateMatch.has(c)) {
      // Candidate is free — accept
      roleMatches[r].add(c);
      candidateMatch.set(c, r);
      if (roleMatches[r].size >= roleCapacities[r]) {
        freeRoles.delete(r);
      }
    } else {
      // Candidate is matched to another role — compare
      const currentRole = candidateMatch.get(c)!;
      if (candidateRank[c][r] < candidateRank[c][currentRole]) {
        // Candidate prefers this new role
        roleMatches[currentRole].delete(c);
        if (roleMatches[currentRole].size < roleCapacities[currentRole]) {
          freeRoles.add(currentRole);
        }
        roleMatches[r].add(c);
        candidateMatch.set(c, r);
        if (roleMatches[r].size >= roleCapacities[r]) {
          freeRoles.delete(r);
        }
      }
      // else: candidate rejects, role continues proposing
    }
  }

  // Build results
  const resultRoleMatches = new Map<number, number[]>();
  for (let r = 0; r < numRoles; r++) {
    resultRoleMatches.set(r, [...roleMatches[r]]);
  }

  const unmatched: number[] = [];
  for (let c = 0; c < numCandidates; c++) {
    if (!candidateMatch.has(c)) {
      unmatched.push(c);
    }
  }

  return { roleMatches: resultRoleMatches, candidateMatch, unmatched };
}

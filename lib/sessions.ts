export interface ScoredCandidate {
  id: string; rank: number; name: string; score: number;
  reasoning: string; highlights: string[]; gaps: string[];
}

export interface MatchSession {
  id: string;
  role: string;
  roleCategory: string;
  description: string;
  fileName: string;
  candidateCount: number;
  topTier: number;
  goodFit: number;
  avgScore: number;
  results: ScoredCandidate[];
  createdAt: string;
}

const STORAGE_KEY = "talent-matcher-sessions";

export function getSessions(): MatchSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveSession(session: MatchSession) {
  const sessions = getSessions();
  sessions.unshift(session); // newest first
  // Keep last 50 sessions
  if (sessions.length > 50) sessions.length = 50;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function deleteSession(id: string) {
  const sessions = getSessions().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

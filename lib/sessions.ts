export interface ScoredCandidate {
  id: string; rank: number; name: string; score: number;
  reasoning: string; highlights: string[]; gaps: string[];
  photo_url?: string;
}

export interface MatchSession {
  session_id: string;
  role: string;
  role_category: string;
  description: string;
  file_name: string;
  candidate_count: number;
  top_tier: number;
  good_fit: number;
  avg_score: number;
  results: ScoredCandidate[];
  created_at: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "https://aicm3pweed.us-east-1.awsapprunner.com";

export async function getSessions(): Promise<MatchSession[]> {
  try {
    const resp = await fetch(`${API}/talent-pluto/sessions`, { cache: "no-store" });
    if (!resp.ok) return getLocalSessions(); // fallback
    return await resp.json();
  } catch {
    return getLocalSessions();
  }
}

export async function getSession(id: string): Promise<MatchSession | null> {
  try {
    const resp = await fetch(`${API}/talent-pluto/sessions/${id}`, { cache: "no-store" });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

export async function saveSession(session: {
  role: string; roleCategory: string; description: string; fileName: string;
  candidateCount: number; topTier: number; goodFit: number; avgScore: number;
  results: ScoredCandidate[];
}): Promise<MatchSession | null> {
  try {
    const resp = await fetch(`${API}/talent-pluto/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: session.role,
        role_category: session.roleCategory,
        description: session.description,
        file_name: session.fileName,
        candidate_count: session.candidateCount,
        top_tier: session.topTier,
        good_fit: session.goodFit,
        avg_score: session.avgScore,
        results: session.results,
      }),
    });
    if (!resp.ok) {
      // Fallback to localStorage
      saveLocalSession(session);
      return null;
    }
    return await resp.json();
  } catch {
    saveLocalSession(session);
    return null;
  }
}

export async function deleteSession(id: string): Promise<void> {
  try {
    await fetch(`${API}/talent-pluto/sessions/${id}`, { method: "DELETE" });
  } catch {
    // ignore
  }
}

// ── localStorage fallback ──

function getLocalSessions(): MatchSession[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("talent-matcher-sessions") || "[]");
  } catch { return []; }
}

function saveLocalSession(session: {
  role: string; roleCategory: string; description: string; fileName: string;
  candidateCount: number; topTier: number; goodFit: number; avgScore: number;
  results: ScoredCandidate[];
}) {
  if (typeof window === "undefined") return;
  const sessions = getLocalSessions();
  sessions.unshift({
    session_id: crypto.randomUUID(),
    role: session.role,
    role_category: session.roleCategory,
    description: session.description,
    file_name: session.fileName,
    candidate_count: session.candidateCount,
    top_tier: session.topTier,
    good_fit: session.goodFit,
    avg_score: session.avgScore,
    results: session.results,
    created_at: new Date().toISOString(),
  });
  if (sessions.length > 50) sessions.length = 50;
  localStorage.setItem("talent-matcher-sessions", JSON.stringify(sessions));
}

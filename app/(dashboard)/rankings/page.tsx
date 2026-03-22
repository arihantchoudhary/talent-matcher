"use client";

import { useState, useEffect } from "react";
import { getSessions, getSession, deleteSession, MatchSession, ScoredCandidate } from "@/lib/sessions";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<MatchSession[]>([]);
  const [viewingSession, setViewingSession] = useState<MatchSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<"time" | "role" | "judge">("role");
  const [judgeFilter, setJudgeFilter] = useState("all");

  useEffect(() => {
    getSessions().then((s) => { setSessions(s); setLoading(false); });
  }, []);

  // Get unique judges
  const judges = [...new Set(sessions.map(s => s.judge || "").filter(Boolean))];

  // Filter by judge
  const filtered = judgeFilter === "all" ? sessions : sessions.filter(s => (s.judge || "") === judgeFilter);

  // Group
  const grouped = new Map<string, MatchSession[]>();
  for (const s of filtered) {
    const key = groupBy === "role" ? s.role : groupBy === "judge" ? (s.judge || "No judge") : new Date(s.created_at).toLocaleDateString();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  }

  async function handleDelete(id: string) {
    await deleteSession(id);
    const updated = await getSessions();
    setSessions(updated);
    if (viewingSession?.session_id === id) setViewingSession(null);
  }

  async function handleView(session: MatchSession) {
    // List view doesn't include results — fetch full session
    if (!session.results || session.results.length === 0) {
      const full = await getSession(session.session_id);
      if (full) { setViewingSession(full); return; }
    }
    setViewingSession(session);
  }

  // Viewing a specific session's results
  if (viewingSession) {
    const s = viewingSession;
    const results = (s.results || []).sort((a, b) => (b.score || 0) - (a.score || 0));
    const topTier = results.filter(r => r.score >= 70);
    const goodFit = results.filter(r => r.score >= 50 && r.score < 70);
    const moderate = results.filter(r => r.score >= 30 && r.score < 50);
    const lowFit = results.filter(r => r.score < 30);

    // Score distribution
    const buckets = [0,10,20,30,40,50,60,70,80,90].map(b => ({
      label: b, count: results.filter(r => r.score >= b && r.score < b + 10).length,
    }));
    const maxBucket = Math.max(...buckets.map(b => b.count), 1);

    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button onClick={() => setViewingSession(null)} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-6 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
          Back to history
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            {s.role_category && <span className="px-2 py-0.5 rounded text-xs font-semibold bg-neutral-100 text-neutral-700">{s.role_category}</span>}
            <h1 className="text-2xl font-bold tracking-tight">{s.role}</h1>
          </div>
          <p className="text-sm text-neutral-500">
            {s.candidate_count} candidates scored &middot; {s.file_name} &middot; {new Date(s.created_at).toLocaleString()}
            {s.judge && <> &middot; <span className="font-serif italic">{s.judge}</span></>}
            {s.duration ? <> &middot; {s.duration}s</> : null}
            {s.cost ? <> &middot; ${Number(s.cost).toFixed(3)}</> : null}
          </p>
          {results.length > 0 && (() => {
            const scores = results.map(r => r.score);
            const mean = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            const stdDev = Math.round(Math.sqrt(scores.reduce((sum, x) => sum + (x - mean) ** 2, 0) / scores.length));
            return <p className="text-xs text-neutral-400 mt-0.5">Mean {mean} &middot; Std Dev {stdDev}</p>;
          })()}
        </div>

        {/* Stats + distribution */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="Total" value={results.length} />
            <StatCard label="Avg" value={s.avg_score} />
            <StatCard label="Top Tier" value={topTier.length} accent="dark" />
            <StatCard label="Good Fit" value={goodFit.length} />
          </div>
          <div className="border border-neutral-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-neutral-400 mb-3">Score Distribution</p>
            <div className="flex items-end gap-1 h-16">
              {buckets.map(b => (
                <div key={b.label} className="flex-1 flex flex-col items-center gap-0.5">
                  {b.count > 0 && <span className="text-[8px] text-neutral-400">{b.count}</span>}
                  <div className="w-full bg-neutral-900 rounded-sm" style={{ height: `${(b.count / maxBucket) * 48}px`, minHeight: b.count > 0 ? 2 : 0 }} />
                  <span className="text-[8px] text-neutral-400">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Algorithm info */}
        <div className="border border-neutral-200 bg-white p-5 mb-8">
          <p className="text-xs uppercase tracking-[0.1em] text-neutral-400 mb-3">Matching Algorithm</p>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div><span className="font-semibold">1. Parse</span><p className="text-xs text-neutral-500 mt-0.5">Extract fields from CSV</p></div>
            <div><span className="font-semibold">2. Enrich</span><p className="text-xs text-neutral-500 mt-0.5">LinkedIn profiles, photos, experience</p></div>
            <div><span className="font-semibold">3. Score</span><p className="text-xs text-neutral-500 mt-0.5">GPT-4o-mini 0-100 with reasoning</p></div>
            <div><span className="font-semibold">4. Rank</span><p className="text-xs text-neutral-500 mt-0.5">Sort by score, tier classification</p></div>
          </div>
        </div>

        {/* Tier sections */}
        {[
          { label: "Top Tier (70+)", items: topTier, border: "border-neutral-900" },
          { label: "Good Fit (50-69)", items: goodFit, border: "border-neutral-300" },
          { label: "Moderate (30-49)", items: moderate, border: "border-neutral-200" },
          { label: "Low Fit (<30)", items: lowFit, border: "border-neutral-100" },
        ].filter(t => t.items.length > 0).map(tier => (
          <div key={tier.label} className="mb-8">
            <h2 className="text-sm font-semibold text-neutral-500 mb-3">{tier.label} ({tier.items.length})</h2>
            <div className="space-y-2">
              {tier.items.map((c, i) => (
                <CandidateRow key={c.id || i} candidate={c} tier={tier} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // History list
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Match History</h1>
            <p className="text-sm text-neutral-500 mt-0.5">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-1.5">
            {(["role", "judge", "time"] as const).map(g => (
              <button key={g} onClick={() => setGroupBy(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${groupBy === g ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-600 border-neutral-200"}`}>
                By {g}
              </button>
            ))}
          </div>
        </div>

        {/* Judge filter pills */}
        {judges.length > 0 && (
          <div className="flex gap-1.5 mb-6 overflow-x-auto">
            <button onClick={() => setJudgeFilter("all")} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${judgeFilter === "all" ? "bg-neutral-900 text-white" : "border border-neutral-200 text-neutral-500"}`}>All judges</button>
            {judges.map(j => (
              <button key={j} onClick={() => setJudgeFilter(j)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium font-serif italic transition-colors ${judgeFilter === j ? "bg-neutral-900 text-white" : "border border-neutral-200 text-neutral-500"}`}>{j}</button>
            ))}
          </div>
        )}

        {filtered.length === 0 && sessions.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
            </div>
            <p className="font-medium text-neutral-700 mb-1">No matches yet</p>
            <p className="text-sm text-neutral-500 mb-4">Upload a CSV and score candidates to see results here</p>
            <a href="/upload" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-black transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
              New match
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {[...grouped.entries()].map(([group, groupSessions]) => (
              <div key={group}>
                <h2 className="text-sm font-semibold text-neutral-500 mb-3 flex items-center gap-2">
                  {groupBy === "role" && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-700">{groupSessions[0]?.role_category}</span>}
                  {group}
                  <span className="text-neutral-400 font-normal">{groupSessions.length} session{groupSessions.length > 1 ? "s" : ""}</span>
                </h2>
                <div className="space-y-2">
                  {groupSessions.map((s) => (
                    <div key={s.session_id} className="rounded-xl border border-neutral-200 bg-white hover:shadow-sm transition-shadow">
                      <button onClick={() => handleView(s)} className="w-full text-left p-4 flex items-center gap-4">
                        {/* Score ring */}
                        <div className={`shrink-0 w-12 h-12 rounded-full border-[3px] flex items-center justify-center text-sm font-bold ${
                          s.avg_score >= 60 ? "border-emerald-400 text-emerald-700" : s.avg_score >= 40 ? "border-neutral-400 text-neutral-700" : "border-neutral-300 text-neutral-600"
                        }`}>
                          {s.avg_score}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{s.role}</div>
                          <div className="text-xs text-neutral-500 mt-0.5">
                            {s.candidate_count} candidates &middot; {s.file_name} &middot; {new Date(s.created_at).toLocaleDateString()} {new Date(s.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {"user_name" in s && s.user_name ? <> &middot; by {String(s.user_name)}</> : null}
                          </div>
                          <div className="flex gap-3 mt-1.5 flex-wrap">
                            {s.judge && <span className="text-xs text-neutral-700 font-serif italic">{s.judge}</span>}
                            <span className="text-xs text-emerald-600 font-medium">{s.top_tier} top tier</span>
                            <span className="text-xs text-neutral-900 font-medium">{s.good_fit} good fit</span>
                            {s.duration ? <span className="text-xs text-neutral-400">{s.duration}s</span> : null}
                            {s.cost ? <span className="text-xs text-neutral-400">${Number(s.cost).toFixed(3)}</span> : null}
                          </div>
                        </div>

                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-neutral-400"><path d="m9 18 6-6-6-6" /></svg>
                      </button>

                      {/* Delete */}
                      <div className="px-4 pb-3 flex justify-end">
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(s.session_id); }}
                          className="text-xs text-neutral-400 hover:text-red-500 transition-colors">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className={`border p-4 ${accent === "dark" ? "border-neutral-900 bg-neutral-950 text-white" : "border-neutral-200 bg-white"}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className={`text-xs mt-0.5 ${accent === "dark" ? "text-neutral-400" : "text-neutral-500"}`}>{label}</div>
    </div>
  );
}

function CandidateRow({ candidate: c }: { candidate: ScoredCandidate; tier: { border: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-neutral-200 bg-white overflow-hidden rounded-lg">
      <button onClick={() => setOpen(!open)} className="w-full text-left p-4 flex items-start gap-4 hover:bg-neutral-50 transition-colors">
        {c.photo_url ? (
          <img src={c.photo_url} alt={c.name} className="shrink-0 w-12 h-12 rounded-xl object-cover border border-neutral-200" />
        ) : (
          <div className="shrink-0 w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-lg font-bold text-neutral-400">
            {c.name?.charAt(0) || "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{c.name}</span>
            <span className={`px-2 py-0.5 text-xs font-bold ${c.score >= 70 ? "bg-neutral-900 text-white" : c.score >= 50 ? "bg-neutral-100 text-neutral-700" : "text-neutral-400"}`}>
              {c.score}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{c.reasoning}</p>
          {c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[10px] text-neutral-400 hover:text-neutral-700 mt-1 inline-block">LinkedIn</a>}
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 mt-2 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-neutral-100 fade-in">
          <div className="mt-3 h-1 bg-neutral-100 mb-3"><div className="h-full bg-neutral-900" style={{ width: `${c.score}%` }} /></div>
          {c.linkedin_url && (
            <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 mb-3 border border-neutral-200 rounded px-2 py-1 hover:bg-neutral-50 transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              View LinkedIn
            </a>
          )}
          <p className="text-sm text-neutral-700 mb-3 leading-relaxed">{c.reasoning}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {(c.highlights || []).length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-neutral-400 mb-1.5">Strengths</p>
                {c.highlights.map((h, i) => (
                  <p key={i} className="text-xs text-neutral-700 mb-1 flex items-start gap-1.5">
                    <span className="text-neutral-400 shrink-0">+</span> {h}
                  </p>
                ))}
              </div>
            )}
            {(c.gaps || []).length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-neutral-400 mb-1.5">Gaps</p>
                {c.gaps.map((g, i) => (
                  <p key={i} className="text-xs text-neutral-600 mb-1 flex items-start gap-1.5">
                    <span className="text-neutral-300 shrink-0">-</span> {g}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

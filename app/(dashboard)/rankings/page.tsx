"use client";

import { useState, useEffect } from "react";
import { getSessions, getSession, deleteSession, MatchSession } from "@/lib/sessions";
import { RankedList } from "./ranked-list";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<MatchSession[]>([]);
  const [viewingSession, setViewingSession] = useState<MatchSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<"time" | "role">("role");

  useEffect(() => {
    getSessions().then((s) => { setSessions(s); setLoading(false); });
  }, []);

  // Group by role
  const grouped = new Map<string, MatchSession[]>();
  for (const s of sessions) {
    const key = groupBy === "role" ? s.role : new Date(s.created_at).toLocaleDateString();
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
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <button onClick={() => setViewingSession(null)} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-6 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
            Back to history
          </button>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-700">{s.role_category}</span>
              <h1 className="text-2xl font-bold">{s.role}</h1>
            </div>
            <p className="text-sm text-zinc-500">
              {s.candidate_count} candidates &middot; {s.file_name} &middot; {new Date(s.created_at).toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-6">
            <StatCard label="Candidates" value={s.candidate_count} />
            <StatCard label="Avg Score" value={s.avg_score} />
            <StatCard label="Top Tier" value={s.top_tier} accent="emerald" />
            <StatCard label="Good Fit" value={s.good_fit} accent="indigo" />
          </div>

          <RankedList candidates={s.results} />
        </div>
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
            <p className="text-sm text-zinc-500 mt-0.5">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setGroupBy("role")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${groupBy === "role" ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200"}`}>
              By role
            </button>
            <button onClick={() => setGroupBy("time")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${groupBy === "time" ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200"}`}>
              By date
            </button>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
            </div>
            <p className="font-medium text-zinc-700 mb-1">No matches yet</p>
            <p className="text-sm text-zinc-500 mb-4">Upload a CSV and score candidates to see results here</p>
            <a href="/upload" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
              New match
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {[...grouped.entries()].map(([group, groupSessions]) => (
              <div key={group}>
                <h2 className="text-sm font-semibold text-zinc-500 mb-3 flex items-center gap-2">
                  {groupBy === "role" && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">{groupSessions[0]?.role_category}</span>}
                  {group}
                  <span className="text-zinc-400 font-normal">{groupSessions.length} session{groupSessions.length > 1 ? "s" : ""}</span>
                </h2>
                <div className="space-y-2">
                  {groupSessions.map((s) => (
                    <div key={s.session_id} className="rounded-xl border border-zinc-200 bg-white hover:shadow-sm transition-shadow">
                      <button onClick={() => handleView(s)} className="w-full text-left p-4 flex items-center gap-4">
                        {/* Score ring */}
                        <div className={`shrink-0 w-12 h-12 rounded-full border-[3px] flex items-center justify-center text-sm font-bold ${
                          s.avg_score >= 60 ? "border-emerald-400 text-emerald-700" : s.avg_score >= 40 ? "border-indigo-400 text-indigo-700" : "border-zinc-300 text-zinc-600"
                        }`}>
                          {s.avg_score}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{s.role}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">
                            {s.candidate_count} candidates &middot; {s.file_name} &middot; {new Date(s.created_at).toLocaleDateString()} {new Date(s.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div className="flex gap-3 mt-1.5">
                            <span className="text-xs text-emerald-600 font-medium">{s.top_tier} top tier</span>
                            <span className="text-xs text-indigo-600 font-medium">{s.good_fit} good fit</span>
                          </div>
                        </div>

                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-zinc-400"><path d="m9 18 6-6-6-6" /></svg>
                      </button>

                      {/* Delete */}
                      <div className="px-4 pb-3 flex justify-end">
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(s.session_id); }}
                          className="text-xs text-zinc-400 hover:text-red-500 transition-colors">
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
  const border = accent === "emerald" ? "border-emerald-200" : accent === "indigo" ? "border-indigo-200" : "border-zinc-200";
  const bg = accent === "emerald" ? "bg-emerald-50" : accent === "indigo" ? "bg-indigo-50" : "bg-white";
  const text = accent === "emerald" ? "text-emerald-700" : accent === "indigo" ? "text-indigo-700" : "";
  return (
    <div className={`rounded-xl border ${border} ${bg} p-4`}>
      <div className={`text-2xl font-bold ${text}`}>{value}</div>
      <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
    </div>
  );
}

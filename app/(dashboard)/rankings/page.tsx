"use client";

import { useState, useEffect } from "react";
import { getSessions, getSession, deleteSession, MatchSession, ScoredCandidate } from "@/lib/sessions";

function StatBlock({ value, label, accent }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold tracking-tight ${accent ? "text-neutral-900" : "text-neutral-700"}`}>{value}</div>
      <div className="text-[9px] uppercase tracking-[0.15em] text-neutral-400 mt-0.5">{label}</div>
    </div>
  );
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<MatchSession[]>([]);
  const [viewingSession, setViewingSession] = useState<MatchSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<"time" | "role" | "judge">("role");
  const [judgeFilter, setJudgeFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState<number | null>(null);

  useEffect(() => {
    getSessions().then((raw) => {
      const deduped: MatchSession[] = [];
      const seen = new Set<string>();
      for (const s of raw) {
        const ts = Math.floor(new Date(s.created_at).getTime() / 2000);
        const key = `${s.role}|${s.candidate_count}|${ts}`;
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(s);
      }
      setSessions(deduped);
      setLoading(false);
    });
  }, []);

  const judges = [...new Set(sessions.map(s => s.judge || "").filter(Boolean))];
  const filtered = judgeFilter === "all" ? sessions : sessions.filter(s => (s.judge || "") === judgeFilter);

  const grouped = new Map<string, MatchSession[]>();
  for (const s of filtered) {
    const key = groupBy === "role" ? s.role : groupBy === "judge" ? (s.judge || "Untagged") : new Date(s.created_at).toLocaleDateString();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  }

  // Aggregate stats
  const totalCandidates = filtered.reduce((a, s) => a + (s.candidate_count || 0), 0);
  const totalCost = filtered.reduce((a, s) => a + (Number(s.cost) || 0), 0);
  const avgScore = filtered.length ? Math.round(filtered.reduce((a, s) => a + (s.avg_score || 0), 0) / filtered.length) : 0;

  async function handleDelete(id: string) {
    await deleteSession(id);
    const updated = await getSessions();
    // re-dedupe
    const deduped: MatchSession[] = [];
    const seen = new Set<string>();
    for (const s of updated) {
      const ts = Math.floor(new Date(s.created_at).getTime() / 2000);
      const key = `${s.role}|${s.candidate_count}|${ts}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(s);
    }
    setSessions(deduped);
    if (viewingSession?.session_id === id) setViewingSession(null);
  }

  async function handleView(session: MatchSession) {
    if (!session.results || session.results.length === 0) {
      const full = await getSession(session.session_id);
      if (full) { setViewingSession(full); return; }
    }
    setViewingSession(session);
  }

  // ── Session detail view ──
  if (viewingSession) {
    const s = viewingSession;
    const results = (s.results || []).sort((a, b) => (b.score || 0) - (a.score || 0));
    const topTier = results.filter(r => r.score >= 70);
    const goodFit = results.filter(r => r.score >= 50 && r.score < 70);
    const moderate = results.filter(r => r.score >= 30 && r.score < 50);
    const lowFit = results.filter(r => r.score < 30);

    const buckets = [0,10,20,30,40,50,60,70,80,90].map(b => ({
      label: b, count: results.filter(r => r.score >= b && r.score < b + 10).length,
    }));
    const maxBucket = Math.max(...buckets.map(b => b.count), 1);
    const scores = results.map(r => r.score);
    const mean = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const stdDev = scores.length ? Math.round(Math.sqrt(scores.reduce((sum, x) => sum + (x - mean) ** 2, 0) / scores.length)) : 0;

    return (
      <div className="flex-1 overflow-auto bg-neutral-50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <button onClick={() => setViewingSession(null)} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-900 mb-8 transition-colors uppercase tracking-wider">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
            Back
          </button>

          {/* Hero header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight font-serif italic">{s.role}</h1>
              {s.judge && <span className="px-3 py-1 rounded-full bg-neutral-900 text-white text-xs font-medium">{s.judge}</span>}
            </div>
            <p className="text-sm text-neutral-500">
              {s.candidate_count} candidates &middot; {s.file_name} &middot; {new Date(s.created_at).toLocaleString()}
            </p>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-6 mb-10 py-6 border-y border-neutral-200">
            <StatBlock value={results.length} label="Scored" accent />
            <StatBlock value={mean} label="Mean" />
            <StatBlock value={`\u00B1${stdDev}`} label="Std Dev" />
            <StatBlock value={topTier.length} label="Top Tier" accent />
            <StatBlock value={s.duration ? `${s.duration}s` : "—"} label="Duration" />
            <StatBlock value={s.cost ? `$${Number(s.cost).toFixed(3)}` : "—"} label="Cost" />
          </div>

          {/* Score distribution — clickable bars (same as upload results) */}
          <div className="border border-neutral-200 bg-white p-5 mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] uppercase tracking-[0.15em] text-neutral-400">Score Distribution</h2>
              {scoreFilter !== null && (
                <button onClick={() => setScoreFilter(null)} className="text-[10px] text-neutral-400 hover:text-neutral-900 underline">Show all</button>
              )}
            </div>
            <div className="flex items-end gap-1.5 h-20">
              {buckets.map(b => {
                const isActive = scoreFilter === b.label;
                return (
                  <button key={b.label} onClick={() => setScoreFilter(isActive ? null : b.label)} className="flex-1 flex flex-col items-center gap-1 group">
                    {b.count > 0 && <span className={`text-[9px] font-medium ${isActive ? "text-neutral-900" : "text-neutral-400"}`}>{b.count}</span>}
                    <div className={`w-full rounded-sm transition-all ${isActive ? "bg-neutral-900" : b.count > 0 ? "bg-neutral-300 group-hover:bg-neutral-900" : "bg-neutral-100"}`}
                      style={{ height: `${(b.count / maxBucket) * 60}px`, minHeight: b.count > 0 ? 3 : 0 }} />
                    <span className={`text-[9px] ${isActive ? "text-neutral-900 font-bold" : "text-neutral-400"}`}>{b.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pipeline */}
          <div className="flex gap-0 mb-10">
            {["Parse CSV", "Enrich LinkedIn", "Score GPT-4o-mini", "Rank & Tier"].map((step, i) => (
              <div key={step} className="flex-1 flex items-center">
                <div className="flex-1 border border-neutral-200 bg-white px-3 py-3 text-center">
                  <div className="text-[10px] font-bold text-neutral-900 uppercase tracking-wider">{i + 1}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{step}</div>
                </div>
                {i < 3 && <div className="w-3 h-px bg-neutral-300 shrink-0" />}
              </div>
            ))}
          </div>

          {/* Tier sections — filtered by score range if histogram bar clicked */}
          {[
            { label: "Top Tier", range: "70+", items: topTier, bg: "bg-neutral-900", text: "text-white" },
            { label: "Good Fit", range: "50-69", items: goodFit, bg: "bg-neutral-100", text: "text-neutral-900" },
            { label: "Moderate", range: "30-49", items: moderate, bg: "bg-white", text: "text-neutral-700" },
            { label: "Low Fit", range: "<30", items: lowFit, bg: "bg-white", text: "text-neutral-500" },
          ].map(t => ({ ...t, items: scoreFilter !== null ? t.items.filter(r => r.score >= scoreFilter && r.score < scoreFilter + 10) : t.items })).filter(t => t.items.length > 0).map(tier => (
            <div key={tier.label} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tier.bg} ${tier.text}`}>{tier.label}</span>
                <span className="text-xs text-neutral-400">{tier.range} &middot; {tier.items.length} candidate{tier.items.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="space-y-1.5">
                {tier.items.map((c, i) => (
                  <CandidateRow key={c.id || i} candidate={c} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── History list ──
  return (
    <div className="flex-1 overflow-auto bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-serif italic">Match History</h1>
            <p className="text-sm text-neutral-400 mt-1">{filtered.length} session{filtered.length !== 1 ? "s" : ""} &middot; {totalCandidates} candidates scored &middot; ${totalCost.toFixed(3)} total</p>
          </div>
          <div className="flex gap-1">
            {(["role", "judge", "time"] as const).map(g => (
              <button key={g} onClick={() => setGroupBy(g)}
                className={`px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors ${groupBy === g ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"}`}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Judge filter */}
        {judges.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            <button onClick={() => setJudgeFilter("all")}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${judgeFilter === "all" ? "bg-neutral-900 text-white" : "border border-neutral-200 text-neutral-500 hover:border-neutral-400"}`}>
              All
            </button>
            {judges.map(j => (
              <button key={j} onClick={() => setJudgeFilter(j)}
                className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium font-serif italic transition-colors ${judgeFilter === j ? "bg-neutral-900 text-white" : "border border-neutral-200 text-neutral-500 hover:border-neutral-400"}`}>
                {j}
              </button>
            ))}
          </div>
        )}

        {/* Aggregate stats bar */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-8 py-5 border-y border-neutral-200">
            <StatBlock value={filtered.length} label="Sessions" accent />
            <StatBlock value={totalCandidates} label="Candidates" />
            <StatBlock value={avgScore} label="Avg Score" />
            <StatBlock value={`$${totalCost.toFixed(3)}`} label="Total Cost" />
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-neutral-400 mb-4">No matches yet</p>
            <a href="/upload" className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white text-sm font-medium hover:bg-black transition-colors">
              New match
            </a>
          </div>
        ) : (
          <div className="space-y-8">
            {[...grouped.entries()].map(([group, groupSessions]) => (
              <div key={group}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">{group}</h2>
                  <div className="flex-1 h-px bg-neutral-200" />
                  <span className="text-xs text-neutral-400">{groupSessions.length}</span>
                </div>

                <div className="space-y-2">
                  {groupSessions.map((s) => (
                    <div key={s.session_id} className="group bg-white border border-neutral-200 hover:border-neutral-400 transition-all">
                      <button onClick={() => handleView(s)} className="w-full text-left p-4 sm:p-5">
                        <div className="flex items-start gap-4">
                          {/* Score */}
                          <div className={`shrink-0 w-14 h-14 rounded-full border-2 flex items-center justify-center text-lg font-bold tabular-nums ${
                            s.avg_score >= 60 ? "border-neutral-900 text-neutral-900" : s.avg_score >= 40 ? "border-neutral-400 text-neutral-600" : "border-neutral-200 text-neutral-400"
                          }`}>
                            {s.avg_score}
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Title row */}
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-semibold text-sm text-neutral-900">{s.role}</span>
                              {s.judge && <span className="px-2 py-0.5 bg-neutral-900 text-white text-[9px] font-medium uppercase tracking-wider">{s.judge}</span>}
                            </div>

                            {/* Subtitle */}
                            <div className="text-[11px] text-neutral-400 mb-3">
                              {s.candidate_count} candidates &middot; {new Date(s.created_at).toLocaleDateString()} {new Date(s.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {s.file_name && <> &middot; {s.file_name}</>}
                            </div>

                            {/* Metrics row */}
                            <div className="flex gap-5 flex-wrap">
                              <Metric value={s.top_tier} label="Top Tier" highlight />
                              <Metric value={s.good_fit} label="Good Fit" />
                              {(s.duration != null && s.duration > 0) && <Metric value={`${s.duration}s`} label="Duration" />}
                              {(s.cost != null && Number(s.cost) > 0) && <Metric value={`$${Number(s.cost).toFixed(3)}`} label="Cost" />}
                              {(s.tokens != null && Number(s.tokens) > 0) && <Metric value={`${(Number(s.tokens) / 1000).toFixed(1)}k`} label="Tokens" />}
                            </div>
                          </div>

                          {/* Arrow */}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-neutral-300 group-hover:text-neutral-500 transition-colors mt-1">
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </div>
                      </button>

                      {/* Delete bar */}
                      <div className="px-5 py-2 border-t border-neutral-100 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(s.session_id); }}
                          className="text-[10px] text-neutral-400 hover:text-red-500 transition-colors uppercase tracking-wider">
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

// ── Small metric chip ──
function Metric({ value, label, highlight }: { value: string | number; label: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`text-sm font-bold tabular-nums ${highlight ? "text-neutral-900" : "text-neutral-600"}`}>{value}</span>
      <span className="text-[9px] text-neutral-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ── Candidate row — matches upload/results page exactly ──
function CandidateRow({ candidate: c }: { candidate: ScoredCandidate }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-neutral-200 bg-white hover:border-neutral-300 transition-colors">
      <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-neutral-50" onClick={() => setOpen(!open)}>
        {/* Photo */}
        {c.photo_url ? (
          <img src={c.photo_url} alt={c.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-neutral-100 shrink-0 flex items-center justify-center text-neutral-400 font-bold">
            {(c.name || "?")[0]}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-400 font-mono">#{c.rank}</span>
            <span className="font-semibold text-sm">{c.name}</span>
            <span className={`px-2 py-0.5 text-xs font-bold ${c.score >= 70 ? "bg-neutral-900 text-white" : c.score >= 50 ? "bg-neutral-100" : "text-neutral-400"}`}>{c.score}</span>
            {c.linkedin_url && (
              <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                className="text-neutral-400 hover:text-neutral-600 shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            )}
          </div>
          <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{c.reasoning}</p>
        </div>
      </div>

      {/* Expanded — same as upload results: pie chart + legend + evidence + highlights/gaps */}
      {open && (
        <div className="px-4 pb-4 border-t border-neutral-100">
          <div className="mt-3 h-1 bg-neutral-100 mb-3"><div className="h-full bg-neutral-900" style={{ width: `${c.score}%` }} /></div>
          <p className="text-sm text-neutral-700 mb-3">{c.reasoning}</p>
          {c.criteria && c.criteria.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 mb-3">
              {/* Donut pie chart */}
              <div className="shrink-0">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  {(() => {
                    const colors = ["#171717", "#404040", "#737373", "#a3a3a3", "#d4d4d4", "#e5e5e5"];
                    let cumulative = 0;
                    const total = c.criteria!.reduce((s, cr) => s + (cr.max || 0), 0) || 100;
                    return c.criteria!.map((cr, i) => {
                      const startAngle = cumulative * 2 * Math.PI;
                      cumulative += (cr.max || 0) / total;
                      const scorePct = (cr.score || 0) / total;
                      const scoreEndAngle = startAngle + scorePct * 2 * Math.PI;
                      const x1 = 50 + 45 * Math.cos(startAngle - Math.PI / 2);
                      const y1 = 50 + 45 * Math.sin(startAngle - Math.PI / 2);
                      const x2 = 50 + 45 * Math.cos(scoreEndAngle - Math.PI / 2);
                      const y2 = 50 + 45 * Math.sin(scoreEndAngle - Math.PI / 2);
                      const large = scorePct > 0.5 ? 1 : 0;
                      return (
                        <g key={i}>
                          <title>{cr.name}: {cr.score}/{cr.max} — {cr.evidence || ""}</title>
                          <path d={`M50,50 L${x1},${y1} A45,45 0 ${large},1 ${x2},${y2} Z`} fill={colors[i % colors.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                        </g>
                      );
                    });
                  })()}
                  <circle cx="50" cy="50" r="22" fill="white" />
                  <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="text-lg font-bold" fill="#171717">{c.score}</text>
                </svg>
              </div>
              {/* Legend with scores + evidence */}
              <div className="flex-1 space-y-1.5">
                {c.criteria!.map((cr, i) => {
                  const colors = ["#171717", "#404040", "#737373", "#a3a3a3", "#d4d4d4", "#e5e5e5"];
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0 mt-0.5" style={{ backgroundColor: colors[i % colors.length] }} />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="text-[11px] font-medium">{cr.name}</span>
                          <span className="text-[11px] font-bold tabular-nums">{cr.score}/{cr.max}</span>
                        </div>
                        {cr.evidence && <p className="text-[10px] text-neutral-500 leading-tight">{cr.evidence}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex gap-4">
            {(c.highlights||[]).length > 0 && <div>{c.highlights!.map((h,i) => <span key={i} className="inline-block text-[10px] bg-neutral-50 border border-neutral-100 rounded px-1.5 py-0.5 mr-1 mb-1">+ {h}</span>)}</div>}
            {(c.gaps||[]).length > 0 && <div>{c.gaps!.map((g,i) => <span key={i} className="inline-block text-[10px] text-neutral-400 bg-neutral-50 border border-neutral-100 rounded px-1.5 py-0.5 mr-1 mb-1">- {g}</span>)}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

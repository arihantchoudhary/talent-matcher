"use client";

import { useState, useMemo } from "react";
import { ScoredCandidate } from "@/lib/types";

function scoreBadge(score: number) {
  if (score >= 70) return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", label: "Top Tier" };
  if (score >= 50) return { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", label: "Good Fit" };
  if (score >= 30) return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", label: "Moderate" };
  return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", label: "Low Fit" };
}

export function ResultsStep({
  results, shortlist, toggleShortlist, jobTitle, onCheckout,
}: {
  results: ScoredCandidate[]; shortlist: Set<string>; toggleShortlist: (id: string) => void; jobTitle: string; onCheckout: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = results;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q) || r.reasoning.toLowerCase().includes(q) ||
        Object.values(r.rawFields).some((v) => v.toLowerCase().includes(q)));
    }
    if (filter === "top") list = list.filter((r) => r.score >= 70);
    else if (filter === "good") list = list.filter((r) => r.score >= 50 && r.score < 70);
    else if (filter === "low") list = list.filter((r) => r.score < 50);
    else if (filter === "shortlisted") list = list.filter((r) => shortlist.has(r.id));
    return list;
  }, [results, search, filter, shortlist]);

  const topCount = results.filter((r) => r.score >= 70).length;
  const goodCount = results.filter((r) => r.score >= 50 && r.score < 70).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">{results.length} candidates scored</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Ranked for <span className="font-medium text-[var(--text-secondary)]">{jobTitle}</span>
            {topCount > 0 && <> &middot; <span className="text-emerald-600 font-medium">{topCount} top tier</span></>}
            {goodCount > 0 && <> &middot; <span className="text-indigo-600 font-medium">{goodCount} good fit</span></>}
          </p>
        </div>
        {shortlist.size > 0 && (
          <button onClick={onCheckout}
            className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all shadow-sm flex items-center gap-2">
            Export {shortlist.size} shortlisted
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        )}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input type="text" placeholder="Search candidates..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-white text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]" />
        </div>
        <div className="flex gap-2">
          {[
            { v: "all", l: "All", c: results.length },
            { v: "top", l: "Top Tier", c: topCount },
            { v: "good", l: "Good Fit", c: goodCount },
            { v: "low", l: "< 50", c: results.filter((r) => r.score < 50).length },
            { v: "shortlisted", l: "Shortlisted", c: shortlist.size },
          ].map((f) => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                filter === f.v ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "bg-white text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-light)]"
              }`}>
              {f.l} <span className={filter === f.v ? "opacity-80" : "text-[var(--text-muted)]"}>{f.c}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)]">No candidates match</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const badge = scoreBadge(r.score);
            const isExpanded = expanded === r.id;
            return (
              <div key={r.id} className={`rounded-2xl border bg-white transition-all ${shortlist.has(r.id) ? "border-[var(--accent)] ring-1 ring-[var(--accent)]/20" : "border-[var(--border)]"}`}>
                {/* Card header */}
                <div className="flex items-start gap-4 p-4 cursor-pointer hover:bg-[var(--surface-2)]/50 transition-colors" onClick={() => setExpanded(isExpanded ? null : r.id)}>
                  <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-sm font-bold text-[var(--text-muted)]">
                    #{r.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{r.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${badge.bg} ${badge.border} ${badge.text}`}>
                        {r.score} &middot; {badge.label}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">{r.reasoning}</p>
                    {(r.highlights.length > 0) && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {r.highlights.slice(0, 3).map((h, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-xs bg-emerald-50 text-emerald-700 border border-emerald-100">{h}</span>
                        ))}
                        {r.gaps.slice(0, 2).map((g, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-xs bg-red-50 text-red-600 border border-red-100">{g}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggleShortlist(r.id); }}
                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      shortlist.has(r.id) ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)]"
                    }`}>
                    {shortlist.has(r.id) ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                    )}
                  </button>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-[var(--border)] p-4 bg-[var(--surface-2)]/30 fade-in">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      {Object.entries(r.rawFields).slice(0, 12).map(([key, val]) => {
                        if (!val || val.length > 200) return null;
                        return (
                          <div key={key} className="rounded-lg bg-white p-2.5 border border-[var(--border)]">
                            <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">{key.replace(/_/g, " ")}</div>
                            <div className="text-xs truncate" title={val}>{val}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

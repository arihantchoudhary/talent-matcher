"use client";

import { useState } from "react";

interface Candidate {
  rank: number;
  id: string;
  name: string;
  score: number;
  reasoning: string;
  highlights: string[];
  gaps: string[];
}

function scoreColor(score: number) {
  if (score >= 70) return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", bar: "bg-emerald-500" };
  if (score >= 50) return { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", bar: "bg-indigo-500" };
  if (score >= 30) return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", bar: "bg-amber-500" };
  return { bg: "bg-red-50", border: "border-red-200", text: "text-red-600", bar: "bg-red-400" };
}

function scoreLabel(score: number) {
  if (score >= 70) return "Top Tier";
  if (score >= 50) return "Good Fit";
  if (score >= 30) return "Moderate";
  return "Low Fit";
}

export function RankedList({ candidates }: { candidates: Candidate[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = candidates.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.reasoning.toLowerCase().includes(q)) return false;
    }
    if (filter === "top") return c.score >= 70;
    if (filter === "good") return c.score >= 50 && c.score < 70;
    if (filter === "mid") return c.score >= 30 && c.score < 50;
    if (filter === "low") return c.score < 30;
    return true;
  });

  return (
    <div>
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search candidates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 text-sm
                       placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
          />
        </div>
        <div className="flex gap-1.5">
          {[
            { v: "all", l: "All", c: candidates.length },
            { v: "top", l: "70+", c: candidates.filter((c) => c.score >= 70).length },
            { v: "good", l: "50-69", c: candidates.filter((c) => c.score >= 50 && c.score < 70).length },
            { v: "mid", l: "30-49", c: candidates.filter((c) => c.score >= 30 && c.score < 50).length },
            { v: "low", l: "<30", c: candidates.filter((c) => c.score < 30).length },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                filter === f.v
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              {f.l}
              <span className={`ml-1 ${filter === f.v ? "text-zinc-300" : "text-zinc-400"}`}>{f.c}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-zinc-400 mb-3">{filtered.length} of {candidates.length} candidates</p>

      {/* Candidate list */}
      <div className="space-y-2">
        {filtered.map((c) => {
          const colors = scoreColor(c.score);
          const isOpen = expanded === c.id;

          return (
            <div
              key={c.id}
              className="rounded-xl border border-zinc-200 bg-white overflow-hidden transition-shadow hover:shadow-sm"
            >
              {/* Row */}
              <button
                onClick={() => setExpanded(isOpen ? null : c.id)}
                className="w-full text-left px-4 py-3.5 flex items-start gap-3"
              >
                {/* Rank */}
                <span className="shrink-0 w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-500">
                  {c.rank}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm">{c.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${colors.bg} ${colors.border} ${colors.text}`}>
                      {c.score} &middot; {scoreLabel(c.score)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{c.reasoning}</p>
                </div>

                {/* Expand arrow */}
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`shrink-0 mt-1.5 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="px-4 pb-4 pt-0 border-t border-zinc-100">
                  {/* Score bar */}
                  <div className="mt-3 mb-4">
                    <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                      <div className={`h-full rounded-full ${colors.bar} transition-all`} style={{ width: `${c.score}%` }} />
                    </div>
                  </div>

                  {/* Reasoning */}
                  <p className="text-sm text-zinc-700 leading-relaxed mb-4">{c.reasoning}</p>

                  {/* Highlights + Gaps */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {c.highlights.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Strengths</h4>
                        <div className="space-y-1">
                          {c.highlights.map((h, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" className="shrink-0 mt-0.5">
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                              <span className="text-sm text-zinc-700">{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {c.gaps.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Gaps</h4>
                        <div className="space-y-1">
                          {c.gaps.map((g, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" className="shrink-0 mt-0.5">
                                <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" />
                              </svg>
                              <span className="text-sm text-zinc-700">{g}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

interface Candidate {
  rank: number; id: string; name: string; score: number;
  reasoning: string; highlights: string[]; gaps: string[];
  linkedin_headline?: string; linkedin_photo?: string; linkedin_url?: string;
}

function scoreColor(score: number) {
  if (score >= 70) return { bg: "bg-neutral-900", border: "border-neutral-900", text: "text-white", bar: "bg-neutral-900" };
  if (score >= 50) return { bg: "bg-neutral-100", border: "border-neutral-300", text: "text-neutral-700", bar: "bg-neutral-600" };
  if (score >= 30) return { bg: "bg-neutral-50", border: "border-neutral-200", text: "text-neutral-500", bar: "bg-neutral-400" };
  return { bg: "bg-white", border: "border-neutral-200", text: "text-neutral-400", bar: "bg-neutral-300" };
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
    if (search) { const q = search.toLowerCase(); if (!c.name.toLowerCase().includes(q) && !c.reasoning.toLowerCase().includes(q) && !(c.linkedin_headline||"").toLowerCase().includes(q)) return false; }
    if (filter === "top") return c.score >= 70;
    if (filter === "good") return c.score >= 50 && c.score < 70;
    if (filter === "mid") return c.score >= 30 && c.score < 50;
    if (filter === "low") return c.score < 30;
    return true;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input type="text" placeholder="Search candidates..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-300" />
        </div>
        <div className="flex gap-1.5">
          {[
            { v: "all", l: "All", c: candidates.length },
            { v: "top", l: "70+", c: candidates.filter((c) => c.score >= 70).length },
            { v: "good", l: "50-69", c: candidates.filter((c) => c.score >= 50 && c.score < 70).length },
            { v: "mid", l: "30-49", c: candidates.filter((c) => c.score >= 30 && c.score < 50).length },
            { v: "low", l: "<30", c: candidates.filter((c) => c.score < 30).length },
          ].map((f) => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${filter === f.v ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-400 hover:text-neutral-600"}`}>
              {f.l}<span className={`ml-1 ${filter === f.v ? "text-neutral-300" : "text-neutral-400"}`}>{f.c}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-neutral-400 mb-3">{filtered.length} of {candidates.length} candidates</p>

      <div className="space-y-2">
        {filtered.map((c) => {
          const colors = scoreColor(c.score);
          const isOpen = expanded === c.id;
          return (
            <div key={c.id} className="rounded-xl border border-neutral-200 bg-white overflow-hidden hover:shadow-sm transition-shadow">
              <button onClick={() => setExpanded(isOpen ? null : c.id)} className="w-full text-left px-4 py-3.5 flex items-start gap-3">
                <div className="shrink-0 relative">
                  {c.linkedin_photo ? (
                    <img src={c.linkedin_photo} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-neutral-200" />
                  ) : (
                    <span className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-500">{c.name.charAt(0)}</span>
                  )}
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-[9px] font-bold text-neutral-500">{c.rank}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm">{c.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${colors.bg} ${colors.border} ${colors.text}`}>{c.score} &middot; {scoreLabel(c.score)}</span>
                  </div>
                  {c.linkedin_headline && <p className="text-xs text-neutral-600 mb-0.5 truncate">{c.linkedin_headline}</p>}
                  <p className="text-xs text-neutral-400 line-clamp-1">{c.reasoning}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`shrink-0 mt-1.5 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-0 border-t border-neutral-100 fade-in">
                  <div className="mt-3 mb-4">
                    <div className="h-2 rounded-full bg-neutral-100 overflow-hidden"><div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${c.score}%` }} /></div>
                  </div>
                  {c.linkedin_url && (
                    <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-neutral-900 hover:text-neutral-900 mb-3">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      LinkedIn profile
                    </a>
                  )}
                  <p className="text-sm text-neutral-700 leading-relaxed mb-4">{c.reasoning}</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {c.highlights.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Strengths</h4>
                        {c.highlights.map((h, i) => (
                          <div key={i} className="flex items-start gap-2 mb-1">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" className="shrink-0 mt-0.5"><path d="M20 6 9 17l-5-5" /></svg>
                            <span className="text-sm text-neutral-700">{h}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {c.gaps.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Gaps</h4>
                        {c.gaps.map((g, i) => (
                          <div key={i} className="flex items-start gap-2 mb-1">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /></svg>
                            <span className="text-sm text-neutral-700">{g}</span>
                          </div>
                        ))}
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

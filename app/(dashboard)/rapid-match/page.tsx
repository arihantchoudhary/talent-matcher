"use client";

import { useState, useRef, useMemo, useEffect, DragEvent } from "react";
import { ROLES as DEFAULT_ROLES, CATEGORIES, CITIES, Role } from "@/lib/roles";
import { loadRoles } from "@/lib/roles-api";
import { parseStructuredCSV, rapidScoreAll, RapidResult } from "@/lib/rapid-match";

export default function RapidMatchPage() {
  const [ROLES, setROLES] = useState<Role[]>(DEFAULT_ROLES);
  useEffect(() => { loadRoles().then(setROLES); }, []);

  // File state
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Role picker
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [catFilter, setCatFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [roleSearch, setRoleSearch] = useState("");

  // Results
  const [results, setResults] = useState<RapidResult[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [step, setStep] = useState<"setup" | "loading" | "results">("setup");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [scoreFilter, setScoreFilter] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "card" | "table">("list");

  // LinkedIn DB cache (fetched once)
  const linkedinDBRef = useRef<Map<string, { name: string; photo_url: string }> | null>(null);

  const filteredRoles = useMemo(() => {
    let list = ROLES;
    if (catFilter !== "All") list = list.filter(r => r.category === catFilter);
    if (cityFilter !== "All") list = list.filter(r => r.locations.includes(cityFilter) || r.remote);
    if (roleSearch) { const q = roleSearch.toLowerCase(); list = list.filter(r => r.title.toLowerCase().includes(q)); }
    return list;
  }, [ROLES, catFilter, cityFilter, roleSearch]);

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const t = e.target?.result as string;
      setCsvText(t);
      setRowCount(parseStructuredCSV(t).length);
    };
    reader.readAsText(file);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault(); setDragging(false);
    e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]);
  }

  function pickRole(idx: number) {
    setSelectedIdx(idx);
    setShowPicker(false);
  }

  async function runMatch() {
    if (!csvText) return;
    setStep("loading");

    // Fetch LinkedIn DB if not cached
    if (!linkedinDBRef.current) {
      try {
        const API = "https://aicm3pweed.us-east-1.awsapprunner.com";
        const resp = await fetch(`${API}/linkedin/database`, { signal: AbortSignal.timeout(8000) });
        if (resp.ok) {
          const data = await resp.json() as { items: { url?: string; name?: string; photo_url?: string }[] };
          const db = new Map<string, { name: string; photo_url: string }>();
          for (const item of data.items) {
            const url = (item.url || "").replace(/\/$/, "").toLowerCase();
            if (url) db.set(url, { name: item.name || "", photo_url: item.photo_url || "" });
          }
          linkedinDBRef.current = db;
        }
      } catch { /* continue without enrichment */ }
    }

    const start = performance.now();
    const candidates = parseStructuredCSV(csvText);
    if (candidates.length === 0) { setStep("setup"); return; }

    // Enrich candidates with LinkedIn DB photos + names
    const db = linkedinDBRef.current;
    if (db) {
      for (const c of candidates) {
        if (!c.linkedinUrl) continue;
        const normalized = c.linkedinUrl.replace(/\/$/, "").toLowerCase();
        const match = db.get(normalized);
        if (match) {
          if (match.photo_url) c.photoUrl = match.photo_url;
          // Use LinkedIn DB name if we only have a fallback name
          if (match.name && (c.name.startsWith("Candidate ") || c.name.length <= 3)) {
            c.name = match.name;
          }
        }
      }
    }

    const scored = rapidScoreAll(candidates, ROLES[selectedIdx]);
    setElapsed(Math.round(performance.now() - start));
    setResults(scored);
    setStep("results");
  }

  const role = ROLES[selectedIdx];

  // ── LOADING ──
  if (step === "loading") {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-neutral-500">Loading LinkedIn photos...</p>
      </div>
    );
  }

  // ── RESULTS VIEW ──
  if (step === "results") {
    const scores = results.map(r => r.score);
    const mean = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const stdDev = scores.length > 0 ? Math.round(Math.sqrt(scores.reduce((s, x) => s + (x - mean) ** 2, 0) / scores.length)) : 0;
    const topTier = results.filter(r => r.score >= 70).length;
    const goodFit = results.filter(r => r.score >= 50 && r.score < 70).length;

    const displayResults = scoreFilter !== null
      ? results.filter(r => r.score >= scoreFilter && r.score < scoreFilter + 10)
      : results;

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{results.length} candidates ranked</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">Rapid</span>
            </div>
            <p className="text-sm text-neutral-500">
              {role.title} &middot; Mean {mean} &middot; Std Dev {stdDev} &middot; {elapsed}ms
              &middot; {topTier} top tier &middot; {goodFit} good fit
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setStep("setup"); setResults([]); }} className="text-xs text-neutral-500 hover:text-neutral-900 border border-neutral-200 rounded-lg px-3 py-1.5">New match</button>
            <button onClick={() => {
              const csv = ["Rank,Name,Score,Reasoning,Highlights,Gaps,LinkedIn", ...results.map(r =>
                `${r.rank},"${r.name}",${r.score},"${(r.reasoning || '').replace(/"/g, '""')}","${(r.highlights || []).join('; ')}","${(r.gaps || []).join('; ')}","${r.linkedin_url || ''}"`
              )].join("\n");
              const blob = new Blob([csv], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${role.title.replace(/[^a-z0-9]/gi, '-')}-rapid-rankings.csv`; a.click();
            }} className="text-xs font-medium bg-neutral-900 text-white rounded-lg px-3 py-1.5 hover:bg-black">Download CSV</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div className="border border-neutral-200 bg-white rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{results.length}</div>
            <div className="text-[10px] text-neutral-400 uppercase mt-0.5">Total</div>
          </div>
          <div className="border border-neutral-200 bg-white rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{mean}</div>
            <div className="text-[10px] text-neutral-400 uppercase mt-0.5">Avg Score</div>
          </div>
          <div className="border border-neutral-900 bg-neutral-900 text-white rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{topTier}</div>
            <div className="text-[10px] text-neutral-400 uppercase mt-0.5">Top Tier</div>
          </div>
          <div className="border border-neutral-200 bg-white rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{goodFit}</div>
            <div className="text-[10px] text-neutral-400 uppercase mt-0.5">Good Fit</div>
          </div>
          <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-emerald-700">{elapsed}ms</div>
            <div className="text-[10px] text-emerald-600 uppercase mt-0.5">Speed</div>
          </div>
        </div>

        {/* Score distribution */}
        <div className="border border-neutral-200 bg-white rounded-lg p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-[0.1em] text-neutral-400">Score Distribution</p>
            {scoreFilter !== null && (
              <button onClick={() => setScoreFilter(null)} className="text-[10px] text-neutral-400 hover:text-neutral-900 underline">Show all</button>
            )}
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map(b => {
              const count = results.filter(r => r.score >= b && r.score < b + 10).length;
              const max = Math.max(...[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map(x => results.filter(r => r.score >= x && r.score < x + 10).length), 1);
              const isActive = scoreFilter === b;
              return (
                <button key={b} onClick={() => setScoreFilter(isActive ? null : b)} className="flex-1 flex flex-col items-center gap-1 group">
                  {count > 0 && <span className={`text-[9px] font-medium ${isActive ? "text-neutral-900" : "text-neutral-400"}`}>{count}</span>}
                  <div className={`w-full rounded transition-all ${isActive ? "bg-neutral-900" : count > 0 ? "bg-neutral-300 group-hover:bg-neutral-900" : "bg-neutral-100"}`}
                    style={{ height: `${(count / max) * 48}px`, minHeight: count > 0 ? 3 : 0 }} />
                  <span className={`text-[9px] ${isActive ? "text-neutral-900 font-bold" : "text-neutral-400"}`}>{b}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 mb-4">
          {(["list", "card", "table"] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewMode === v ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"}`}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* LIST VIEW */}
        {viewMode === "list" && (
          <div className="space-y-2">
            {displayResults.map(c => (
              <div key={c.id} className="border border-neutral-200 bg-white rounded-lg overflow-hidden">
                <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-neutral-50" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                  {c.photo_url ? <img src={c.photo_url} alt={c.name} className="w-12 h-12 rounded-lg object-cover shrink-0" /> : <div className="w-12 h-12 rounded-lg bg-neutral-100 shrink-0 flex items-center justify-center text-neutral-400 font-bold">{c.name?.charAt(0)}</div>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400 font-mono">#{c.rank}</span>
                      <span className="font-semibold text-sm">{c.name}</span>
                      <span className={`px-2 py-0.5 text-xs font-bold ${c.score >= 70 ? "bg-neutral-900 text-white" : c.score >= 50 ? "bg-neutral-100" : "text-neutral-400"}`}>{c.score}</span>
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{c.reasoning}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className={`shrink-0 text-neutral-400 transition-transform ${expanded === c.id ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
                </div>
                {expanded === c.id && (
                  <div className="px-4 pb-4 border-t border-neutral-100">
                    <div className="mt-3 h-1 bg-neutral-100 mb-3"><div className="h-full bg-neutral-900" style={{ width: `${c.score}%` }} /></div>

                    {c.linkedin_url && (
                      <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-900 mb-3">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                        LinkedIn profile
                      </a>
                    )}

                    <p className="text-sm text-neutral-700 mb-3">{c.reasoning}</p>

                    {/* Breakdown bars */}
                    <div className="space-y-2 mb-3">
                      {c.breakdown.map((b, i) => (
                        <div key={i}>
                          <div className="flex justify-between mb-0.5">
                            <span className="text-[11px] font-medium">{b.name}</span>
                            <span className="text-[11px] font-bold tabular-nums">{b.score}/{b.max}</span>
                          </div>
                          <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${b.score >= b.max * 0.7 ? "bg-neutral-900" : b.score >= b.max * 0.4 ? "bg-neutral-400" : "bg-neutral-200"}`}
                              style={{ width: `${(b.score / b.max) * 100}%` }} />
                          </div>
                          <p className="text-[10px] text-neutral-400 mt-0.5">{b.detail}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-4">
                      {c.highlights.length > 0 && <div>{c.highlights.map((h, i) => <span key={i} className="inline-block text-[10px] bg-neutral-50 border border-neutral-100 rounded px-1.5 py-0.5 mr-1 mb-1">+ {h}</span>)}</div>}
                      {c.gaps.length > 0 && <div>{c.gaps.map((g, i) => <span key={i} className="inline-block text-[10px] text-neutral-400 bg-neutral-50 border border-neutral-100 rounded px-1.5 py-0.5 mr-1 mb-1">- {g}</span>)}</div>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CARD VIEW */}
        {viewMode === "card" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {displayResults.map(c => (
              <div key={c.id} className="border border-neutral-200 bg-white rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-neutral-400 font-mono">#{c.rank}</span>
                  <span className={`px-2 py-0.5 text-xs font-bold ${c.score >= 70 ? "bg-neutral-900 text-white" : c.score >= 50 ? "bg-neutral-100" : "text-neutral-400"}`}>{c.score}</span>
                </div>
                {c.photo_url ? <img src={c.photo_url} alt={c.name} className="w-16 h-16 rounded-xl object-cover mx-auto mb-3" /> : <div className="w-16 h-16 rounded-xl bg-neutral-100 mx-auto mb-3 flex items-center justify-center text-xl font-bold text-neutral-300">{c.name?.charAt(0)}</div>}
                <h3 className="font-semibold text-sm text-center mb-1">{c.name}</h3>
                <p className="text-[10px] text-neutral-500 text-center line-clamp-2">{c.reasoning}</p>
              </div>
            ))}
          </div>
        )}

        {/* TABLE VIEW */}
        {viewMode === "table" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-neutral-900">
                  <th className="text-left py-2 font-semibold">#</th>
                  <th className="text-left py-2 font-semibold">Name</th>
                  <th className="text-center py-2 font-semibold">Score</th>
                  <th className="text-center py-2 font-semibold">Exp</th>
                  <th className="text-center py-2 font-semibold">Loc</th>
                  <th className="text-center py-2 font-semibold">Grade</th>
                  <th className="text-center py-2 font-semibold">Skills</th>
                  <th className="text-center py-2 font-semibold">Industry</th>
                  <th className="text-center py-2 font-semibold">Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {displayResults.map(c => (
                  <tr key={c.id} className="hover:bg-neutral-50">
                    <td className="py-2 text-neutral-400 font-mono text-xs">{c.rank}</td>
                    <td className="py-2 font-medium">{c.name}</td>
                    <td className="py-2 text-center">
                      <span className={`px-2 py-0.5 text-xs font-bold ${c.score >= 70 ? "bg-neutral-900 text-white" : c.score >= 50 ? "bg-neutral-100" : "text-neutral-400"}`}>{c.score}</span>
                    </td>
                    {c.breakdown.map((b, i) => (
                      <td key={i} className="py-2 text-center text-xs tabular-nums">{b.score}/{b.max}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── SETUP VIEW ──
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-3xl font-bold tracking-tight font-serif italic">Rapid Match</h1>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">No AI</span>
        </div>
        <p className="text-sm text-neutral-500 mt-1">
          Instant scoring using CSV column data — experience, location, grades, skills, industries. No API calls, no waiting.
        </p>
      </div>

      {/* Step 1: Upload CSV */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.15em] text-neutral-400 mb-3">1. Upload CSV</p>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragging ? "border-neutral-900 bg-neutral-50" : fileName ? "border-emerald-300 bg-emerald-50" : "border-neutral-200 hover:border-neutral-400"}`}
        >
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {fileName ? (
            <div>
              <p className="font-medium text-sm">{fileName}</p>
              <p className="text-xs text-neutral-500 mt-1">{rowCount} candidates parsed</p>
            </div>
          ) : (
            <div>
              <svg className="mx-auto mb-2 text-neutral-300" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
              <p className="text-sm text-neutral-600">Drop a CSV here or click to browse</p>
              <p className="text-xs text-neutral-400 mt-1">Any format — we auto-detect columns</p>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Pick role */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.15em] text-neutral-400 mb-3">2. Select Role</p>
        <button onClick={() => setShowPicker(!showPicker)}
          className="w-full text-left border border-neutral-200 rounded-lg p-4 hover:border-neutral-400 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-neutral-400 border border-neutral-200 px-2 py-0.5 rounded">{role?.category}</span>
                <span className="font-semibold">{role?.title}</span>
              </div>
              <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{role?.description?.substring(0, 100)}...</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-neutral-400 transition-transform ${showPicker ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
          </div>
        </button>

        {showPicker && (
          <div className="mt-2 border border-neutral-200 rounded-lg bg-white max-h-96 overflow-y-auto">
            {/* Filters */}
            <div className="sticky top-0 bg-white border-b border-neutral-100 p-3 space-y-2">
              <input type="text" placeholder="Search roles..." value={roleSearch} onChange={e => setRoleSearch(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500/20" />
              <div className="flex gap-1 overflow-x-auto pb-1">
                <button onClick={() => setCatFilter("All")} className={`shrink-0 px-2 py-1 text-[10px] font-medium rounded ${catFilter === "All" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"}`}>All</button>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCatFilter(c)} className={`shrink-0 px-2 py-1 text-[10px] font-medium rounded ${catFilter === c ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"}`}>{c}</button>
                ))}
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1">
                <button onClick={() => setCityFilter("All")} className={`shrink-0 px-2 py-1 text-[10px] font-medium rounded ${cityFilter === "All" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"}`}>All Cities</button>
                {CITIES.slice(0, 12).map(c => (
                  <button key={c} onClick={() => setCityFilter(c)} className={`shrink-0 px-2 py-1 text-[10px] font-medium rounded ${cityFilter === c ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"}`}>{c}</button>
                ))}
              </div>
            </div>
            {filteredRoles.map((r, i) => {
              const realIdx = ROLES.indexOf(r);
              return (
                <button key={realIdx} onClick={() => pickRole(realIdx)}
                  className={`w-full text-left px-4 py-3 border-b border-neutral-50 hover:bg-neutral-50 transition-colors ${realIdx === selectedIdx ? "bg-neutral-50" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400">{r.category}</span>
                    <span className="text-sm font-medium">{r.title}</span>
                    <span className="text-[10px] text-neutral-400">{r.experience}</span>
                    {r.remote && <span className="text-[10px] text-emerald-600">Remote OK</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Scoring criteria preview */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.15em] text-neutral-400 mb-3">Scoring Criteria</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { name: "Experience", max: 20, desc: "Years in range" },
            { name: "Location", max: 15, desc: "City/remote match" },
            { name: "Grade", max: 20, desc: "Letter/SDR/AE grade" },
            { name: "Skills", max: 15, desc: "Keyword overlap" },
            { name: "Industry", max: 15, desc: "Sector alignment" },
            { name: "Team Ranking", max: 10, desc: "Performance rank" },
          ].map(c => (
            <div key={c.name} className="border border-neutral-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">{c.name}</span>
                <span className="text-[10px] text-neutral-400 font-mono">{c.max}pts</span>
              </div>
              <p className="text-[10px] text-neutral-500">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Run button */}
      <button onClick={runMatch} disabled={!csvText}
        className={`w-full py-4 rounded-lg font-medium text-sm transition-colors ${csvText ? "bg-neutral-900 text-white hover:bg-black" : "bg-neutral-100 text-neutral-400 cursor-not-allowed"}`}>
        {csvText ? `Score ${rowCount} candidates instantly` : "Upload a CSV to get started"}
      </button>

      {/* How it's different */}
      <div className="mt-8 border-t border-neutral-200 pt-6">
        <p className="text-xs uppercase tracking-[0.15em] text-neutral-400 mb-3">How Rapid Match works</p>
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-neutral-600">
          <div className="flex gap-2">
            <span className="text-emerald-500 shrink-0 mt-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            </span>
            <div>
              <span className="font-medium text-neutral-900">Instant results</span>
              <p className="text-xs text-neutral-500 mt-0.5">Scores all candidates in milliseconds using structured CSV data. No API calls.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="text-emerald-500 shrink-0 mt-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="M12 6v6l4 2" /></svg>
            </span>
            <div>
              <span className="font-medium text-neutral-900">Column-based scoring</span>
              <p className="text-xs text-neutral-500 mt-0.5">Matches on experience, location, grades, skills, industry, and team ranking.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="text-neutral-400 shrink-0 mt-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m15 9-6 6M9 9l6 6" /></svg>
            </span>
            <div>
              <span className="font-medium text-neutral-900">No AI reasoning</span>
              <p className="text-xs text-neutral-500 mt-0.5">Doesn&apos;t read resumes or generate explanations. Use AI Match for deeper analysis.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="text-emerald-500 shrink-0 mt-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
            </span>
            <div>
              <span className="font-medium text-neutral-900">Free & unlimited</span>
              <p className="text-xs text-neutral-500 mt-0.5">No API key needed. No token costs. Run as many times as you want.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

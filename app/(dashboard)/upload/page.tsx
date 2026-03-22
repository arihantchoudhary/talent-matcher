"use client";

import { useState, useRef, useMemo, useEffect, DragEvent } from "react";
import { ROLES as DEFAULT_ROLES, CATEGORIES, CITIES, Role } from "@/lib/roles";
import { loadRoles } from "@/lib/roles-api";
import { getApiKey } from "@/lib/api-key";
import { parseCSV } from "@/lib/parse-csv";
import { saveSession, ScoredCandidate } from "@/lib/sessions";

export default function UploadPage() {
  // Roles from API
  const [ROLES, setROLES] = useState<Role[]>(DEFAULT_ROLES);
  useEffect(() => { loadRoles().then(setROLES); }, []);

  // Upload state
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Role state
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [jobTitle, setJobTitle] = useState(DEFAULT_ROLES[0].title);
  const [jobDesc, setJobDesc] = useState(DEFAULT_ROLES[0].description);
  const [showPicker, setShowPicker] = useState(false);
  const [catFilter, setCatFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [roleSearch, setRoleSearch] = useState("");

  // Scoring state
  const [step, setStep] = useState<"setup" | "scoring" | "results">("setup");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<ScoredCandidate[]>([]);
  const [logs, setLogs] = useState<{ name: string; step: string; detail: string }[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filteredRoles = useMemo(() => {
    let list = ROLES;
    if (catFilter !== "All") list = list.filter(r => r.category === catFilter);
    if (cityFilter !== "All") list = list.filter(r => r.locations.includes(cityFilter) || r.remote);
    if (roleSearch) { const q = roleSearch.toLowerCase(); list = list.filter(r => r.title.toLowerCase().includes(q)); }
    return list;
  }, [catFilter, cityFilter, roleSearch]);

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      const parsed = parseCSV(text);
      setRowCount(parsed.length);
    };
    reader.readAsText(file);
  }

  function handleDrop(e: DragEvent) { e.preventDefault(); setDragging(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]); }

  function pickRole(idx: number) {
    setSelectedIdx(idx);
    setJobTitle(ROLES[idx].title);
    setJobDesc(ROLES[idx].description);
    setShowPicker(false);
  }

  async function startScoring() {
    if (!csvText) return;
    const parsed = parseCSV(csvText);
    console.log(`[MATCH] Parsed ${parsed.length} candidates from CSV`);
    console.log(`[MATCH] Sample candidate:`, parsed[0]);
    console.log(`[MATCH] Role: ${jobTitle}`);
    console.log(`[MATCH] API key present: ${!!getApiKey() ? "user key" : "server default"}`);
    if (parsed.length === 0) { console.error("[MATCH] No candidates parsed!"); return; }

    setStep("scoring");
    setProgress({ done: 0, total: parsed.length });
    setResults([]);
    setLogs([]);

    const scoredMap = new Map<string, ScoredCandidate>();
    let doneCount = 0;

    try {
      const API = "https://aicm3pweed.us-east-1.awsapprunner.com";
      console.log(`[MATCH] Calling backend ${API}/talent-pluto/score with ${parsed.length} candidates...`);
      const resp = await fetch(`${API}/talent-pluto/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidates: parsed.map(c => ({ id: c.id, name: c.name, fullText: c.fullText, linkedinUrl: c.linkedinUrl || "" })),
          job_description: `${jobTitle}\n\n${jobDesc}`,
          api_key: getApiKey(),
        }),
      });

      console.log(`[MATCH] Response status: ${resp.status} ${resp.statusText}`);
      if (!resp.ok) {
        const errText = await resp.text();
        console.error(`[MATCH] API error:`, errText);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) { console.error("[MATCH] No response body reader"); return; }
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "log") {
              console.log(`[PIPELINE] ${data.step} | ${data.name} | ${data.detail}`);
              setLogs(prev => [{ name: data.name, step: data.step, detail: data.detail }, ...prev].slice(0, 100));
            }
            if (data.type === "enriched") {
              console.log(`[MATCH] LinkedIn DB loaded: ${data.count} profiles available for enrichment`);
            }
            if (data.type === "scored" || data.type === "error") {
              console.log(`[SCORED] ${data.name}: ${data.score}/100 ${data.type === "error" ? "ERROR: " + data.error : ""}`);

              doneCount++;
              scoredMap.set(data.id, {
                id: data.id, rank: 0, name: data.name,
                score: data.score || 0, reasoning: data.reasoning || data.error || "",
                highlights: data.highlights || [], gaps: data.gaps || [],
              });
              setProgress({ done: doneCount, total: parsed.length });
              const sorted = [...scoredMap.values()].sort((a, b) => b.score - a.score);
              sorted.forEach((s, i) => s.rank = i + 1);
              setResults([...sorted]);
            }
            if (data.type === "done") {
              // Save session to history
              const finalResults = [...scoredMap.values()].sort((a, b) => b.score - a.score);
              finalResults.forEach((s, i) => s.rank = i + 1);
              setResults(finalResults);
              saveSession({
                role: jobTitle,
                roleCategory: ROLES[selectedIdx]?.category || "Custom",
                description: jobDesc.substring(0, 300),
                fileName: fileName || "unknown.csv",
                candidateCount: parsed.length,
                topTier: finalResults.filter(r => r.score >= 70).length,
                goodFit: finalResults.filter(r => r.score >= 50 && r.score < 70).length,
                avgScore: Math.round(finalResults.reduce((s, r) => s + r.score, 0) / finalResults.length),
                results: finalResults,
              });
              setStep("results");
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error(err);
    }
    if (step !== "results") setStep("results");
  }

  const role = ROLES[selectedIdx];

  // ── SCORING VIEW ──────────────────────────────────────────────────────────
  if (step === "scoring") {
    const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Matching Algorithm</h1>
        <p className="text-sm text-neutral-500 mb-6">{progress.done} of {progress.total} candidates scored for <span className="font-medium text-neutral-900">{jobTitle}</span></p>

        {/* Progress */}
        <div className="h-1 bg-neutral-100 mb-8">
          <div className="h-full bg-neutral-900 transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>

        {/* Pipeline diagram */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "1. Parse CSV", desc: "Extract fields from each row", count: progress.total },
            { label: "2. LinkedIn Enrich", desc: "Match profiles from 493-profile DB", count: logs.filter(l => l.step === "enrich" && l.detail.includes("found")).length },
            { label: "3. GPT-4o Score", desc: "Score 0-100 against role criteria", count: progress.done },
            { label: "4. Rank", desc: "Sort by score, identify fit tiers", count: results.length },
          ].map((s, i) => (
            <div key={i} className="border border-neutral-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.1em] text-neutral-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold">{s.count}</p>
              <p className="text-xs text-neutral-500 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Live pipeline log */}
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-neutral-400 mb-3">Pipeline Log</p>
            <div className="border border-neutral-200 bg-white max-h-96 overflow-y-auto font-mono text-xs">
              {logs.length === 0 ? (
                <div className="p-4 text-neutral-400">Waiting for first candidate...</div>
              ) : logs.slice(0, 40).map((log, i) => {
                const stepColor = log.step === "parse" ? "text-blue-600" : log.step === "enrich" ? "text-emerald-600" : log.step === "score" ? "text-amber-600" : log.step === "result" ? "text-neutral-900" : "text-red-500";
                return (
                  <div key={i} className="px-3 py-1.5 border-b border-neutral-50 flex gap-2">
                    <span className={`shrink-0 w-14 ${stepColor} font-semibold`}>{log.step}</span>
                    <span className="text-neutral-400 shrink-0 w-24 truncate">{log.name}</span>
                    <span className="text-neutral-600">{log.detail}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Top matches */}
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-neutral-400 mb-3">Top Matches (live)</p>
            <div className="border border-neutral-200 bg-white">
              {results.length === 0 ? (
                <div className="p-4 text-neutral-400 text-sm">Scores will appear here...</div>
              ) : results.slice(0, 10).map((r, i) => (
                <div key={r.id} className="px-4 py-2.5 border-b border-neutral-50 flex items-center gap-3">
                  <span className="text-xs text-neutral-400 w-4">{i + 1}</span>
                  <div className="w-8 h-5 bg-neutral-100 rounded overflow-hidden">
                    <div className="h-full bg-neutral-900" style={{ width: `${r.score}%` }} />
                  </div>
                  <span className="text-xs font-semibold w-6">{r.score}</span>
                  <span className="text-sm truncate">{r.name}</span>
                </div>
              ))}
            </div>

            {/* Score distribution */}
            {results.length > 5 && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.15em] text-neutral-400 mb-3">Score Distribution</p>
                <div className="border border-neutral-200 bg-white p-4 flex items-end gap-1 h-20">
                  {[0,10,20,30,40,50,60,70,80,90].map(bucket => {
                    const count = results.filter(r => r.score >= bucket && r.score < bucket + 10).length;
                    const maxCount = Math.max(...[0,10,20,30,40,50,60,70,80,90].map(b => results.filter(r => r.score >= b && r.score < b + 10).length), 1);
                    return (
                      <div key={bucket} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="w-full bg-neutral-900" style={{ height: `${(count / maxCount) * 48}px`, minHeight: count > 0 ? 2 : 0 }} />
                        <span className="text-[8px] text-neutral-400">{bucket}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS VIEW ──────────────────────────────────────────────────────────
  if (step === "results") {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">{results.length} candidates scored</h1>
              <p className="text-sm text-zinc-500">Ranked for <span className="font-medium text-zinc-700">{jobTitle}</span></p>
            </div>
            <button onClick={() => { setStep("setup"); setResults([]); }} className="text-sm text-indigo-600 hover:text-indigo-800">New match</button>
          </div>
          <div className="space-y-2">
            {results.map(c => {
              const isOpen = expanded === c.id;
              const color = c.score >= 70 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : c.score >= 50 ? "bg-indigo-50 border-indigo-200 text-indigo-700" : c.score >= 30 ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-red-50 border-red-200 text-red-600";
              const bar = c.score >= 70 ? "bg-emerald-500" : c.score >= 50 ? "bg-indigo-500" : c.score >= 30 ? "bg-amber-500" : "bg-red-400";
              return (
                <div key={c.id} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                  <button onClick={() => setExpanded(isOpen ? null : c.id)} className="w-full text-left px-4 py-3.5 flex items-start gap-3">
                    <span className="shrink-0 w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-500">{c.rank}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm">{c.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>{c.score}</span>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-1">{c.reasoning}</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 mt-1.5 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-zinc-100 fade-in">
                      <div className="mt-3 mb-3 h-2 rounded-full bg-zinc-100 overflow-hidden"><div className={`h-full rounded-full ${bar}`} style={{ width: `${c.score}%` }} /></div>
                      <p className="text-sm text-zinc-700 mb-3">{c.reasoning}</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {c.highlights.length > 0 && <div><h4 className="text-xs font-semibold text-zinc-400 uppercase mb-1.5">Strengths</h4>{c.highlights.map((h,i) => <p key={i} className="text-sm text-zinc-700 mb-1">+ {h}</p>)}</div>}
                        {c.gaps.length > 0 && <div><h4 className="text-xs font-semibold text-zinc-400 uppercase mb-1.5">Gaps</h4>{c.gaps.map((g,i) => <p key={i} className="text-sm text-zinc-600 mb-1">- {g}</p>)}</div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── SETUP VIEW ────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Upload & Score</h1>
        <p className="text-sm text-zinc-500 mb-8">Upload candidates, pick a role, score with AI</p>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Upload */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold text-sm mb-3">1. Candidates</h2>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragging ? "border-indigo-400 bg-indigo-50" : fileName ? "border-emerald-300 bg-emerald-50" : "border-zinc-200 hover:border-zinc-300"}`}
            >
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              {fileName ? (
                <div><p className="font-semibold text-emerald-700 text-sm">{fileName}</p><p className="text-xs text-zinc-500 mt-0.5">{rowCount} candidates</p></div>
              ) : (
                <div><p className="font-medium text-sm">Drop CSV or click to browse</p><p className="text-xs text-zinc-400 mt-0.5">Any format</p></div>
              )}
            </div>
          </div>

          {/* Right: Role picker */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold text-sm mb-3">2. Select a role</h2>
            <button onClick={() => setShowPicker(!showPicker)} className="w-full text-left rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">{role.category}</span>
                  <span className="text-sm font-medium">{role.title}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-zinc-400 transition-transform ${showPicker ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
              </div>
              <div className="flex gap-1 mt-1.5">
                {role.locations.slice(0, 3).map(l => <span key={l} className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">{l}</span>)}
                {role.remote && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Remote</span>}
              </div>
            </button>

            {showPicker && (
              <div className="mt-2 rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden">
                <div className="p-2 bg-zinc-50 space-y-2 border-b border-zinc-100">
                  <input placeholder="Search roles..." value={roleSearch} onChange={e => setRoleSearch(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-300" />
                  <div className="flex gap-1 overflow-x-auto">
                    {["All", ...CATEGORIES].map(c => (
                      <button key={c} onClick={() => setCatFilter(c)} className={`shrink-0 px-2 py-1 rounded text-[10px] font-medium ${catFilter === c ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600"}`}>{c}</button>
                    ))}
                  </div>
                  <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs bg-white">
                    <option value="All">All cities</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
                  {filteredRoles.map((r, i) => {
                    const ri = ROLES.indexOf(r);
                    return (
                      <button key={ri} onClick={() => pickRole(ri)} className={`w-full text-left p-2.5 rounded-lg transition-colors ${selectedIdx === ri ? "bg-indigo-50 border border-indigo-200" : "hover:bg-zinc-50"}`}>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-100 text-zinc-600">{r.category}</span>
                          <span className="text-xs text-zinc-400">{r.experience}</span>
                          {r.remote && <span className="text-[9px] text-emerald-600">Remote</span>}
                        </div>
                        <div className="text-sm font-medium mt-0.5">{r.title}</div>
                      </button>
                    );
                  })}
                  {filteredRoles.length === 0 && <p className="text-center text-xs text-zinc-400 py-4">No roles match</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Editable JD */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 mt-6">
          <h2 className="font-semibold text-sm mb-3">3. Customize</h2>
          <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm mb-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300" />
          <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={5} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300" />
        </div>

        {/* Submit */}
        <button
          onClick={startScoring}
          disabled={!csvText || rowCount === 0}
          className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mt-6"
        >
          Score {rowCount > 0 ? `${rowCount} candidates` : "candidates"} for {jobTitle}
        </button>
      </div>
    </div>
  );
}

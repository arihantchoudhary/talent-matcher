"use client";

import { useState, useRef, useMemo, useEffect, DragEvent } from "react";
import { useUser } from "@clerk/nextjs";
import { ROLES as DEFAULT_ROLES, CATEGORIES, CITIES, Role } from "@/lib/roles";
import { loadRoles } from "@/lib/roles-api";
import { getApiKey } from "@/lib/api-key";
import { parseCSV } from "@/lib/parse-csv";
import { saveSession, ScoredCandidate } from "@/lib/sessions";
import { useScoringContext } from "@/lib/scoring-context";

export default function UploadPage() {
  const { user } = useUser();
  const scoring = useScoringContext();

  const [ROLES, setROLES] = useState<Role[]>(DEFAULT_ROLES);
  useEffect(() => { loadRoles().then(setROLES); }, []);

  // Form state
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [jobTitle, setJobTitle] = useState(DEFAULT_ROLES[0].title);
  const [jobDesc, setJobDesc] = useState(DEFAULT_ROLES[0].description);
  const [showPicker, setShowPicker] = useState(false);
  const [catFilter, setCatFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [roleSearch, setRoleSearch] = useState("");

  // Rubric presets (judges)
  type Criterion = { name: string; weight: number; description: string };
  const PRESETS: Record<string, { label: string; desc: string; criteria: Criterion[] }> = {
    balanced: { label: "Balanced", desc: "Equal weight across all criteria",
      criteria: [
        { name: "Relevant Experience", weight: 25, description: "Years and quality of experience in relevant roles" },
        { name: "Industry Fit", weight: 20, description: "Familiarity with the target industry/sector" },
        { name: "Sales Capability", weight: 20, description: "Track record of sales, pipeline, and revenue generation" },
        { name: "Stakeholder Presence", weight: 15, description: "Ability to engage with senior decision-makers" },
        { name: "Cultural Fit", weight: 10, description: "Drive, ambition, coachability, team orientation" },
        { name: "Location", weight: 10, description: "Proximity to office, willingness to work in-person" },
      ]},
    hunter: { label: "Pipeline Builder", desc: "Prioritize outbound, prospecting, cold outreach",
      criteria: [
        { name: "Outbound & Prospecting", weight: 30, description: "Cold calling, email sequences, multi-channel outreach" },
        { name: "Pipeline Generation", weight: 25, description: "Track record of building qualified pipeline from scratch" },
        { name: "Sales Tools", weight: 15, description: "Proficiency with Salesforce, Outreach, LinkedIn Sales Navigator" },
        { name: "Relevant Experience", weight: 15, description: "Years in SDR/BDR or top-of-funnel roles" },
        { name: "Drive & Resilience", weight: 10, description: "High activity volume, handles rejection well" },
        { name: "Location", weight: 5, description: "Proximity to office" },
      ]},
    closer: { label: "Deal Closer", desc: "Prioritize closing, deal sizes, enterprise selling",
      criteria: [
        { name: "Closing Experience", weight: 30, description: "Track record of closing deals, quota attainment" },
        { name: "Deal Size", weight: 20, description: "Average deal size, enterprise vs SMB experience" },
        { name: "Enterprise Selling", weight: 20, description: "Multi-stakeholder, 6+ month sales cycles" },
        { name: "Stakeholder Presence", weight: 15, description: "Engaging VP/C-suite decision makers" },
        { name: "Industry Fit", weight: 10, description: "Familiarity with the target sector" },
        { name: "Location", weight: 5, description: "Proximity to office" },
      ]},
    pedigree: { label: "Pedigree", desc: "Prioritize top companies, elite schools, brand names",
      criteria: [
        { name: "Company Quality", weight: 35, description: "Top-tier employers (Goldman, McKinsey, Google, Stripe, etc.)" },
        { name: "Education", weight: 25, description: "Elite universities, relevant degrees" },
        { name: "Career Trajectory", weight: 20, description: "Fast promotions, increasing responsibility" },
        { name: "Relevant Experience", weight: 10, description: "Years in relevant roles" },
        { name: "Cultural Fit", weight: 5, description: "Drive, ambition, team orientation" },
        { name: "Location", weight: 5, description: "Proximity to office" },
      ]},
    scrappy: { label: "Startup DNA", desc: "Prioritize founders, 0→1 builders, scrappiness",
      criteria: [
        { name: "Founding / 0→1 Experience", weight: 30, description: "Built something from scratch — company, team, or product" },
        { name: "Scrappiness", weight: 25, description: "Operated with limited resources, wore many hats" },
        { name: "Ownership Mentality", weight: 20, description: "Took initiative without being told, drove outcomes" },
        { name: "Sales Capability", weight: 15, description: "Revenue generation in any context" },
        { name: "Cultural Fit", weight: 5, description: "High drive, low ego, team player" },
        { name: "Location", weight: 5, description: "Proximity to office" },
      ]},
    custom: { label: "Custom", desc: "Define your own criteria and weights", criteria: [] },
  };

  const [selectedPreset, setSelectedPreset] = useState("balanced");
  const [criteria, setCriteria] = useState(PRESETS.balanced.criteria);

  function selectPreset(key: string) {
    setSelectedPreset(key);
    if (key !== "custom" && PRESETS[key]) {
      setCriteria([...PRESETS[key].criteria]);
    }
  }

  // Scoring state
  const [step, setStep] = useState<"setup" | "scoring" | "results">("setup");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<ScoredCandidate[]>([]);
  const [logs, setLogs] = useState<{ name: string; step: string; detail: string }[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "card" | "table">("list");

  // Sync from global context
  useEffect(() => {
    if (scoring.isScoring) {
      setStep("scoring"); setProgress(scoring.progress); setResults(scoring.results); setLogs(scoring.logs); setJobTitle(scoring.jobTitle);
    } else if (scoring.results.length > 0 && step === "setup") {
      setStep("results"); setResults(scoring.results); setJobTitle(scoring.jobTitle);
    }
  }, [scoring.isScoring, scoring.progress.done, scoring.results.length]);

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
    reader.onload = (e) => { const t = e.target?.result as string; setCsvText(t); setRowCount(parseCSV(t).length); };
    reader.readAsText(file);
  }
  function handleDrop(e: DragEvent) { e.preventDefault(); setDragging(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]); }
  function pickRole(idx: number) { setSelectedIdx(idx); setJobTitle(ROLES[idx].title); setJobDesc(ROLES[idx].description); setShowPicker(false); }

  async function startScoring() {
    if (!csvText) return;
    const parsed = parseCSV(csvText);
    const startTime = Date.now();
    if (parsed.length === 0) return;

    const jd = `${jobTitle}\n\n${jobDesc}\n\nSCORING RUBRIC (weight each criterion accordingly):\n${criteria.map(c => `- ${c.name} (${c.weight}%): ${c.description}`).join("\n")}`;
    scoring.startScoring(parsed.map(c => ({ id: c.id, name: c.name, fullText: c.fullText, linkedinUrl: c.linkedinUrl })), jobTitle, jd, getApiKey());

    setStep("scoring");
    setProgress({ done: 0, total: parsed.length });
    setResults([]); setLogs([]); setTotalTokens(0); setTotalCost(0);

    const scoredMap = new Map<string, ScoredCandidate>();
    let doneCount = 0;
    const API = "https://aicm3pweed.us-east-1.awsapprunner.com";

    try {
      const resp = await fetch(`${API}/talent-pluto/score`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: parsed.map(c => ({ id: c.id, name: c.name, fullText: c.fullText, linkedinUrl: c.linkedinUrl || "" })), job_description: jd, api_key: getApiKey() }),
      });

      const reader = resp.body?.getReader();
      if (!reader) return;
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
            if (data.type === "log") setLogs(prev => [{ name: data.name, step: data.step, detail: data.detail }, ...prev].slice(0, 100));
            if (data.type === "scored" || data.type === "error") {
              doneCount++;
              scoredMap.set(data.id, {
                id: data.id, rank: 0, name: data.name, score: data.score || 0,
                reasoning: data.reasoning || data.error || "", highlights: data.highlights || [], gaps: data.gaps || [],
                photo_url: data.photo_url || "", linkedin_url: data.linkedin_url || "",
                evidence: data.evidence || {}, criteria: data.criteria || [],
              });
              if (data.tokens) setTotalTokens(prev => prev + (data.tokens.prompt || 0) + (data.tokens.completion || 0));
              if (data.cost) setTotalCost(prev => prev + data.cost);
              setProgress({ done: doneCount, total: parsed.length });
              const sorted = [...scoredMap.values()].sort((a, b) => b.score - a.score);
              sorted.forEach((s, i) => s.rank = i + 1);
              setResults([...sorted]);
            }
            if (data.type === "done") {
              const duration = Math.round((Date.now() - startTime) / 1000);
              const finalResults = [...scoredMap.values()].sort((a, b) => b.score - a.score);
              finalResults.forEach((s, i) => s.rank = i + 1);
              setResults(finalResults);
              saveSession({ userId: user?.id || "anonymous", userName: user?.fullName || user?.primaryEmailAddress?.emailAddress || "Anonymous", device: window.innerWidth < 768 ? "mobile" : "desktop",
                role: jobTitle, roleCategory: ROLES[selectedIdx]?.category || "Custom", description: jobDesc.substring(0, 300),
                fileName: fileName || "unknown.csv", candidateCount: parsed.length,
                topTier: finalResults.filter(r => r.score >= 70).length, goodFit: finalResults.filter(r => r.score >= 50 && r.score < 70).length,
                avgScore: Math.round(finalResults.reduce((s, r) => s + r.score, 0) / finalResults.length), results: finalResults, duration, tokens: totalTokens, cost: Math.round(totalCost * 10000) / 10000,
              });
              setStep("results");
            }
          } catch {}
        }
      }
    } catch (err) { console.error(err); }
    if (scoredMap.size > 0 && step !== "results") {
      const duration = Math.round((Date.now() - startTime) / 1000);
      const finalResults = [...scoredMap.values()].sort((a, b) => b.score - a.score);
      finalResults.forEach((s, i) => s.rank = i + 1);
      setResults(finalResults);
      saveSession({ userId: user?.id || "anonymous", userName: user?.fullName || user?.primaryEmailAddress?.emailAddress || "Anonymous", device: window.innerWidth < 768 ? "mobile" : "desktop",
        role: jobTitle, roleCategory: ROLES[selectedIdx]?.category || "Custom", description: jobDesc.substring(0, 300),
        fileName: fileName || "unknown.csv", candidateCount: parsed.length,
        topTier: finalResults.filter(r => r.score >= 70).length, goodFit: finalResults.filter(r => r.score >= 50 && r.score < 70).length,
        avgScore: Math.round(finalResults.reduce((s, r) => s + r.score, 0) / finalResults.length), results: finalResults, duration, tokens: totalTokens, cost: Math.round(totalCost * 10000) / 10000,
      });
      setStep("results");
    }
  }

  // Move candidate up/down for manual re-ranking
  function moveCandidate(idx: number, direction: "up" | "down") {
    const arr = [...results];
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    arr.forEach((s, i) => s.rank = i + 1);
    setResults(arr);
  }

  const role = ROLES[selectedIdx];
  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  // ── SCORING ──
  if (step === "scoring") {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Matching Algorithm</h1>
        <p className="text-sm text-neutral-500 mb-4">{progress.done} of {progress.total} candidates scored for <span className="font-medium text-neutral-900">{jobTitle}</span></p>
        <div className="border border-neutral-200 bg-white rounded-lg p-4 mb-6 text-sm text-neutral-600">
          <p className="font-medium text-neutral-900 mb-1">What&apos;s happening:</p>
          <p>Each candidate is <strong>parsed</strong> from your CSV, <strong>enriched</strong> with LinkedIn data, <strong>scored</strong> by GPT-4o-mini against your rubric, then <strong>ranked</strong>.</p>
        </div>
        <div className="h-1 bg-neutral-100 mb-6"><div className="h-full bg-neutral-900 transition-all duration-300" style={{ width: `${pct}%` }} /></div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-neutral-400 mb-3">Pipeline Log</p>
            <div className="border border-neutral-200 bg-white max-h-96 overflow-y-auto font-mono text-xs">
              {logs.slice(0, 40).map((log, i) => (
                <div key={i} className="px-3 py-1.5 border-b border-neutral-50 flex gap-2">
                  <span className={`shrink-0 w-12 font-semibold ${log.step === "parse" ? "text-blue-600" : log.step === "enrich" ? "text-emerald-600" : log.step === "score" ? "text-amber-600" : log.step === "result" ? "text-neutral-900" : "text-red-500"}`}>{log.step}</span>
                  <span className="text-neutral-400 shrink-0 w-24 truncate">{log.name}</span>
                  <span className="text-neutral-600">{log.detail}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-neutral-400 mb-3">Top Matches</p>
            <div className="border border-neutral-200 bg-white">
              {results.slice(0, 8).map((r, i) => (
                <div key={r.id} className="px-4 py-2 border-b border-neutral-50 flex items-center gap-3">
                  {r.photo_url ? <img src={r.photo_url} alt="" className="w-7 h-7 rounded-full object-cover" /> : <div className="w-7 h-7 rounded-full bg-neutral-100" />}
                  <span className="text-xs font-bold w-6">{r.score}</span>
                  <span className="text-sm truncate">{r.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS ──
  if (step === "results") {
    const scores = results.map(r => r.score);
    const mean = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const stdDev = scores.length > 0 ? Math.round(Math.sqrt(scores.reduce((s, x) => s + (x - mean) ** 2, 0) / scores.length)) : 0;

    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{results.length} candidates ranked</h1>
            <p className="text-sm text-neutral-500">{jobTitle} &middot; Mean {mean} &middot; Std Dev {stdDev} {totalTokens > 0 && <>&middot; {(totalTokens/1000).toFixed(1)}k tokens (${totalCost.toFixed(3)})</>}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setStep("setup"); setResults([]); scoring.reset(); }} className="text-xs text-neutral-500 hover:text-neutral-900 border border-neutral-200 rounded-lg px-3 py-1.5">New match</button>
            <button onClick={() => {
              const csv = ["Rank,Name,Score,Reasoning,Highlights,Gaps,LinkedIn", ...results.map(r => `${r.rank},"${r.name}",${r.score},"${(r.reasoning||'').replace(/"/g,'""')}","${(r.highlights||[]).join('; ')}","${(r.gaps||[]).join('; ')}","${r.linkedin_url||''}"`)].join("\n");
              const blob = new Blob([csv], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${jobTitle.replace(/[^a-z0-9]/gi, '-')}-rankings.csv`; a.click();
            }} className="text-xs font-medium bg-neutral-900 text-white rounded-lg px-3 py-1.5 hover:bg-black">Download CSV</button>
          </div>
        </div>

        {/* Score distribution */}
        <div className="border border-neutral-200 bg-white p-4 mb-6">
          <div className="flex items-end gap-1 h-12">
            {[0,10,20,30,40,50,60,70,80,90].map(b => {
              const count = results.filter(r => r.score >= b && r.score < b + 10).length;
              const max = Math.max(...[0,10,20,30,40,50,60,70,80,90].map(x => results.filter(r => r.score >= x && r.score < x + 10).length), 1);
              return (
                <div key={b} className="flex-1 flex flex-col items-center gap-0.5">
                  {count > 0 && <span className="text-[8px] text-neutral-500">{count}</span>}
                  <div className="w-full bg-neutral-900 rounded-sm" style={{ height: `${(count / max) * 40}px`, minHeight: count > 0 ? 2 : 0 }} />
                  <span className="text-[8px] text-neutral-400">{b}</span>
                </div>
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
            {results.map((c, idx) => (
              <div key={c.id} className="border border-neutral-200 bg-white rounded-lg overflow-hidden">
                <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-neutral-50" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                  {/* Rerank arrows */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={e => { e.stopPropagation(); moveCandidate(idx, "up"); }} className="text-neutral-300 hover:text-neutral-900 disabled:opacity-20" disabled={idx === 0}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6" /></svg>
                    </button>
                    <button onClick={e => { e.stopPropagation(); moveCandidate(idx, "down"); }} className="text-neutral-300 hover:text-neutral-900 disabled:opacity-20" disabled={idx === results.length - 1}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                    </button>
                  </div>
                  {c.photo_url ? <img src={c.photo_url} alt={c.name} className="w-12 h-12 rounded-lg object-cover shrink-0" /> : <div className="w-12 h-12 rounded-lg bg-neutral-100 shrink-0 flex items-center justify-center text-neutral-400 font-bold">{c.name?.charAt(0)}</div>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400 font-mono">#{c.rank}</span>
                      <span className="font-semibold text-sm">{c.name}</span>
                      <span className={`px-2 py-0.5 text-xs font-bold ${c.score >= 70 ? "bg-neutral-900 text-white" : c.score >= 50 ? "bg-neutral-100" : "text-neutral-400"}`}>{c.score}</span>
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{c.reasoning}</p>
                  </div>
                </div>
                {expanded === c.id && (
                  <div className="px-4 pb-4 border-t border-neutral-100 fade-in">
                    <div className="mt-3 h-1 bg-neutral-100 mb-3"><div className="h-full bg-neutral-900" style={{ width: `${c.score}%` }} /></div>
                    {c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-900 mb-2">LinkedIn</a>}
                    <p className="text-sm text-neutral-700 mb-3">{c.reasoning}</p>
                    {c.criteria && c.criteria.length > 0 && (
                      <div className="flex gap-6 mb-3">
                        {/* Pie chart */}
                        <div className="shrink-0">
                          <svg width="100" height="100" viewBox="0 0 100 100">
                            {(() => {
                              const colors = ["#171717", "#404040", "#737373", "#a3a3a3", "#d4d4d4", "#e5e5e5"];
                              let cumulative = 0;
                              const total = c.criteria.reduce((s, cr) => s + (cr.max || 0), 0) || 100;
                              return c.criteria.map((cr, i) => {
                                const pct = (cr.score || 0) / total;
                                const startAngle = cumulative * 2 * Math.PI;
                                cumulative += (cr.max || 0) / total;
                                const endAngle = cumulative * 2 * Math.PI;
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
                        {/* Legend */}
                        <div className="flex-1 space-y-1.5">
                          {c.criteria.map((cr, i) => {
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
                      {(c.highlights||[]).length > 0 && <div>{c.highlights.map((h,i) => <span key={i} className="inline-block text-[10px] bg-neutral-50 border border-neutral-100 rounded px-1.5 py-0.5 mr-1 mb-1">+ {h}</span>)}</div>}
                      {(c.gaps||[]).length > 0 && <div>{c.gaps.map((g,i) => <span key={i} className="inline-block text-[10px] text-neutral-400 bg-neutral-50 border border-neutral-100 rounded px-1.5 py-0.5 mr-1 mb-1">- {g}</span>)}</div>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CARD VIEW */}
        {viewMode === "card" && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {results.map(c => (
              <div key={c.id} className="border border-neutral-200 bg-white rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-neutral-400 font-mono">#{c.rank}</span>
                  <span className={`px-2 py-0.5 text-xs font-bold ${c.score >= 70 ? "bg-neutral-900 text-white" : c.score >= 50 ? "bg-neutral-100" : "text-neutral-400"}`}>{c.score}</span>
                </div>
                {c.photo_url ? <img src={c.photo_url} alt={c.name} className="w-16 h-16 rounded-xl object-cover mx-auto mb-3" /> : <div className="w-16 h-16 rounded-xl bg-neutral-100 mx-auto mb-3 flex items-center justify-center text-xl font-bold text-neutral-300">{c.name?.charAt(0)}</div>}
                <h3 className="font-semibold text-sm text-center mb-1">{c.name}</h3>
                <p className="text-[10px] text-neutral-500 text-center line-clamp-2">{c.reasoning}</p>
                {c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="block text-center text-[10px] text-neutral-400 hover:text-neutral-700 mt-2">LinkedIn</a>}
              </div>
            ))}
          </div>
        )}

        {/* TABLE VIEW */}
        {viewMode === "table" && (
          <div className="border border-neutral-200 bg-white rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500">#</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500">Candidate</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500">Score</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500">Reasoning</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500">Strengths</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500">Gaps</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500">LinkedIn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {results.map(c => (
                  <tr key={c.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-2 text-xs text-neutral-400">{c.rank}</td>
                    <td className="px-4 py-2 flex items-center gap-2">
                      {c.photo_url ? <img src={c.photo_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" /> : null}
                      <span className="font-medium text-sm">{c.name}</span>
                    </td>
                    <td className="px-4 py-2"><span className={`px-2 py-0.5 text-xs font-bold ${c.score >= 70 ? "bg-neutral-900 text-white" : c.score >= 50 ? "bg-neutral-100" : "text-neutral-400"}`}>{c.score}</span></td>
                    <td className="px-4 py-2 text-xs text-neutral-500 max-w-xs truncate">{c.reasoning}</td>
                    <td className="px-4 py-2 text-xs text-neutral-500">{(c.highlights||[]).slice(0,2).join(", ")}</td>
                    <td className="px-4 py-2 text-xs text-neutral-400">{(c.gaps||[]).slice(0,2).join(", ")}</td>
                    <td className="px-4 py-2">{c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs text-neutral-400 hover:text-neutral-700">Open</a>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── SETUP ──
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-serif italic">New Match</h1>
        <p className="text-sm text-neutral-500 mt-1">Upload candidates, select a role, define your scoring criteria, and run AI matching.</p>
      </div>

      {/* Two column layout */}
      <div className="grid lg:grid-cols-5 gap-6 mb-6">
        {/* Left column: CSV + Role */}
        <div className="lg:col-span-2 space-y-4">
          {/* CSV upload */}
          <div className="border border-neutral-200 bg-white rounded-lg p-5">
            <p className="text-xs uppercase tracking-[0.15em] text-neutral-400 mb-3">Candidates</p>
            <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${dragging ? "border-neutral-900 bg-neutral-50" : fileName ? "border-emerald-300 bg-emerald-50/50" : "border-neutral-200 hover:border-neutral-300"}`}>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              {fileName ? (
                <div><p className="font-semibold text-sm">{fileName}</p><p className="text-xs text-neutral-500">{rowCount} candidates</p></div>
              ) : (
                <div><p className="text-sm font-medium">Drop CSV or click</p><p className="text-[10px] text-neutral-400 mt-1">Any format</p></div>
              )}
            </div>
          </div>

          {/* Role */}
          <div className="border border-neutral-200 bg-white rounded-lg p-5">
            <p className="text-xs uppercase tracking-[0.15em] text-neutral-400 mb-3">Role</p>
            <button onClick={() => setShowPicker(!showPicker)} className="w-full text-left rounded border border-neutral-200 p-3 hover:bg-neutral-50 text-sm">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-100">{role.category}</span>
                <span className="font-medium">{role.title}</span>
              </div>
            </button>
            {showPicker && (
              <div className="mt-2 border border-neutral-200 rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto">
                <div className="p-2 border-b border-neutral-100 flex gap-1 overflow-x-auto">
                  {["All", ...CATEGORIES].map(c => (
                    <button key={c} onClick={() => setCatFilter(c)} className={`shrink-0 px-2 py-1 rounded text-[10px] ${catFilter === c ? "bg-neutral-900 text-white" : "text-neutral-500"}`}>{c}</button>
                  ))}
                </div>
                {filteredRoles.map((r, i) => {
                  const ri = ROLES.indexOf(r);
                  return <button key={ri} onClick={() => pickRole(ri)} className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50">{r.title}</button>;
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: JD + Rubric */}
        <div className="lg:col-span-3 space-y-4">
          {/* Job description */}
          <div className="border border-neutral-200 bg-white rounded-lg p-5">
            <p className="text-xs uppercase tracking-[0.15em] text-neutral-400 mb-3">Job Description</p>
            <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="w-full border border-neutral-200 rounded px-3 py-2 text-sm font-medium mb-2 focus:outline-none focus:border-neutral-400" />
            <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={4} className="w-full border border-neutral-200 rounded px-3 py-2 text-xs resize-none focus:outline-none focus:border-neutral-400" />
          </div>

          {/* Rubric */}
          <div className="border border-neutral-200 bg-white rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-[0.15em] text-neutral-400">Scoring Perspective</p>
              <span className={`text-xs ${criteria.reduce((s, c) => s + c.weight, 0) === 100 ? "text-neutral-400" : "text-red-500 font-medium"}`}>
                {criteria.reduce((s, c) => s + c.weight, 0)}%
              </span>
            </div>

            {/* Preset buttons — named judges */}
            <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button key={key} onClick={() => selectPreset(key)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedPreset === key ? "bg-neutral-900 text-white" : "border border-neutral-200 text-neutral-500 hover:border-neutral-400"}`}>
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Description of selected preset */}
            <p className="text-[11px] text-neutral-500 mb-4">{PRESETS[selectedPreset]?.desc}</p>

            {/* Animated bars */}
            <div className="space-y-3 mb-4">
              {criteria.map((c, i) => (
                <div key={c.name || i}>
                  <div className="flex items-center justify-between mb-1">
                    <input value={c.name} onChange={e => { setSelectedPreset("custom"); const n = [...criteria]; n[i] = { ...n[i], name: e.target.value }; setCriteria(n); }}
                      className="text-xs font-medium bg-transparent border-none p-0 focus:outline-none focus:ring-0 w-auto" placeholder="Criterion" />
                    <div className="flex items-center gap-1">
                      <input type="number" min={0} max={100} value={c.weight} onChange={e => { setSelectedPreset("custom"); const n = [...criteria]; n[i] = { ...n[i], weight: parseInt(e.target.value) || 0 }; setCriteria(n); }}
                        className="w-8 text-xs text-right font-bold bg-transparent border-none p-0 focus:outline-none" />
                      <span className="text-[10px] text-neutral-400">%</span>
                      <button onClick={() => { setSelectedPreset("custom"); setCriteria(criteria.filter((_, j) => j !== i)); }} className="text-neutral-200 hover:text-red-500 ml-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${c.weight}%`, transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{c.description}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setCriteria([...criteria, { name: "", weight: 0, description: "" }])} className="text-[10px] text-neutral-400 hover:text-neutral-700">+ Add criterion</button>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button onClick={startScoring} disabled={!csvText || rowCount === 0}
        className="w-full py-4 bg-neutral-900 text-white font-semibold text-sm rounded-lg hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        Score {rowCount > 0 ? `${rowCount} candidates` : "candidates"} for {jobTitle}
      </button>
    </div>
  );
}

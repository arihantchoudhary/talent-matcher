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

  // Rubric
  const [criteria, setCriteria] = useState([
    { name: "Relevant Experience", weight: 25, description: "Years and quality of experience in relevant roles" },
    { name: "Industry Fit", weight: 20, description: "Familiarity with the target industry/sector" },
    { name: "Sales Capability", weight: 20, description: "Track record of sales, pipeline, and revenue generation" },
    { name: "Stakeholder Presence", weight: 15, description: "Ability to engage with senior decision-makers (VP/C-suite)" },
    { name: "Cultural Fit", weight: 10, description: "Drive, ambition, coachability, team orientation" },
    { name: "Location", weight: 10, description: "Proximity to office, willingness to work in-person" },
  ]);

  // Scoring state — syncs with global context so scoring survives tab switches
  const [step, setStep] = useState<"setup" | "scoring" | "results">("setup");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<ScoredCandidate[]>([]);
  const [logs, setLogs] = useState<{ name: string; step: string; detail: string }[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  // Sync from global context — if scoring was running and we navigated back
  useEffect(() => {
    if (scoring.isScoring) {
      setStep("scoring");
      setProgress(scoring.progress);
      setResults(scoring.results);
      setLogs(scoring.logs);
      setJobTitle(scoring.jobTitle);
    } else if (scoring.results.length > 0 && step === "setup") {
      setStep("results");
      setResults(scoring.results);
      setJobTitle(scoring.jobTitle);
    }
  }, [scoring.isScoring, scoring.progress.done, scoring.results.length]);

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
    const startTime = Date.now();
    if (parsed.length === 0) return;

    // Start in global context too — survives tab switches
    const jd = `${jobTitle}\n\n${jobDesc}\n\nSCORING RUBRIC (weight each criterion accordingly):\n${criteria.map(c => `- ${c.name} (${c.weight}%): ${c.description}`).join("\n")}`;
    scoring.startScoring(
      parsed.map(c => ({ id: c.id, name: c.name, fullText: c.fullText, linkedinUrl: c.linkedinUrl })),
      jobTitle, jd, getApiKey(),
    );

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
          job_description: `${jobTitle}\n\n${jobDesc}\n\nSCORING RUBRIC (weight each criterion accordingly):\n${criteria.map(c => `- ${c.name} (${c.weight}%): ${c.description}`).join("\n")}`,
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
              console.log(`[MATCH] LinkedIn enrichment ready`);
            }
            if (data.type === "scored" || data.type === "error") {
              console.log(`[SCORED] ${data.name}: ${data.score}/100 ${data.type === "error" ? "ERROR: " + data.error : ""}`);

              doneCount++;
              scoredMap.set(data.id, {
                id: data.id, rank: 0, name: data.name,
                score: data.score || 0, reasoning: data.reasoning || data.error || "",
                highlights: data.highlights || [], gaps: data.gaps || [],
                photo_url: data.photo_url || "",
                linkedin_url: data.linkedin_url || "",
                evidence: data.evidence || {},
                criteria: data.criteria || [],
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
              console.log(`[MATCH] Done in ${duration}s — ${scoredMap.size} scored`);
              const finalResults = [...scoredMap.values()].sort((a, b) => b.score - a.score);
              finalResults.forEach((s, i) => s.rank = i + 1);
              setResults(finalResults);
              saveSession({ userId: user?.id || "anonymous", userName: user?.fullName || user?.primaryEmailAddress?.emailAddress || "Anonymous", device: window.innerWidth < 768 ? "mobile" : "desktop",
                role: jobTitle,
                roleCategory: ROLES[selectedIdx]?.category || "Custom",
                description: jobDesc.substring(0, 300),
                fileName: fileName || "unknown.csv",
                candidateCount: parsed.length,
                topTier: finalResults.filter(r => r.score >= 70).length,
                goodFit: finalResults.filter(r => r.score >= 50 && r.score < 70).length,
                avgScore: Math.round(finalResults.reduce((s, r) => s + r.score, 0) / finalResults.length),
                results: finalResults,
                duration,
              });
              setStep("results");
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error("[MATCH] Stream error:", err);
    }
    // If stream ended without explicit "done", still show results
    if (scoredMap.size > 0) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      console.log(`[MATCH] Stream ended — ${scoredMap.size}/${parsed.length} scored in ${duration}s`);
      const finalResults = [...scoredMap.values()].sort((a, b) => b.score - a.score);
      finalResults.forEach((s, i) => s.rank = i + 1);
      setResults(finalResults);
      if (step !== "results") {
        saveSession({ userId: user?.id || "anonymous", userName: user?.fullName || user?.primaryEmailAddress?.emailAddress || "Anonymous", device: window.innerWidth < 768 ? "mobile" : "desktop",
          role: jobTitle,
          roleCategory: ROLES[selectedIdx]?.category || "Custom",
          description: jobDesc.substring(0, 300),
          fileName: fileName || "unknown.csv",
          candidateCount: parsed.length,
          topTier: finalResults.filter(r => r.score >= 70).length,
          goodFit: finalResults.filter(r => r.score >= 50 && r.score < 70).length,
          avgScore: Math.round(finalResults.reduce((s, r) => s + r.score, 0) / finalResults.length),
          results: finalResults,
          duration,
        });
        setStep("results");
      }
    }
  }

  const role = ROLES[selectedIdx];

  // ── SCORING VIEW ──────────────────────────────────────────────────────────
  if (step === "scoring") {
    const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Matching Algorithm</h1>
        <p className="text-sm text-neutral-500 mb-4">{progress.done} of {progress.total} candidates scored for <span className="font-medium text-neutral-900">{jobTitle}</span></p>

        {/* What's happening */}
        <div className="border border-neutral-200 bg-white rounded-lg p-4 mb-6 text-sm text-neutral-600">
          <p className="font-medium text-neutral-900 mb-1">What&apos;s happening right now:</p>
          <p>We&apos;re scoring each candidate in 4 steps. First, we <strong>parse</strong> their data from your CSV. Then we <strong>enrich</strong> it by matching their LinkedIn URL to our profile database — adding their full work history, education, and skills. Next, <strong>GPT-4o-mini</strong> evaluates them against your role description and rubric, scoring each criterion individually with evidence. Finally, we <strong>rank</strong> everyone by total score.</p>
        </div>

        {/* Progress */}
        <div className="h-1 bg-neutral-100 mb-6">
          <div className="h-full bg-neutral-900 transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>

        {/* Pipeline diagram */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "1. Parse CSV", desc: "Extract fields from each row", count: progress.total },
            { label: "2. LinkedIn Enrich", desc: "Pull profiles, experience, education", count: logs.filter(l => l.step === "enrich").length },
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{results.length} candidates scored</h1>
              <p className="text-sm text-zinc-500">Ranked for <span className="font-medium text-zinc-700">{jobTitle}</span></p>
            </div>
            <button onClick={() => { setStep("setup"); setResults([]); scoring.reset(); }} className="text-sm text-neutral-500 hover:text-neutral-900">New match</button>
          </div>

          {/* Stats */}
          {(() => {
            const scores = results.map(r => r.score);
            const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
            const stdDev = Math.sqrt(scores.reduce((s, x) => s + (x - mean) ** 2, 0) / scores.length);
            const top = scores.filter(s => s >= 70).length;
            const good = scores.filter(s => s >= 50 && s < 70).length;
            const mod = scores.filter(s => s >= 30 && s < 50).length;
            const low = scores.filter(s => s < 30).length;
            return (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
                <div className="border border-neutral-200 bg-white p-3 text-center">
                  <div className="text-lg font-bold">{Math.round(mean)}</div>
                  <div className="text-[10px] text-neutral-400 uppercase">Mean</div>
                </div>
                <div className="border border-neutral-200 bg-white p-3 text-center">
                  <div className="text-lg font-bold">{Math.round(stdDev)}</div>
                  <div className="text-[10px] text-neutral-400 uppercase">Std Dev</div>
                </div>
                <div className="border border-neutral-900 bg-neutral-950 text-white p-3 text-center">
                  <div className="text-lg font-bold">{top}</div>
                  <div className="text-[10px] text-neutral-400 uppercase">Top Tier</div>
                </div>
                <div className="border border-neutral-200 bg-white p-3 text-center">
                  <div className="text-lg font-bold">{good}</div>
                  <div className="text-[10px] text-neutral-400 uppercase">Good Fit</div>
                </div>
                <div className="border border-neutral-200 bg-white p-3 text-center">
                  <div className="text-lg font-bold">{mod}</div>
                  <div className="text-[10px] text-neutral-400 uppercase">Moderate</div>
                </div>
                <div className="border border-neutral-200 bg-white p-3 text-center">
                  <div className="text-lg font-bold">{low}</div>
                  <div className="text-[10px] text-neutral-400 uppercase">Low Fit</div>
                </div>
                {totalTokens > 0 && (
                  <div className="border border-neutral-200 bg-white p-3 text-center col-span-2 md:col-span-1">
                    <div className="text-lg font-bold">{(totalTokens / 1000).toFixed(1)}k</div>
                    <div className="text-[10px] text-neutral-400 uppercase">Tokens (${totalCost.toFixed(4)})</div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Download results */}
          <div className="flex gap-2 mb-6">
            <button onClick={() => {
              const csv = ["Rank,Name,Score,Reasoning,Highlights,Gaps,LinkedIn URL",
                ...results.map(r => `${r.rank},"${r.name}",${r.score},"${(r.reasoning||'').replace(/"/g,'""')}","${(r.highlights||[]).join('; ')}","${(r.gaps||[]).join('; ')}","${r.linkedin_url||''}"`)
              ].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${jobTitle.replace(/[^a-z0-9]/gi, '-')}-rankings.csv`; a.click();
            }} className="px-4 py-2 text-xs font-medium bg-neutral-900 text-white rounded-lg hover:bg-black transition-colors">
              Download CSV
            </button>
            <button onClick={() => {
              const json = JSON.stringify(results.map(r => ({ rank: r.rank, name: r.name, score: r.score, reasoning: r.reasoning, highlights: r.highlights, gaps: r.gaps, linkedin_url: r.linkedin_url, criteria: r.criteria })), null, 2);
              const blob = new Blob([json], { type: "application/json" });
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${jobTitle.replace(/[^a-z0-9]/gi, '-')}-rankings.json`; a.click();
            }} className="px-4 py-2 text-xs font-medium border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
              Download JSON
            </button>
          </div>

          {/* Score distribution */}
          <div className="border border-neutral-200 bg-white p-4 mb-6">
            <p className="text-xs uppercase tracking-[0.1em] text-neutral-400 mb-3">Score Distribution</p>
            <div className="flex items-end gap-1 h-16">
              {[0,10,20,30,40,50,60,70,80,90].map(b => {
                const count = results.filter(r => r.score >= b && r.score < b + 10).length;
                const max = Math.max(...[0,10,20,30,40,50,60,70,80,90].map(x => results.filter(r => r.score >= x && r.score < x + 10).length), 1);
                return (
                  <div key={b} className="flex-1 flex flex-col items-center gap-0.5">
                    {count > 0 && <span className="text-[9px] text-neutral-500 font-medium">{count}</span>}
                    <div className="w-full bg-neutral-900 rounded-sm" style={{ height: `${(count / max) * 48}px`, minHeight: count > 0 ? 2 : 0 }} />
                    <span className="text-[9px] text-neutral-400">{b}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            {results.map(c => {
              const isOpen = expanded === c.id;
              const color = c.score >= 70 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : c.score >= 50 ? "bg-indigo-50 border-indigo-200 text-indigo-700" : c.score >= 30 ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-red-50 border-red-200 text-red-600";
              const bar = c.score >= 70 ? "bg-emerald-500" : c.score >= 50 ? "bg-indigo-500" : c.score >= 30 ? "bg-amber-500" : "bg-red-400";
              return (
                <div key={c.id} className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
                  <button onClick={() => setExpanded(isOpen ? null : c.id)} className="w-full text-left p-4 flex items-start gap-4">
                    {/* Photo — big */}
                    <div className="shrink-0">
                      {c.photo_url ? (
                        <img src={c.photo_url} alt={c.name} className="w-14 h-14 rounded-xl object-cover border border-neutral-200" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-neutral-100 flex items-center justify-center text-lg font-bold text-neutral-400">
                          {c.name?.charAt(0) || "#"}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-neutral-400 font-mono">#{c.rank}</span>
                        <span className="font-semibold">{c.name}</span>
                        <span className={`px-2 py-0.5 text-xs font-bold ${c.score >= 70 ? "bg-neutral-900 text-white" : c.score >= 50 ? "bg-neutral-100 text-neutral-700" : "text-neutral-400 bg-neutral-50"}`}>{c.score}</span>
                      </div>
                      <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">{c.reasoning}</p>
                      {c.linkedin_url && (
                        <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[10px] text-neutral-400 hover:text-neutral-700 mt-1.5">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                          LinkedIn
                        </a>
                      )}
                    </div>

                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 mt-2 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-zinc-100 fade-in">
                      <div className="mt-3 mb-3 h-2 rounded-full bg-zinc-100 overflow-hidden"><div className={`h-full rounded-full ${bar}`} style={{ width: `${c.score}%` }} /></div>
                      {c.linkedin_url && (
                        <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 mb-3 border border-neutral-200 rounded px-2 py-1 hover:bg-neutral-50 transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                          View LinkedIn
                        </a>
                      )}
                      <p className="text-sm text-zinc-700 mb-3">{c.reasoning}</p>

                      {/* Per-criterion breakdown with evidence */}
                      {c.criteria && c.criteria.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Score Breakdown</h4>
                          <div className="space-y-2">
                            {c.criteria.map((cr, i) => (
                              <div key={i} className="border border-neutral-100 rounded-lg p-2.5">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold">{cr.name}</span>
                                  <span className="text-xs font-bold tabular-nums">{cr.score}/{cr.max}</span>
                                </div>
                                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden mb-1.5">
                                  <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${cr.max > 0 ? (cr.score / cr.max) * 100 : 0}%` }} />
                                </div>
                                {cr.evidence && <p className="text-[11px] text-neutral-500 leading-relaxed">{cr.evidence}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Raw data evidence */}
                      {c.evidence && Object.keys(c.evidence).length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Raw Data</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(c.evidence).map(([key, val]) => (
                              <span key={key} className="text-[10px] text-neutral-600 bg-neutral-50 border border-neutral-100 rounded px-1.5 py-0.5" title={val}>
                                {key.replace(/_/g, " ")}: {val.length > 30 ? val.slice(0, 30) + "..." : val}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid sm:grid-cols-2 gap-3">
                        {c.highlights.length > 0 && <div><h4 className="text-xs font-semibold text-neutral-400 uppercase mb-1.5">Strengths</h4>{c.highlights.map((h,i) => <p key={i} className="text-xs text-neutral-700 mb-1">+ {h}</p>)}</div>}
                        {c.gaps.length > 0 && <div><h4 className="text-xs font-semibold text-neutral-400 uppercase mb-1.5">Gaps</h4>{c.gaps.map((g,i) => <p key={i} className="text-xs text-neutral-600 mb-1">- {g}</p>)}</div>}
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

        {/* Rubric */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">4. Scoring Rubric</h2>
            <span className="text-xs text-zinc-400">
              Total: {criteria.reduce((s, c) => s + c.weight, 0)}%
              {criteria.reduce((s, c) => s + c.weight, 0) !== 100 && <span className="text-red-500 ml-1">(should be 100%)</span>}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mb-4">Each candidate gets scored on these criteria. The weight is how many points (out of 100) that criterion is worth. E.g., 25% = up to 25 points.</p>
          <div className="space-y-3">
            {criteria.map((c, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-1">
                  <input
                    value={c.name}
                    onChange={e => { const next = [...criteria]; next[i] = { ...next[i], name: e.target.value }; setCriteria(next); }}
                    className="w-full border border-zinc-200 rounded px-2 py-1.5 text-sm font-medium focus:outline-none focus:border-indigo-300"
                    placeholder="Criterion name"
                  />
                  <input
                    value={c.description}
                    onChange={e => { const next = [...criteria]; next[i] = { ...next[i], description: e.target.value }; setCriteria(next); }}
                    className="w-full border border-zinc-100 rounded px-2 py-1 text-xs text-zinc-500 mt-1 focus:outline-none focus:border-indigo-300"
                    placeholder="What this measures..."
                  />
                </div>
                <div className="shrink-0 w-20 flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={c.weight}
                    onChange={e => { const next = [...criteria]; next[i] = { ...next[i], weight: parseInt(e.target.value) || 0 }; setCriteria(next); }}
                    className="w-14 border border-zinc-200 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:border-indigo-300"
                  />
                  <span className="text-xs text-zinc-400">%</span>
                </div>
                <button
                  onClick={() => setCriteria(criteria.filter((_, j) => j !== i))}
                  className="shrink-0 text-zinc-300 hover:text-red-500 transition-colors mt-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setCriteria([...criteria, { name: "", weight: 0, description: "" }])}
            className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            + Add criterion
          </button>
        </div>

        {/* Submit */}
        <button
          onClick={startScoring}
          disabled={!csvText || rowCount === 0}
          className="w-full py-3.5 rounded-xl bg-neutral-900 text-white font-semibold text-sm hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors mt-6"
        >
          Score {rowCount > 0 ? `${rowCount} candidates` : "candidates"} for {jobTitle}
        </button>
      </div>
    </div>
  );
}

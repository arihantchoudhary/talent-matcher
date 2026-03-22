"use client";

import { useState, useRef, useEffect, DragEvent } from "react";
import { ROLES as DEFAULT_ROLES, Role } from "@/lib/roles";
import { loadRoles } from "@/lib/roles-api";
import { parseCSV } from "@/lib/parse-csv";
import { getApiKey } from "@/lib/api-key";

interface MatchedCandidate { idx: number; name: string; score: number; reasoning: string; highlights: string[]; gaps: string[]; }
interface RoleMatch { roleIdx: number; roleTitle: string; candidates: MatchedCandidate[]; }
interface UnmatchedCandidate { idx: number; name: string; bestRoleTitle: string; bestScore: number; reasoning: string; }

export default function StableMatchPage() {
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [selectedRoles, setSelectedRoles] = useState<Set<number>>(new Set());
  const [capacities, setCapacities] = useState<Record<number, number>>({});

  // CSV
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Scoring
  const [step, setStep] = useState<"setup" | "scoring" | "results">("setup");
  const [progress, setProgress] = useState({ scored: 0, total: 0, currentRole: "" });
  const [matches, setMatches] = useState<RoleMatch[]>([]);
  const [unmatched, setUnmatched] = useState<UnmatchedCandidate[]>([]);
  const [expandedRole, setExpandedRole] = useState<number | null>(null);

  useEffect(() => { loadRoles().then(setRoles); }, []);

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => { const t = e.target?.result as string; setCsvText(t); setRowCount(parseCSV(t).length); };
    reader.readAsText(file);
  }
  function handleDrop(e: DragEvent) { e.preventDefault(); setDragging(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]); }

  function toggleRole(idx: number) {
    setSelectedRoles(prev => {
      const n = new Set(prev);
      if (n.has(idx)) n.delete(idx); else n.add(idx);
      return n;
    });
    if (!capacities[idx]) setCapacities(prev => ({ ...prev, [idx]: 3 }));
  }

  async function startMatching() {
    if (!csvText || selectedRoles.size === 0) return;
    const parsed = parseCSV(csvText);
    if (parsed.length === 0) return;

    const rolesList = [...selectedRoles].map(idx => ({
      title: roles[idx].title,
      description: roles[idx].description,
      capacity: capacities[idx] || 3,
    }));

    setStep("scoring");
    setProgress({ scored: 0, total: parsed.length * rolesList.length, currentRole: rolesList[0].title });

    try {
      const resp = await fetch("/api/stable-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidates: parsed.map(c => ({ id: c.id, name: c.name, fullText: c.fullText })),
          roles: rolesList,
          apiKey: getApiKey(),
        }),
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
            if (data.type === "scored") {
              setProgress({ scored: data.scored, total: data.total, currentRole: data.roleTitle });
            } else if (data.type === "scoring_role") {
              setProgress(prev => ({ ...prev, currentRole: data.roleTitle }));
            } else if (data.type === "done") {
              setMatches(data.matches || []);
              setUnmatched(data.unmatched || []);
              setStep("results");
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error(err);
      setStep("results");
    }
  }

  // ── SCORING ──
  if (step === "scoring") {
    const pct = progress.total > 0 ? Math.round((progress.scored / progress.total) * 100) : 0;
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-5 animate-pulse">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
        </div>
        <h2 className="text-xl font-bold mb-1">Running stable matching...</h2>
        <p className="text-sm text-zinc-500 mb-2">Scoring {rowCount} candidates against {selectedRoles.size} roles</p>
        <p className="text-xs text-purple-600 font-medium mb-6">Currently: {progress.currentRole}</p>
        <div className="h-2.5 rounded-full bg-zinc-100 overflow-hidden max-w-md mx-auto mb-2">
          <div className="h-full rounded-full bg-purple-600 transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-zinc-400">{progress.scored} / {progress.total} scores ({pct}%)</p>
      </div>
    );
  }

  // ── RESULTS ──
  if (step === "results") {
    const totalMatched = matches.reduce((s, m) => s + m.candidates.length, 0);
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Stable Matching Results</h1>
            <p className="text-sm text-zinc-500">{totalMatched} matched, {unmatched.length} unmatched across {matches.length} roles</p>
          </div>
          <button onClick={() => { setStep("setup"); setMatches([]); setUnmatched([]); }} className="text-sm text-indigo-600 hover:text-indigo-800">New match</button>
        </div>

        {/* Role matches */}
        <div className="space-y-4 mb-8">
          {matches.map((m) => (
            <div key={m.roleIdx} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <button onClick={() => setExpandedRole(expandedRole === m.roleIdx ? null : m.roleIdx)}
                className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700">Role {m.roleIdx + 1}</span>
                    <span className="font-semibold">{m.roleTitle}</span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-0.5">{m.candidates.length} candidate{m.candidates.length !== 1 ? "s" : ""} matched</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-zinc-400 transition-transform ${expandedRole === m.roleIdx ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {expandedRole === m.roleIdx && (
                <div className="border-t border-zinc-100 px-5 py-3 space-y-3 fade-in">
                  {m.candidates.length === 0 ? (
                    <p className="text-sm text-zinc-400 py-4 text-center">No candidates matched to this role</p>
                  ) : m.candidates.map((c) => {
                    const color = c.score >= 70 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : c.score >= 50 ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-amber-50 border-amber-200 text-amber-700";
                    return (
                      <div key={c.idx} className="flex items-start gap-3 py-2">
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>{c.score}</span>
                        <div>
                          <div className="font-medium text-sm">{c.name}</div>
                          <p className="text-xs text-zinc-500 mt-0.5">{c.reasoning}</p>
                          {c.highlights.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {c.highlights.map((h, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">{h}</span>)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Unmatched */}
        {unmatched.length > 0 && (
          <div>
            <h2 className="font-semibold text-sm text-zinc-500 mb-3">Unmatched candidates ({unmatched.length})</h2>
            <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
              {unmatched.slice(0, 20).map((c) => (
                <div key={c.idx} className="px-4 py-3 flex items-center gap-3">
                  <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{c.bestScore}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="text-xs text-zinc-400 ml-2">best: {c.bestRoleTitle}</span>
                  </div>
                  <span className="text-xs text-zinc-400 truncate max-w-48">{c.reasoning}</span>
                </div>
              ))}
              {unmatched.length > 20 && <div className="px-4 py-2 text-xs text-zinc-400 text-center">+{unmatched.length - 20} more</div>}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── SETUP ──
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Stable Matching</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Select multiple roles, upload candidates, get optimal assignments via Gale-Shapley algorithm</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* CSV */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold text-sm mb-3">1. Upload candidates</h2>
          <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragging ? "border-purple-400 bg-purple-50" : fileName ? "border-emerald-300 bg-emerald-50" : "border-zinc-200 hover:border-zinc-300"}`}>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {fileName ? (
              <div><p className="font-semibold text-emerald-700 text-sm">{fileName}</p><p className="text-xs text-zinc-500">{rowCount} candidates</p></div>
            ) : (
              <div><p className="font-medium text-sm">Drop CSV or click</p><p className="text-xs text-zinc-400 mt-0.5">Any format</p></div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold text-sm mb-3">Match summary</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-zinc-50 p-3 text-center">
              <div className="text-2xl font-bold">{rowCount}</div>
              <div className="text-xs text-zinc-500">Candidates</div>
            </div>
            <div className="rounded-lg bg-purple-50 p-3 text-center">
              <div className="text-2xl font-bold text-purple-700">{selectedRoles.size}</div>
              <div className="text-xs text-zinc-500">Roles</div>
            </div>
            <div className="rounded-lg bg-zinc-50 p-3 text-center">
              <div className="text-2xl font-bold">{[...selectedRoles].reduce((s, idx) => s + (capacities[idx] || 3), 0)}</div>
              <div className="text-xs text-zinc-500">Total seats</div>
            </div>
          </div>
        </div>
      </div>

      {/* Role selection */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 mt-6">
        <h2 className="font-semibold text-sm mb-3">2. Select roles to match against</h2>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {roles.map((role, idx) => {
            const selected = selectedRoles.has(idx);
            return (
              <div key={idx} className={`rounded-lg border p-3 transition-all ${selected ? "border-purple-300 bg-purple-50" : "border-zinc-200 hover:bg-zinc-50"}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleRole(idx)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selected ? "bg-purple-600 border-purple-600" : "border-zinc-300"}`}>
                    {selected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">{role.category}</span>
                      <span className="text-sm font-medium">{role.title}</span>
                      <span className="text-xs text-zinc-400">{role.experience}</span>
                    </div>
                  </div>
                  {selected && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-zinc-500">Seats:</span>
                      <input type="number" min={1} max={50} value={capacities[idx] || 3}
                        onChange={e => setCapacities(prev => ({ ...prev, [idx]: parseInt(e.target.value) || 1 }))}
                        className="w-14 border border-zinc-200 rounded px-2 py-1 text-xs text-center" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <button onClick={startMatching} disabled={!csvText || selectedRoles.size < 2}
        className="w-full py-3.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mt-6">
        Run stable matching ({rowCount} candidates x {selectedRoles.size} roles)
      </button>
      {selectedRoles.size < 2 && <p className="text-xs text-zinc-400 text-center mt-2">Select at least 2 roles for stable matching</p>}
    </div>
  );
}

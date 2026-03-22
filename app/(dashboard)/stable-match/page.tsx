"use client";

import { useState, useRef, useEffect, DragEvent } from "react";
import { ROLES as DEFAULT_ROLES, Role } from "@/lib/roles";
import { loadRoles } from "@/lib/roles-api";
import { parseCSV, ParsedCandidate } from "@/lib/parse-csv";
import { getApiKey } from "@/lib/api-key";
import { stableMatch, MatchPreference } from "@/lib/stable-match";

interface ScoredCandidate { id: string; name: string; score: number; reasoning: string; highlights: string[]; gaps: string[]; }

interface RoleSlot {
  role: Role | null;
  roleIdx: number;
  fileName: string | null;
  candidates: ParsedCandidate[];
  scored: ScoredCandidate[];
  scoring: boolean;
  done: boolean;
  capacity: number;
}

interface StableResult {
  roleTitle: string;
  candidates: ScoredCandidate[];
}

export default function StableMatchPage() {
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [slots, setSlots] = useState<RoleSlot[]>([createSlot(0)]);
  const [step, setStep] = useState<"setup" | "matching" | "results">("setup");
  const [matchResults, setMatchResults] = useState<StableResult[]>([]);
  const [unmatchedNames, setUnmatchedNames] = useState<string[]>([]);
  const [expandedRole, setExpandedRole] = useState<number | null>(null);

  useEffect(() => { loadRoles().then(setRoles); }, []);

  function createSlot(idx: number): RoleSlot {
    return { role: null, roleIdx: idx, fileName: null, candidates: [], scored: [], scoring: false, done: false, capacity: 3 };
  }

  function addSlot() {
    setSlots(prev => [...prev, createSlot(prev.length)]);
  }

  function removeSlot(idx: number) {
    if (slots.length <= 1) return;
    setSlots(prev => prev.filter((_, i) => i !== idx));
  }

  function updateSlot(idx: number, updates: Partial<RoleSlot>) {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, ...updates } : s));
  }

  function handleFile(slotIdx: number, file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      updateSlot(slotIdx, { fileName: file.name, candidates: parsed });
    };
    reader.readAsText(file);
  }

  // Score one slot's candidates against its role
  async function scoreSlot(slotIdx: number) {
    const slot = slots[slotIdx];
    if (!slot.role || slot.candidates.length === 0) return;

    updateSlot(slotIdx, { scoring: true, scored: [] });

    const scored: ScoredCandidate[] = [];
    try {
      const resp = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidates: slot.candidates.map(c => ({ id: c.id, name: c.name, fullText: c.fullText })),
          jobDescription: `${slot.role.title}\n\n${slot.role.description}`,
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
            if (data.type === "scored" || data.type === "error") {
              scored.push({
                id: data.id, name: data.name, score: data.score || 0,
                reasoning: data.reasoning || data.error || "",
                highlights: data.highlights || [], gaps: data.gaps || [],
              });
              updateSlot(slotIdx, { scored: [...scored] });
            }
          } catch {}
        }
      }
    } catch (err) { console.error(err); }

    updateSlot(slotIdx, { scoring: false, done: true, scored });
  }

  // Run stable matching across all scored slots
  function runStableMatch() {
    const readySlots = slots.filter(s => s.done && s.scored.length > 0 && s.role);
    if (readySlots.length < 2) return;

    setStep("matching");

    // Build global candidate list (deduplicate by name)
    const allCandidates = new Map<string, { name: string; slotScores: Map<number, ScoredCandidate> }>();

    readySlots.forEach((slot, slotIdx) => {
      for (const sc of slot.scored) {
        const key = sc.name.toLowerCase().trim();
        if (!allCandidates.has(key)) {
          allCandidates.set(key, { name: sc.name, slotScores: new Map() });
        }
        allCandidates.get(key)!.slotScores.set(slotIdx, sc);
      }
    });

    const candidateList = [...allCandidates.values()];
    const numRoles = readySlots.length;
    const numCandidates = candidateList.length;

    // Build score matrix
    const scores: MatchPreference[][] = [];
    for (let r = 0; r < numRoles; r++) {
      const roleScores: MatchPreference[] = [];
      for (let c = 0; c < numCandidates; c++) {
        const sc = candidateList[c].slotScores.get(r);
        roleScores.push({
          roleIdx: r, candidateIdx: c,
          score: sc?.score || 0,
          reasoning: sc?.reasoning || "Not scored for this role",
          highlights: sc?.highlights || [],
          gaps: sc?.gaps || [],
        });
      }
      scores.push(roleScores);
    }

    const result = stableMatch(numRoles, numCandidates, readySlots.map(s => s.capacity), scores);

    // Build results
    const results: StableResult[] = [];
    for (let r = 0; r < numRoles; r++) {
      const matched = result.roleMatches.get(r) || [];
      results.push({
        roleTitle: readySlots[r].role!.title,
        candidates: matched
          .map(cIdx => {
            const pref = scores[r].find(s => s.candidateIdx === cIdx);
            return {
              id: `${cIdx}`, name: candidateList[cIdx].name,
              score: pref?.score || 0, reasoning: pref?.reasoning || "",
              highlights: pref?.highlights || [], gaps: pref?.gaps || [],
            };
          })
          .sort((a, b) => b.score - a.score),
      });
    }

    const unmatched = result.unmatched.map(cIdx => candidateList[cIdx].name);

    setMatchResults(results);
    setUnmatchedNames(unmatched);
    setStep("results");
  }

  const allDone = slots.filter(s => s.done).length;
  const readyForMatch = slots.filter(s => s.done && s.scored.length > 0).length >= 2;

  // ── RESULTS ──
  if (step === "results") {
    const totalMatched = matchResults.reduce((s, m) => s + m.candidates.length, 0);
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Stable Matching Results</h1>
            <p className="text-sm text-neutral-500">{totalMatched} matched, {unmatchedNames.length} unmatched across {matchResults.length} roles</p>
          </div>
          <button onClick={() => { setStep("setup"); setMatchResults([]); }} className="text-sm text-purple-600 hover:text-purple-800">Start over</button>
        </div>

        <div className="space-y-4 mb-8">
          {matchResults.map((m, rIdx) => (
            <div key={rIdx} className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
              <button onClick={() => setExpandedRole(expandedRole === rIdx ? null : rIdx)}
                className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-neutral-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700">Role {rIdx + 1}</span>
                    <span className="font-semibold">{m.roleTitle}</span>
                  </div>
                  <p className="text-sm text-neutral-500 mt-0.5">{m.candidates.length} matched</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-neutral-400 transition-transform ${expandedRole === rIdx ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {expandedRole === rIdx && (
                <div className="border-t border-neutral-100 px-5 py-3 space-y-3 fade-in">
                  {m.candidates.length === 0 ? (
                    <p className="text-sm text-neutral-400 py-4 text-center">No candidates matched</p>
                  ) : m.candidates.map((c, i) => {
                    const color = c.score >= 70 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : c.score >= 50 ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-amber-50 border-amber-200 text-amber-700";
                    return (
                      <div key={i} className="flex items-start gap-3 py-2">
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>{c.score}</span>
                        <div>
                          <div className="font-medium text-sm">{c.name}</div>
                          <p className="text-xs text-neutral-500 mt-0.5">{c.reasoning}</p>
                          {c.highlights.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {c.highlights.map((h, j) => <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">{h}</span>)}
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

        {unmatchedNames.length > 0 && (
          <div>
            <h2 className="font-semibold text-sm text-neutral-500 mb-3">Unmatched ({unmatchedNames.length})</h2>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap gap-2">
                {unmatchedNames.slice(0, 30).map((name, i) => (
                  <span key={i} className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded">{name}</span>
                ))}
                {unmatchedNames.length > 30 && <span className="text-xs text-neutral-400">+{unmatchedNames.length - 30} more</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── MATCHING (brief) ──
  if (step === "matching") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-5 animate-pulse">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
        </div>
        <h2 className="text-xl font-bold">Running Gale-Shapley...</h2>
        <p className="text-sm text-neutral-500 mt-2">Finding optimal stable assignments</p>
      </div>
    );
  }

  // ── SETUP ──
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Stable Matching</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Upload a CSV per role, score each, then run Gale-Shapley to optimally assign candidates</p>
      </div>

      {/* Role slots */}
      <div className="space-y-4 mb-6">
        {slots.map((slot, idx) => (
          <RoleSlotCard
            key={idx}
            slot={slot}
            idx={idx}
            roles={roles}
            onSelectRole={(rIdx) => updateSlot(idx, { role: roles[rIdx], roleIdx: rIdx })}
            onFile={(file) => handleFile(idx, file)}
            onCapacity={(cap) => updateSlot(idx, { capacity: cap })}
            onScore={() => scoreSlot(idx)}
            onRemove={() => removeSlot(idx)}
            canRemove={slots.length > 1}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={addSlot} className="flex-1 py-3 rounded-xl border-2 border-dashed border-neutral-300 text-sm font-medium text-neutral-500 hover:border-neutral-400 hover:bg-neutral-50 transition-colors">
          + Add another role
        </button>
      </div>

      {/* Run stable match */}
      <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50 p-5 text-center">
        <p className="text-sm text-neutral-600 mb-3">
          {allDone} of {slots.length} roles scored &middot; {readyForMatch ? "Ready to match" : "Score at least 2 roles to run stable matching"}
        </p>
        <button onClick={runStableMatch} disabled={!readyForMatch}
          className="px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Run Gale-Shapley Stable Matching
        </button>
      </div>
    </div>
  );
}

// ── Role Slot Card ──
function RoleSlotCard({ slot, idx, roles, onSelectRole, onFile, onCapacity, onScore, onRemove, canRemove }: {
  slot: RoleSlot; idx: number; roles: Role[];
  onSelectRole: (rIdx: number) => void; onFile: (f: File) => void;
  onCapacity: (n: number) => void; onScore: () => void; onRemove: () => void; canRemove: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) { e.preventDefault(); setDragging(false); e.dataTransfer.files[0] && onFile(e.dataTransfer.files[0]); }

  const pct = slot.candidates.length > 0 && slot.scored.length > 0 ? Math.round((slot.scored.length / slot.candidates.length) * 100) : 0;

  return (
    <div className={`rounded-xl border bg-white p-5 ${slot.done ? "border-emerald-200" : "border-neutral-200"}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Role {idx + 1}</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-neutral-500">Seats:</span>
            <input type="number" min={1} max={50} value={slot.capacity}
              onChange={e => onCapacity(parseInt(e.target.value) || 1)}
              className="w-14 border border-neutral-200 rounded px-2 py-1 text-xs text-center" />
          </div>
          {canRemove && <button onClick={onRemove} className="text-xs text-neutral-400 hover:text-red-500">Remove</button>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {/* Role picker */}
        <div>
          <button onClick={() => setShowRolePicker(!showRolePicker)}
            className="w-full text-left rounded-lg border border-neutral-200 p-2.5 hover:bg-neutral-50 text-sm">
            {slot.role ? (
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">{slot.role.category}</span>
                <span className="font-medium">{slot.role.title}</span>
              </div>
            ) : (
              <span className="text-neutral-400">Select a role...</span>
            )}
          </button>
          {showRolePicker && (
            <div className="mt-1 rounded-lg border border-neutral-200 bg-white shadow-lg max-h-48 overflow-y-auto">
              {roles.map((r, rIdx) => (
                <button key={rIdx} onClick={() => { onSelectRole(rIdx); setShowRolePicker(false); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-neutral-100 text-neutral-600">{r.category}</span>
                  {r.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CSV upload */}
        <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`rounded-lg border border-dashed p-2.5 text-center cursor-pointer text-sm ${
            dragging ? "border-purple-400 bg-purple-50" : slot.fileName ? "border-emerald-300 bg-emerald-50" : "border-neutral-200 hover:border-neutral-300"
          }`}>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
          {slot.fileName ? (
            <span className="text-emerald-700 font-medium">{slot.fileName} ({slot.candidates.length})</span>
          ) : (
            <span className="text-neutral-400">Drop CSV or click</span>
          )}
        </div>
      </div>

      {/* Score button / progress */}
      {slot.role && slot.candidates.length > 0 && !slot.done && (
        <div className="mt-3">
          {slot.scoring ? (
            <div>
              <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden mb-1">
                <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-neutral-400">{slot.scored.length} / {slot.candidates.length} scored</p>
            </div>
          ) : (
            <button onClick={onScore}
              className="w-full py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors">
              Score {slot.candidates.length} candidates for {slot.role.title}
            </button>
          )}
        </div>
      )}

      {slot.done && (
        <div className="mt-3 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
          <span className="text-xs text-emerald-700 font-medium">{slot.scored.length} candidates scored — ready for matching</span>
        </div>
      )}
    </div>
  );
}

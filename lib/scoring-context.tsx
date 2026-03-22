"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { ScoredCandidate } from "./sessions";

interface ScoringState {
  isScoring: boolean;
  progress: { done: number; total: number };
  results: ScoredCandidate[];
  logs: { name: string; step: string; detail: string }[];
  jobTitle: string;
  error: string | null;
}

interface ScoringContextType extends ScoringState {
  startScoring: (candidates: { id: string; name: string; fullText: string; linkedinUrl?: string }[], jobTitle: string, jobDescription: string, apiKey: string) => void;
  reset: () => void;
}

const ScoringContext = createContext<ScoringContextType | null>(null);

export function useScoringContext() {
  const ctx = useContext(ScoringContext);
  if (!ctx) throw new Error("useScoringContext must be inside ScoringProvider");
  return ctx;
}

export function ScoringProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ScoringState>({
    isScoring: false, progress: { done: 0, total: 0 }, results: [], logs: [], jobTitle: "", error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const startScoring = useCallback((
    candidates: { id: string; name: string; fullText: string; linkedinUrl?: string }[],
    jobTitle: string, jobDescription: string, apiKey: string,
  ) => {
    if (state.isScoring) return;

    setState({ isScoring: true, progress: { done: 0, total: candidates.length }, results: [], logs: [], jobTitle, error: null });

    const scoredMap = new Map<string, ScoredCandidate>();
    let doneCount = 0;

    abortRef.current = new AbortController();

    const API = "https://aicm3pweed.us-east-1.awsapprunner.com";

    fetch(`${API}/talent-pluto/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidates: candidates.map(c => ({ id: c.id, name: c.name, fullText: c.fullText, linkedinUrl: c.linkedinUrl || "" })),
        job_description: jobDescription,
        api_key: apiKey,
      }),
      signal: abortRef.current.signal,
    }).then(async (resp) => {
      if (!resp.ok) {
        setState(s => ({ ...s, isScoring: false, error: `API error: ${resp.status}` }));
        return;
      }

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

            if (data.type === "log") {
              setState(s => ({ ...s, logs: [{ name: data.name, step: data.step, detail: data.detail }, ...s.logs].slice(0, 100) }));
            }

            if (data.type === "scored" || data.type === "error") {
              doneCount++;
              scoredMap.set(data.id, {
                id: data.id, rank: 0, name: data.name,
                score: data.score || 0, reasoning: data.reasoning || data.error || "",
                highlights: data.highlights || [], gaps: data.gaps || [],
                photo_url: data.photo_url || "", linkedin_url: data.linkedin_url || "",
                evidence: data.evidence || {}, criteria: data.criteria || [],
              });
              const sorted = [...scoredMap.values()].sort((a, b) => b.score - a.score);
              sorted.forEach((s, i) => s.rank = i + 1);
              setState(s => ({ ...s, progress: { done: doneCount, total: candidates.length }, results: [...sorted] }));
            }

            if (data.type === "done") {
              const sorted = [...scoredMap.values()].sort((a, b) => b.score - a.score);
              sorted.forEach((s, i) => s.rank = i + 1);
              setState(s => ({ ...s, isScoring: false, results: [...sorted] }));
            }
          } catch {}
        }
      }

      // Stream ended
      if (scoredMap.size > 0) {
        const sorted = [...scoredMap.values()].sort((a, b) => b.score - a.score);
        sorted.forEach((s, i) => s.rank = i + 1);
        setState(s => ({ ...s, isScoring: false, results: [...sorted] }));
      }
    }).catch((err) => {
      if (err.name !== "AbortError") {
        setState(s => ({ ...s, isScoring: false, error: String(err) }));
      }
    });
  }, [state.isScoring]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ isScoring: false, progress: { done: 0, total: 0 }, results: [], logs: [], jobTitle: "", error: null });
  }, []);

  return (
    <ScoringContext.Provider value={{ ...state, startScoring, reset }}>
      {children}
    </ScoringContext.Provider>
  );
}

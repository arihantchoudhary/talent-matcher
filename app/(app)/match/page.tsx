"use client";

import { useState, useCallback, useRef } from "react";
import { ScoredCandidate } from "@/lib/types";
import { parseGenericCSV, GenericCandidate } from "@/lib/parse-csv-client";
import { MatchUpload } from "@/components/match-upload";
import { MatchScoring } from "@/components/match-scoring";
import { MatchResults } from "@/components/match-results";
import { MatchExport } from "@/components/match-export";

type Step = "upload" | "scoring" | "results" | "export";

export default function MatchPage() {
  const [step, setStep] = useState<Step>("upload");
  const [results, setResults] = useState<ScoredCandidate[]>([]);
  const [shortlist, setShortlist] = useState<Set<string>>(new Set());
  const [jobTitle, setJobTitle] = useState("");
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });
  const abortRef = useRef<AbortController | null>(null);

  const handleStart = useCallback(async (csvText: string, title: string, description: string, apiKey: string) => {
    const { candidates: parsed } = parseGenericCSV(csvText);
    if (parsed.length === 0) return;

    setJobTitle(title);
    setShortlist(new Set());
    setResults([]);
    setProgress({ done: 0, total: parsed.length, errors: 0 });
    setStep("scoring");

    const scoredMap = new Map<string, ScoredCandidate>();
    let doneCount = 0;
    let errorCount = 0;

    try {
      abortRef.current = new AbortController();
      const resp = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidates: parsed.map((c) => ({ id: c.id, name: c.name, fullText: c.fullText, linkedinUrl: c.linkedinUrl })),
          jobDescription: `${title}\n\n${description}`,
          apiKey: apiKey || "",
        }),
        signal: abortRef.current.signal,
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
              doneCount++;
              const candidate = parsed.find((c) => c.id === data.id);
              scoredMap.set(data.id, {
                id: data.id, rank: 0, name: data.name, score: data.score,
                reasoning: data.reasoning, highlights: data.highlights || [], gaps: data.gaps || [],
                rawFields: candidate?.rawFields || {},
              });
              setProgress({ done: doneCount, total: parsed.length, errors: errorCount });
              const sorted = [...scoredMap.values()].sort((a, b) => b.score - a.score);
              sorted.forEach((s, i) => (s.rank = i + 1));
              setResults([...sorted]);
            } else if (data.type === "error") {
              doneCount++; errorCount++;
              const candidate = parsed.find((c) => c.id === data.id);
              scoredMap.set(data.id, { id: data.id, rank: 0, name: data.name, score: 0, reasoning: `Error: ${data.error}`, highlights: [], gaps: [], rawFields: candidate?.rawFields || {} });
              setProgress({ done: doneCount, total: parsed.length, errors: errorCount });
            } else if (data.type === "done") {
              const sorted = [...scoredMap.values()].sort((a, b) => b.score - a.score);
              sorted.forEach((s, i) => (s.rank = i + 1));
              setResults([...sorted]);
              setStep("results");
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") console.error(err);
      if (scoredMap.size > 0) {
        const sorted = [...scoredMap.values()].sort((a, b) => b.score - a.score);
        sorted.forEach((s, i) => (s.rank = i + 1));
        setResults([...sorted]);
        setStep("results");
      }
    }
  }, []);

  const toggleShortlist = useCallback((id: string) => {
    setShortlist((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  return (
    <>
      {step === "upload" && <MatchUpload onStart={handleStart} />}
      {step === "scoring" && <MatchScoring progress={progress} results={results} jobTitle={jobTitle} />}
      {step === "results" && <MatchResults results={results} shortlist={shortlist} toggleShortlist={toggleShortlist} jobTitle={jobTitle} onExport={() => setStep("export")} onBack={() => setStep("upload")} />}
      {step === "export" && <MatchExport results={results.filter((r) => shortlist.has(r.id))} allResults={results} onBack={() => setStep("results")} />}
    </>
  );
}

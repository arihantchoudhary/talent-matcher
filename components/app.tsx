"use client";

import { useState, useCallback, useRef } from "react";
import { ScoredCandidate } from "@/lib/types";
import { parseGenericCSV, GenericCandidate } from "@/lib/parse-csv-client";
import { UploadStep } from "./upload-step";
import { ScoringStep } from "./scoring-step";
import { ResultsStep } from "./results-step";
import { CheckoutStep } from "./checkout-step";

type Step = "upload" | "scoring" | "results" | "checkout";

// Server-side API key set via OPENAI_API_KEY env var; client can also pass their own

export function App({ defaultResults }: { defaultResults: ScoredCandidate[] }) {
  const [step, setStep] = useState<Step>("upload");
  const [results, setResults] = useState<ScoredCandidate[]>(defaultResults);
  const [shortlist, setShortlist] = useState<Set<string>>(new Set());
  const [jobTitle, setJobTitle] = useState("Founding GTM, Legal");
  const [jobDesc, setJobDesc] = useState("");
  const [candidates, setCandidates] = useState<GenericCandidate[]>([]);
  const [scoringProgress, setScoringProgress] = useState({ done: 0, total: 0, errors: 0 });
  const abortRef = useRef<AbortController | null>(null);

  const handleStartScoring = useCallback(async (csvText: string, title: string, description: string, apiKey: string) => {
    const { candidates: parsed } = parseGenericCSV(csvText);
    if (parsed.length === 0) { alert("No candidates found in CSV"); return; }

    setCandidates(parsed);
    setJobTitle(title);
    setJobDesc(description);
    setShortlist(new Set());
    setResults([]);
    setScoringProgress({ done: 0, total: parsed.length, errors: 0 });
    setStep("scoring");

    const scoredMap = new Map<string, ScoredCandidate>();

    try {
      abortRef.current = new AbortController();
      const resp = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidates: parsed.map((c) => ({ id: c.id, name: c.name, fullText: c.fullText, linkedinUrl: c.linkedinUrl })),
          jobDescription: `${title}\n\n${description}`,
          apiKey: apiKey || "",  // Empty = use server-side OPENAI_API_KEY env var
        }),
        signal: abortRef.current.signal,
      });

      const reader = resp.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";
      let doneCount = 0;
      let errorCount = 0;

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
                id: data.id,
                rank: 0,
                name: data.name,
                score: data.score,
                reasoning: data.reasoning,
                highlights: data.highlights || [],
                gaps: data.gaps || [],
                rawFields: candidate?.rawFields || {},
              });
              setScoringProgress({ done: doneCount, total: parsed.length, errors: errorCount });

              // Update results as they come in
              const sorted = [...scoredMap.values()].sort((a, b) => b.score - a.score);
              sorted.forEach((s, i) => (s.rank = i + 1));
              setResults([...sorted]);
            } else if (data.type === "error") {
              doneCount++;
              errorCount++;
              const candidate = parsed.find((c) => c.id === data.id);
              scoredMap.set(data.id, {
                id: data.id, rank: 0, name: data.name, score: 0,
                reasoning: `Scoring failed: ${data.error}`,
                highlights: [], gaps: [],
                rawFields: candidate?.rawFields || {},
              });
              setScoringProgress({ done: doneCount, total: parsed.length, errors: errorCount });
            } else if (data.type === "done") {
              const sorted = [...scoredMap.values()].sort((a, b) => b.score - a.score);
              sorted.forEach((s, i) => (s.rank = i + 1));
              setResults([...sorted]);
              setStep("results");
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Scoring failed:", err);
      }
      // Still show whatever we have
      if (scoredMap.size > 0) {
        const sorted = [...scoredMap.values()].sort((a, b) => b.score - a.score);
        sorted.forEach((s, i) => (s.rank = i + 1));
        setResults([...sorted]);
        setStep("results");
      }
    }
  }, []);

  const toggleShortlist = useCallback((id: string) => {
    setShortlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const shortlistedResults = results.filter((r) => shortlist.has(r.id));

  return (
    <div>
      {/* Step nav bar */}
      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 h-11 flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm">
            <StepPill n="1" label="Upload" active={step === "upload"} done={step !== "upload"} onClick={() => setStep("upload")} />
            <Chevron />
            <StepPill n="2" label="Match" active={step === "scoring" || step === "results"} done={step === "checkout"} onClick={() => results.length > 0 ? setStep("results") : undefined} />
            <Chevron />
            <StepPill n="3" label="Export" active={step === "checkout"} done={false} onClick={() => shortlist.size > 0 ? setStep("checkout") : undefined} />
          </div>
          {(step === "results" || step === "checkout") && (
            <button onClick={() => shortlist.size > 0 ? setStep("checkout") : undefined}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              Shortlist
              {shortlist.size > 0 && <span className="bg-white text-[var(--accent)] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">{shortlist.size}</span>}
            </button>
          )}
        </div>
      </div>

      <main>
        {step === "upload" && <UploadStep onStart={handleStartScoring} />}
        {step === "scoring" && <ScoringStep progress={scoringProgress} results={results} jobTitle={jobTitle} />}
        {step === "results" && <ResultsStep results={results} shortlist={shortlist} toggleShortlist={toggleShortlist} jobTitle={jobTitle} onCheckout={() => setStep("checkout")} />}
        {step === "checkout" && <CheckoutStep results={shortlistedResults} allResults={results} onBack={() => setStep("results")} />}
      </main>
    </div>
  );
}

function StepPill({ n, label, active, done, onClick }: { n: string; label: string; active: boolean; done: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        active ? "bg-[var(--accent)] text-white" : done ? "bg-[var(--accent-light)] text-[var(--accent)]" : "text-[var(--text-muted)]"
      }`}>
      {done ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="inline mr-1 -mt-px"><path d="M20 6 9 17l-5-5" /></svg> : null}
      {n}. {label}
    </button>
  );
}
function Chevron() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]"><path d="m9 18 6-6-6-6" /></svg>;
}

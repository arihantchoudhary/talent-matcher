"use client";

import { ScoredCandidate } from "@/lib/types";

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function toCSV(results: ScoredCandidate[]) {
  const headers = ["Rank", "Name", "Score", "Reasoning", "Highlights", "Gaps"];
  const rows = results.map((r) => [
    r.rank, `"${r.name}"`, r.score, `"${r.reasoning.replace(/"/g, '""')}"`,
    `"${r.highlights.join("; ")}"`, `"${r.gaps.join("; ")}"`,
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function toJSON(results: ScoredCandidate[]) {
  return JSON.stringify(results.map((r) => ({
    rank: r.rank, name: r.name, score: r.score, reasoning: r.reasoning,
    highlights: r.highlights, gaps: r.gaps,
  })), null, 2);
}

export function CheckoutStep({ results, allResults, onBack }: { results: ScoredCandidate[]; allResults: ScoredCandidate[]; onBack: () => void }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 slide-up">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-6">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
        Back to results
      </button>

      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
        <h2 className="text-2xl font-bold">Your interview shortlist</h2>
        <p className="text-[var(--text-muted)] mt-1">{results.length} candidate{results.length !== 1 ? "s" : ""} ready to export</p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden mb-6">
        {results.map((r, i) => (
          <div key={r.id} className={`flex items-center gap-4 p-4 ${i > 0 ? "border-t border-[var(--border)]" : ""}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border-2 ${
              r.score >= 70 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : r.score >= 50 ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-amber-50 border-amber-200 text-amber-700"
            }`}>{r.score}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{r.name}</div>
              <div className="text-xs text-[var(--text-muted)] truncate">{r.reasoning}</div>
            </div>
            <span className="text-xs text-[var(--text-muted)]">#{r.rank}</span>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        <button onClick={() => download(toCSV(results), "interview-shortlist.csv", "text/csv")}
          className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-hover)] shadow-sm hover:shadow-md transition-all">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Download Shortlist CSV
        </button>
        <button onClick={() => download(toJSON(results), "interview-shortlist.json", "application/json")}
          className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 border-[var(--border)] font-semibold hover:bg-[var(--surface-2)] transition-all">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Download as JSON
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5 text-center">
        <p className="text-sm text-[var(--text-secondary)] mb-3">Need the full ranking?</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => download(toCSV(allResults), "full-rankings.csv", "text/csv")}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--border)] bg-white hover:bg-[var(--surface-hover)]">
            All {allResults.length} (CSV)
          </button>
          <button onClick={() => download(toJSON(allResults), "full-rankings.json", "application/json")}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--border)] bg-white hover:bg-[var(--surface-hover)]">
            All {allResults.length} (JSON)
          </button>
        </div>
      </div>
    </div>
  );
}

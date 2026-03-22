"use client";

import { ScoredCandidate } from "@/lib/types";

export function ScoringStep({
  progress,
  results,
  jobTitle,
}: {
  progress: { done: number; total: number; errors: number };
  results: ScoredCandidate[];
  jobTitle: string;
}) {
  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center fade-in">
      <div className="w-20 h-20 rounded-full bg-[var(--accent-light)] flex items-center justify-center mx-auto mb-6 animate-pulse">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2a8.5 8.5 0 0 0-8.5 8.5c0 4.5 3.5 8.5 8.5 11.5 5-3 8.5-7 8.5-11.5A8.5 8.5 0 0 0 12 2z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold mb-2">Scoring candidates...</h2>
      <p className="text-[var(--text-muted)] mb-8">
        Matching {progress.total} candidates against <span className="font-medium text-[var(--text)]">{jobTitle}</span>
      </p>

      {/* Progress bar */}
      <div className="max-w-md mx-auto mb-4">
        <div className="h-3 rounded-full bg-[var(--surface-2)] overflow-hidden">
          <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-[var(--text-muted)]">{progress.done} of {progress.total}</span>
          <span className="font-bold text-[var(--accent)]">{pct}%</span>
        </div>
        {progress.errors > 0 && (
          <p className="text-xs text-[var(--red)] mt-1">{progress.errors} errors</p>
        )}
      </div>

      {/* Live preview of scored candidates */}
      {results.length > 0 && (
        <div className="mt-8 text-left max-w-md mx-auto">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Top matches so far</p>
          <div className="space-y-2">
            {results.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white border border-[var(--border)]">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  r.score >= 70 ? "bg-emerald-100 text-emerald-700" :
                  r.score >= 50 ? "bg-indigo-100 text-indigo-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {r.score}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

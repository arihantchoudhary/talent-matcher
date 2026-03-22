import fs from "fs";
import path from "path";
import { RankedList } from "./ranked-list";

interface Candidate {
  rank: number;
  id: string;
  name: string;
  score: number;
  reasoning: string;
  highlights: string[];
  gaps: string[];
}

export default function Home() {
  const filePath = path.join(process.cwd(), "data", "ranked-output.json");
  const candidates: Candidate[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const avg = Math.round(candidates.reduce((s, c) => s + c.score, 0) / candidates.length);
  const top = candidates.filter((c) => c.score >= 70).length;
  const good = candidates.filter((c) => c.score >= 50 && c.score < 70).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Talent Matcher</h1>
            <p className="text-sm text-zinc-500">Candidate ranking for Founding GTM, Legal</p>
          </div>
        </div>

        {/* Role summary */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 mb-6">
          <h2 className="font-semibold text-sm mb-2">Role: Founding GTM, Legal</h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Build the Legal go-to-market motion for an AI-native procurement platform (Series B+, multi-eight-figure ARR).
            High-ownership sales role — own top-of-funnel for Legal, run outbound, qualify opportunities, support deals,
            run executive events. 1-4 years in law, banking, consulting, startups, or VC. Legal sector familiarity required.
            In-person Tue-Thu, US-based preferred.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Stat label="Candidates" value={candidates.length} />
          <Stat label="Avg Score" value={avg} />
          <Stat label="Top Tier (70+)" value={top} accent />
          <Stat label="Good Fit (50-69)" value={good} />
        </div>
      </div>

      {/* Ranked list */}
      <RankedList candidates={candidates} />

      {/* Footer */}
      <div className="mt-10 pt-6 border-t border-zinc-100 text-center text-xs text-zinc-400">
        Scored with GPT-4o-mini &middot; {candidates.length} candidates &middot; Founding GTM, Legal
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "bg-emerald-50 border-emerald-200" : "border-zinc-200"}`}>
      <div className={`text-2xl font-bold ${accent ? "text-emerald-700" : ""}`}>{value}</div>
      <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
    </div>
  );
}

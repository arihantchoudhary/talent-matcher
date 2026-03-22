import fs from "fs";
import path from "path";
import { RankedList } from "./ranked-list";

interface Candidate {
  rank: number; id: string; name: string; score: number;
  reasoning: string; highlights: string[]; gaps: string[];
  linkedin_headline?: string; linkedin_photo?: string; linkedin_url?: string;
}

export default function RankingsPage() {
  const filePath = path.join(process.cwd(), "data", "ranked-output.json");
  const candidates: Candidate[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const avg = Math.round(candidates.reduce((s, c) => s + c.score, 0) / candidates.length);
  const top = candidates.filter((c) => c.score >= 70).length;
  const good = candidates.filter((c) => c.score >= 50 && c.score < 70).length;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Rankings</h1>
          <p className="text-sm text-zinc-500">93 candidates scored for <span className="font-medium text-zinc-700">Founding GTM, Legal</span></p>
        </div>

        {/* Role card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 mb-6">
          <h2 className="font-semibold text-sm mb-2">Role: Founding GTM, Legal</h2>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Build the Legal go-to-market motion for an AI-native procurement platform (Series B+, multi-eight-figure ARR).
            High-ownership sales role — own top-of-funnel for Legal, run outbound, qualify opps, support deals,
            run executive events. 1-4 years in law/banking/consulting/startups/VC. US-based, in-person Tue-Thu.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="text-2xl font-bold">{candidates.length}</div>
            <div className="text-xs text-zinc-500 mt-0.5">Candidates</div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="text-2xl font-bold">{avg}</div>
            <div className="text-xs text-zinc-500 mt-0.5">Avg Score</div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-2xl font-bold text-emerald-700">{top}</div>
            <div className="text-xs text-zinc-500 mt-0.5">Top Tier (70+)</div>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="text-2xl font-bold text-indigo-700">{good}</div>
            <div className="text-xs text-zinc-500 mt-0.5">Good Fit (50-69)</div>
          </div>
        </div>

        <RankedList candidates={candidates} />
      </div>
    </div>
  );
}

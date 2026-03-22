"use client";

import { ScoredCandidate } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, FileJson, FileSpreadsheet, Check } from "lucide-react";

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function toCSV(results: ScoredCandidate[]) {
  const h = ["Rank","Name","Score","Reasoning","Highlights","Gaps"];
  const rows = results.map((r) => [r.rank, `"${r.name}"`, r.score, `"${r.reasoning.replace(/"/g, '""')}"`, `"${r.highlights.join("; ")}"`, `"${r.gaps.join("; ")}"`]);
  return [h.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function toJSON(results: ScoredCandidate[]) {
  return JSON.stringify(results.map((r) => ({ rank: r.rank, name: r.name, score: r.score, reasoning: r.reasoning, highlights: r.highlights, gaps: r.gaps })), null, 2);
}

export function MatchExport({ results, allResults, onBack }: { results: ScoredCandidate[]; allResults: ScoredCandidate[]; onBack: () => void }) {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> Back to results</Button>

      <div className="text-center pt-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Check className="w-7 h-7 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold">Interview Shortlist</h2>
        <p className="text-sm text-muted-foreground mt-1">{results.length} candidate{results.length !== 1 ? "s" : ""} ready to export</p>
      </div>

      <Card>
        <CardContent className="pt-6 divide-y">
          {results.map((r) => (
            <div key={r.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Badge variant={r.score >= 70 ? "default" : "secondary"} className="tabular-nums">{r.score}</Badge>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground truncate">{r.reasoning}</div>
              </div>
              <span className="text-xs text-muted-foreground">#{r.rank}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        <Button size="lg" onClick={() => download(toCSV(results), "shortlist.csv", "text/csv")}>
          <FileSpreadsheet className="w-4 h-4 mr-2" /> Download CSV
        </Button>
        <Button size="lg" variant="outline" onClick={() => download(toJSON(results), "shortlist.json", "application/json")}>
          <FileJson className="w-4 h-4 mr-2" /> Download JSON
        </Button>
      </div>

      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Full rankings</CardTitle>
          <CardDescription>Export all {allResults.length} scored candidates</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => download(toCSV(allResults), "full-rankings.csv", "text/csv")}>All CSV</Button>
          <Button size="sm" variant="outline" onClick={() => download(toJSON(allResults), "full-rankings.json", "application/json")}>All JSON</Button>
        </CardContent>
      </Card>
    </div>
  );
}

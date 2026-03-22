"use client";

import { ScoredCandidate } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export function MatchScoring({ progress, results, jobTitle }: { progress: { done: number; total: number; errors: number }; results: ScoredCandidate[]; jobTitle: string }) {
  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="text-center pt-8">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Sparkles className="w-7 h-7 text-indigo-600" />
        </div>
        <h2 className="text-xl font-bold mb-1">Scoring candidates...</h2>
        <p className="text-sm text-muted-foreground">Matching {progress.total} candidates against <span className="font-medium text-foreground">{jobTitle}</span></p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Progress value={pct} className="mb-3" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{progress.done} of {progress.total}</span>
            <span className="font-bold text-indigo-600">{pct}%</span>
          </div>
          {progress.errors > 0 && <p className="text-xs text-destructive mt-1">{progress.errors} errors</p>}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Top matches so far</p>
            <div className="space-y-2">
              {results.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg border">
                  <Badge variant={r.score >= 70 ? "default" : "secondary"} className="tabular-nums">{r.score}</Badge>
                  <span className="text-sm font-medium truncate">{r.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

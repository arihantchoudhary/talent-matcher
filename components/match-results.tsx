"use client";

import { useState, useMemo } from "react";
import { ScoredCandidate } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Check, ChevronDown, ArrowLeft, Download } from "lucide-react";

function scoreBadge(score: number) {
  if (score >= 70) return "default" as const;
  if (score >= 50) return "secondary" as const;
  return "outline" as const;
}

function scoreLabel(score: number) {
  if (score >= 70) return "Top Tier";
  if (score >= 50) return "Good Fit";
  if (score >= 30) return "Moderate";
  return "Low Fit";
}

export function MatchResults({ results, shortlist, toggleShortlist, jobTitle, onExport, onBack }: {
  results: ScoredCandidate[]; shortlist: Set<string>; toggleShortlist: (id: string) => void;
  jobTitle: string; onExport: () => void; onBack: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = results;
    if (search) { const q = search.toLowerCase(); list = list.filter((r) => r.name.toLowerCase().includes(q) || r.reasoning.toLowerCase().includes(q) || Object.values(r.rawFields).some((v) => v.toLowerCase().includes(q))); }
    if (filter === "top") list = list.filter((r) => r.score >= 70);
    else if (filter === "good") list = list.filter((r) => r.score >= 50 && r.score < 70);
    else if (filter === "low") list = list.filter((r) => r.score < 50);
    else if (filter === "shortlisted") list = list.filter((r) => shortlist.has(r.id));
    return list;
  }, [results, search, filter, shortlist]);

  const topCount = results.filter((r) => r.score >= 70).length;
  const goodCount = results.filter((r) => r.score >= 50 && r.score < 70).length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> New match</Button>
          </div>
          <h1 className="text-2xl font-bold">{results.length} candidates scored</h1>
          <p className="text-sm text-muted-foreground">
            {jobTitle} — <span className="text-emerald-600 font-medium">{topCount} top tier</span>, <span className="text-indigo-600 font-medium">{goodCount} good fit</span>
          </p>
        </div>
        {shortlist.size > 0 && (
          <Button onClick={onExport}><Download className="w-4 h-4 mr-2" /> Export {shortlist.size}</Button>
        )}
      </div>

      {/* Search + filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search candidates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {[
            { v: "all", l: "All", c: results.length },
            { v: "top", l: "Top Tier", c: topCount },
            { v: "good", l: "Good Fit", c: goodCount },
            { v: "low", l: "< 50", c: results.filter((r) => r.score < 50).length },
            { v: "shortlisted", l: "Shortlisted", c: shortlist.size },
          ].map((f) => (
            <Button key={f.v} variant={filter === f.v ? "default" : "outline"} size="sm" onClick={() => setFilter(f.v)}>
              {f.l} <span className="ml-1 opacity-60">{f.c}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No candidates match your filters</CardContent></Card>
        ) : filtered.map((r) => (
          <Card key={r.id} className={shortlist.has(r.id) ? "border-indigo-300 ring-1 ring-indigo-200" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                <div className="shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                  #{r.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm">{r.name}</span>
                    <Badge variant={scoreBadge(r.score)} className="tabular-nums">{r.score} - {scoreLabel(r.score)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{r.reasoning}</p>
                  {r.highlights.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {r.highlights.slice(0, 3).map((h, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">{h}</Badge>
                      ))}
                      {r.gaps.slice(0, 2).map((g, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">{g}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant={shortlist.has(r.id) ? "default" : "outline"}
                    onClick={(e) => { e.stopPropagation(); toggleShortlist(r.id); }}>
                    {shortlist.has(r.id) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </Button>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded === r.id ? "rotate-180" : ""}`} />
                </div>
              </div>

              {expanded === r.id && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm mb-3">{r.reasoning}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(r.rawFields).slice(0, 9).map(([k, v]) => {
                      if (!v || v.length > 200) return null;
                      return (
                        <div key={k} className="rounded-lg bg-muted/50 p-2">
                          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{k.replace(/_/g, " ")}</div>
                          <div className="text-xs truncate">{v}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

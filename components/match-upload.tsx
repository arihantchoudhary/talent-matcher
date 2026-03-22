"use client";

import { useState, useRef, useMemo, DragEvent } from "react";
import { ROLES, CITIES, CATEGORIES } from "@/lib/roles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Upload, Check, ChevronDown, Search, MapPin, Sparkles, Eye, EyeOff } from "lucide-react";

const TAG_COLORS: Record<string, string> = {
  Sales: "bg-blue-100 text-blue-700 border-blue-200",
  GTM: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Partnerships: "bg-violet-100 text-violet-700 border-violet-200",
  "Customer Success": "bg-emerald-100 text-emerald-700 border-emerald-200",
  Marketing: "bg-orange-100 text-orange-700 border-orange-200",
  Operations: "bg-amber-100 text-amber-700 border-amber-200",
  Leadership: "bg-rose-100 text-rose-700 border-rose-200",
  Engineering: "bg-cyan-100 text-cyan-700 border-cyan-200",
  Product: "bg-pink-100 text-pink-700 border-pink-200",
  Finance: "bg-teal-100 text-teal-700 border-teal-200",
};

export function MatchUpload({ onStart }: { onStart: (csv: string, title: string, desc: string, apiKey: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [jobTitle, setJobTitle] = useState(ROLES[0].title);
  const [jobDesc, setJobDesc] = useState(ROLES[0].description);
  const [showRoles, setShowRoles] = useState(false);
  const [catFilter, setCatFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredRoles = useMemo(() => {
    let list = ROLES;
    if (catFilter !== "All") list = list.filter((r) => r.category === catFilter);
    if (cityFilter !== "All") list = list.filter((r) => r.locations.includes(cityFilter) || r.remote);
    if (remoteOnly) list = list.filter((r) => r.remote);
    if (roleSearch) { const q = roleSearch.toLowerCase(); list = list.filter((r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)); }
    return list;
  }, [catFilter, cityFilter, remoteOnly, roleSearch]);

  const activeCities = useMemo(() => {
    const s = new Set<string>();
    ROLES.forEach((r) => r.locations.forEach((l) => s.add(l)));
    return CITIES.filter((c) => s.has(c));
  }, []);

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => { const t = e.target?.result as string; setCsvText(t); setRowCount(Math.max(0, t.split("\n").filter((l) => l.trim()).length - 1)); };
    reader.readAsText(file);
  }

  function handleDrop(e: DragEvent) { e.preventDefault(); setDragging(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]); }

  function pickRole(idx: number) { setSelectedIdx(idx); setJobTitle(ROLES[idx].title); setJobDesc(ROLES[idx].description); setShowRoles(false); }

  const role = ROLES[selectedIdx];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Match</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload candidates and select a role to start AI scoring</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Upload card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Candidates</CardTitle>
              <CardDescription>Upload a CSV file with candidate data</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragging ? "border-indigo-400 bg-indigo-50" : fileName ? "border-emerald-300 bg-emerald-50" : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                }`}
              >
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                {fileName ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><Check className="w-5 h-5 text-emerald-600" /></div>
                    <p className="font-semibold text-emerald-700">{fileName}</p>
                    <p className="text-sm text-muted-foreground">{rowCount} candidates detected</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><Upload className="w-5 h-5 text-muted-foreground" /></div>
                    <p className="font-medium text-sm">Drop CSV here or click to browse</p>
                    <p className="text-xs text-muted-foreground">Any format — we auto-detect columns</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* API key card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">API Key</CardTitle>
              <CardDescription>Optional — built-in key is used by default</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Input type={showKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-proj-..." className="pr-10" />
                <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column — role picker */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Role</CardTitle>
              <CardDescription>Pick from templates or write your own</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected role */}
              <button onClick={() => setShowRoles(!showRoles)} className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={TAG_COLORS[role.category]}>{role.category}</Badge>
                    <span className="font-medium text-sm">{role.title}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showRoles ? "rotate-180" : ""}`} />
                </div>
                <div className="flex gap-1 mt-2">
                  {role.locations.slice(0, 4).map((l) => (
                    <span key={l} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" />{l}
                    </span>
                  ))}
                  {role.remote && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Remote</span>}
                </div>
              </button>

              {/* Role picker dropdown */}
              {showRoles && (
                <Card className="border shadow-lg">
                  <div className="p-3 space-y-2 bg-muted/30 rounded-t-xl">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input placeholder="Search roles..." value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)} className="pl-8 h-8 text-xs" />
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {["All", ...CATEGORIES].map((c) => (
                        <button key={c} onClick={() => setCatFilter(c)}
                          className={`shrink-0 px-2 py-1 rounded-md text-xs font-medium transition-colors ${catFilter === c ? "bg-foreground text-background" : "bg-background text-muted-foreground hover:text-foreground border"}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="flex-1 rounded-md border bg-background px-2 py-1 text-xs">
                        <option value="All">All cities</option>
                        {activeCities.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="flex items-center gap-1.5">
                        <Switch checked={remoteOnly} onCheckedChange={setRemoteOnly} className="scale-75" />
                        <Label className="text-xs">Remote</Label>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <ScrollArea className="h-64">
                    <div className="p-2 space-y-1">
                      {filteredRoles.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">No roles match</p>
                      ) : filteredRoles.map((r, idx) => {
                        const realIdx = ROLES.indexOf(r);
                        return (
                          <button key={realIdx} onClick={() => pickRole(realIdx)}
                            className={`w-full text-left rounded-lg p-2.5 transition-colors ${selectedIdx === realIdx ? "bg-indigo-50 border border-indigo-200" : "hover:bg-muted/50"}`}>
                            <div className="flex items-center gap-2 mb-0.5">
                              <Badge variant="outline" className={`text-[10px] py-0 ${TAG_COLORS[r.category]}`}>{r.category}</Badge>
                              <span className="text-xs text-muted-foreground">{r.experienceRange}</span>
                              {r.remote && <span className="text-[10px] text-emerald-600">Remote</span>}
                            </div>
                            <div className="text-sm font-medium">{r.title}</div>
                            <div className="flex gap-1 mt-1">
                              {r.locations.slice(0, 3).map((l) => (
                                <span key={l} className="text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded">{l}</span>
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  <div className="p-2 border-t text-center">
                    <span className="text-xs text-muted-foreground">{filteredRoles.length} of {ROLES.length} roles</span>
                  </div>
                </Card>
              )}

              {/* Editable fields */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Role title</Label>
                  <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} rows={6} className="mt-1 text-xs" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={() => csvText && onStart(csvText, jobTitle, jobDesc, apiKey)}
        disabled={!csvText}
        size="lg"
        className="w-full"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Score {rowCount > 0 ? `${rowCount} candidates` : "candidates"} for {jobTitle}
      </Button>
    </div>
  );
}

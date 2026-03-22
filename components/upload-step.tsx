"use client";

import { useState, useRef, useMemo, DragEvent } from "react";
import { ROLES, CITIES, CATEGORIES, RoleTemplate } from "@/lib/roles";

const TAG_COLORS: Record<string, string> = {
  Sales: "bg-blue-100 text-blue-700",
  GTM: "bg-indigo-100 text-indigo-700",
  Partnerships: "bg-violet-100 text-violet-700",
  "Customer Success": "bg-emerald-100 text-emerald-700",
  Marketing: "bg-orange-100 text-orange-700",
  Operations: "bg-amber-100 text-amber-700",
  Leadership: "bg-rose-100 text-rose-700",
  Engineering: "bg-cyan-100 text-cyan-700",
  Product: "bg-pink-100 text-pink-700",
  Finance: "bg-teal-100 text-teal-700",
};

export function UploadStep({ onStart }: { onStart: (csv: string, title: string, desc: string, apiKey: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(0);

  // Role selection
  const [selectedRole, setSelectedRole] = useState<RoleTemplate>(ROLES[0]);
  const [jobTitle, setJobTitle] = useState(ROLES[0].title);
  const [jobDesc, setJobDesc] = useState(ROLES[0].description);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [cityFilter, setCityFilter] = useState<string>("All");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Filter roles
  const filteredRoles = useMemo(() => {
    let list = ROLES;
    if (categoryFilter !== "All") list = list.filter((r) => r.category === categoryFilter);
    if (cityFilter !== "All") list = list.filter((r) => r.locations.includes(cityFilter) || r.remote);
    if (remoteOnly) list = list.filter((r) => r.remote);
    if (roleSearch) {
      const q = roleSearch.toLowerCase();
      list = list.filter((r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
    }
    return list;
  }, [categoryFilter, cityFilter, remoteOnly, roleSearch]);

  // Cities that appear in filtered roles
  const activeCities = useMemo(() => {
    const s = new Set<string>();
    ROLES.forEach((r) => r.locations.forEach((l) => s.add(l)));
    return CITIES.filter((c) => s.has(c));
  }, []);

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      const lines = text.split("\n").filter((l) => l.trim());
      setRowCount(Math.max(0, lines.length - 1));
    };
    reader.readAsText(file);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function pickRole(role: RoleTemplate) {
    setSelectedRole(role);
    setJobTitle(role.title);
    setJobDesc(role.description);
    setShowRolePicker(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 fade-in">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Match candidates to your role</h1>
        <p className="text-lg text-[var(--text-muted)]">Upload a CSV, pick a role, get AI-powered rankings.</p>
      </div>

      <div className="space-y-5">
        {/* 1. CSV upload */}
        <div>
          <label className="block text-sm font-semibold mb-2">1. Upload candidates</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragging ? "drop-active" : fileName ? "border-emerald-300 bg-emerald-50" : "border-[var(--border)] hover:border-[var(--border-light)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <input ref={fileRef} type="file" accept=".csv" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {fileName ? (
              <div className="flex items-center justify-center gap-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
                <div className="text-left">
                  <p className="font-semibold text-[var(--green)]">{fileName}</p>
                  <p className="text-xs text-[var(--text-muted)]">{rowCount} candidates</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div className="text-left">
                  <p className="font-semibold text-sm">Drop CSV here or click to browse</p>
                  <p className="text-xs text-[var(--text-muted)]">Any format — we auto-detect columns</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Role picker */}
        <div>
          <label className="block text-sm font-semibold mb-2">2. Select a role</label>

          {/* Current selection */}
          <button
            onClick={() => setShowRolePicker(!showRolePicker)}
            className="w-full text-left rounded-xl border border-[var(--border)] px-4 py-3 bg-white hover:bg-[var(--surface-2)] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${TAG_COLORS[selectedRole.category] || "bg-gray-100 text-gray-600"}`}>
                  {selectedRole.category}
                </span>
                <span className="font-medium text-sm">{selectedRole.title}</span>
                <span className="text-xs text-[var(--text-muted)]">{selectedRole.experienceRange}</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedRole.remote && <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Remote OK</span>}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-[var(--text-muted)] transition-transform ${showRolePicker ? "rotate-180" : ""}`}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
            <div className="flex gap-1 mt-1.5">
              {selectedRole.locations.slice(0, 5).map((loc) => (
                <span key={loc} className="text-[10px] text-[var(--text-muted)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">{loc}</span>
              ))}
              {selectedRole.locations.length > 5 && (
                <span className="text-[10px] text-[var(--text-muted)]">+{selectedRole.locations.length - 5}</span>
              )}
            </div>
          </button>

          {/* Role picker panel */}
          {showRolePicker && (
            <div className="mt-2 rounded-xl border border-[var(--border)] bg-white shadow-lg overflow-hidden">
              {/* Filters */}
              <div className="p-3 border-b border-[var(--border)] space-y-2 bg-[var(--surface-2)]">
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--accent)]"
                />
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {/* Category pills */}
                  {["All", ...CATEGORIES].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        categoryFilter === cat ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "bg-white border-[var(--border)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  {/* City dropdown */}
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="flex-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="All">All cities</option>
                    {activeCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {/* Remote toggle */}
                  <button
                    onClick={() => setRemoteOnly(!remoteOnly)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      remoteOnly ? "bg-emerald-500 text-white border-emerald-500" : "bg-white border-[var(--border)] text-[var(--text-secondary)]"
                    }`}
                  >
                    Remote OK
                  </button>
                </div>
              </div>

              {/* Role list */}
              <div className="max-h-72 overflow-y-auto p-2">
                {filteredRoles.length === 0 ? (
                  <p className="text-center text-sm text-[var(--text-muted)] py-6">No roles match your filters</p>
                ) : (
                  <div className="space-y-1">
                    {filteredRoles.map((role, idx) => (
                      <button
                        key={idx}
                        onClick={() => pickRole(role)}
                        className={`w-full text-left rounded-lg p-3 transition-all ${
                          selectedRole.title === role.title ? "bg-[var(--accent-light)] border border-[var(--accent)]" : "hover:bg-[var(--surface-2)] border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${TAG_COLORS[role.category] || "bg-gray-100"}`}>
                            {role.category}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">{role.experienceRange}</span>
                          {role.remote && <span className="text-[10px] text-emerald-600">Remote</span>}
                        </div>
                        <div className="text-sm font-medium">{role.title}</div>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {role.locations.slice(0, 4).map((loc) => (
                            <span key={loc} className="text-[10px] text-[var(--text-muted)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">{loc}</span>
                          ))}
                          {role.locations.length > 4 && <span className="text-[10px] text-[var(--text-muted)]">+{role.locations.length - 4}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-[var(--border)] bg-[var(--surface-2)] text-center">
                <p className="text-xs text-[var(--text-muted)]">{filteredRoles.length} of {ROLES.length} roles shown</p>
              </div>
            </div>
          )}
        </div>

        {/* 3. Editable title + desc */}
        <div>
          <label className="block text-sm font-semibold mb-2">3. Customize <span className="font-normal text-[var(--text-muted)]">(or use as-is)</span></label>
          <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
            className="w-full rounded-t-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium bg-white focus:outline-none focus:border-[var(--accent)]" />
          <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} rows={5}
            className="w-full rounded-b-xl border border-t-0 border-[var(--border)] px-4 py-2.5 text-sm bg-white resize-none focus:outline-none focus:border-[var(--accent)]" />
        </div>

        {/* API key */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            OpenAI API Key <span className="font-normal text-[var(--text-muted)]">(optional)</span>
          </label>
          <div className="relative">
            <input type={showKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              placeholder="Uses built-in key if empty"
              className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 pr-16 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]" />
            <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={() => csvText && onStart(csvText, jobTitle, jobDesc, apiKey)}
          disabled={!csvText}
          className="w-full py-4 rounded-xl bg-[var(--accent)] text-white font-semibold text-base
                     hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed
                     transition-all shadow-sm hover:shadow-md"
        >
          Score {rowCount > 0 ? `${rowCount} candidates` : "candidates"} for {jobTitle}
        </button>
      </div>
    </div>
  );
}

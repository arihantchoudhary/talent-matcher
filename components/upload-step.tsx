"use client";

import { useState, useRef, DragEvent } from "react";

const DEFAULT_JD = `Founding GTM hire to build the Legal go-to-market motion for an AI-native procurement platform. High-ownership sales role targeting U.S. enterprise legal buyers (GC/CFO level).

Requirements:
- 1-4 years in a high-performance environment (law, banking, consulting, startups, VC)
- Familiarity with the Legal sector
- Ambition to own outcomes, carry a number, build in new markets
- Strong presence with senior stakeholders (CFO/GC-level buyers)
- In-person Tuesday-Thursday`;

export function UploadStep({ onStart }: { onStart: (csv: string, title: string, desc: string, apiKey: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [jobTitle, setJobTitle] = useState("Founding GTM, Legal");
  const [jobDesc, setJobDesc] = useState(DEFAULT_JD);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 fade-in">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Match candidates to your role</h1>
        <p className="text-lg text-[var(--text-muted)]">Upload any CSV, describe the role, get AI-powered rankings.</p>
      </div>

      <div className="space-y-5">
        {/* CSV upload */}
        <div>
          <label className="block text-sm font-semibold mb-2">1. Candidate CSV</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragging ? "drop-active" : fileName ? "border-emerald-300 bg-emerald-50" : "border-[var(--border)] hover:border-[var(--border-light)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <input ref={fileRef} type="file" accept=".csv" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {fileName ? (
              <div className="space-y-1">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" className="mx-auto"><path d="M20 6 9 17l-5-5" /></svg>
                <p className="font-semibold text-[var(--green)]">{fileName}</p>
                <p className="text-sm text-[var(--text-muted)]">{rowCount} candidates detected</p>
              </div>
            ) : (
              <div className="space-y-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" className="mx-auto">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="font-semibold">Drop your CSV here, or click to browse</p>
                <p className="text-xs text-[var(--text-muted)]">Works with any CSV format</p>
              </div>
            )}
          </div>
        </div>

        {/* Job title */}
        <div>
          <label className="block text-sm font-semibold mb-2">2. Role title</label>
          <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]" />
        </div>

        {/* Job description */}
        <div>
          <label className="block text-sm font-semibold mb-2">3. Role description</label>
          <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} rows={6}
            className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]" />
        </div>

        {/* API key (optional) */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            OpenAI API Key <span className="font-normal text-[var(--text-muted)]">(optional — default key included)</span>
          </label>
          <div className="relative">
            <input type={showKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-proj-..."
              className="w-full rounded-xl border border-[var(--border)] px-4 py-3 pr-16 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]" />
            <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text)]">
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
                     transition-all shadow-sm hover:shadow-md mt-2"
        >
          Score {rowCount > 0 ? `${rowCount} candidates` : "candidates"} with AI
        </button>
      </div>
    </div>
  );
}

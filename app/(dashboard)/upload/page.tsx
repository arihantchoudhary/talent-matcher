"use client";

import { useState, useRef, DragEvent } from "react";

export default function UploadPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [scoring, setScoring] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRowCount(Math.max(0, text.split("\n").filter((l) => l.trim()).length - 1));
    };
    reader.readAsText(file);
  }

  function handleDrop(e: DragEvent) { e.preventDefault(); setDragging(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]); }

  function handleScore() {
    setScoring(true);
    // Simulate scoring (actual scoring uses the CLI script)
    setTimeout(() => { setScoring(false); setDone(true); }, 2000);
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Upload & Score</h1>
        <p className="text-sm text-zinc-500 mb-8">Upload a new CSV to score candidates against any role</p>

        {/* Upload */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 mb-6">
          <h2 className="font-semibold text-sm mb-3">Candidate CSV</h2>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragging ? "border-indigo-400 bg-indigo-50" : fileName ? "border-emerald-300 bg-emerald-50" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
            }`}
          >
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {fileName ? (
              <div>
                <div className="text-emerald-600 font-semibold">{fileName}</div>
                <div className="text-sm text-zinc-500 mt-1">{rowCount} candidates</div>
              </div>
            ) : (
              <div>
                <div className="font-medium text-sm">Drop CSV here or click to browse</div>
                <div className="text-xs text-zinc-400 mt-1">Any format — we auto-detect columns</div>
              </div>
            )}
          </div>
        </div>

        {/* Role */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 mb-6">
          <h2 className="font-semibold text-sm mb-3">Job Description</h2>
          <input type="text" defaultValue="Founding GTM, Legal" className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300" />
          <textarea rows={5} defaultValue="Build the Legal go-to-market motion for an AI-native procurement platform..." className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300" />
        </div>

        {/* Action */}
        <button
          onClick={handleScore}
          disabled={!fileName || scoring}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {scoring ? "Scoring..." : done ? "Done — view rankings" : `Score ${rowCount > 0 ? rowCount + " candidates" : "candidates"}`}
        </button>

        {done && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <p className="text-sm text-emerald-700 font-medium">Scoring complete!</p>
            <a href="/rankings" className="text-sm text-indigo-600 hover:text-indigo-800 mt-1 inline-block">View rankings &rarr;</a>
          </div>
        )}
      </div>
    </div>
  );
}

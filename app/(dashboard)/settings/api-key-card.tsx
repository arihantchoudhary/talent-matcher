"use client";

import { useState, useEffect } from "react";
import { getApiKey, saveApiKey } from "@/lib/api-key";

export function ApiKeyCard() {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => { setKey(getApiKey()); }, []);

  function handleSave() {
    saveApiKey(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      <h2 className="font-semibold mb-1">OpenAI API Key</h2>
      <p className="text-sm text-neutral-500 mb-3">Saved in this browser. Used for scoring requests. Falls back to our default key if empty.</p>
      <div className="flex gap-2 mb-2">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-proj-..."
          className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-300"
        />
        <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-black transition-colors shrink-0">
          {saved ? "Saved" : "Save"}
        </button>
      </div>
      {key && <p className="text-xs text-emerald-600 mb-2">Key saved — will be used for all scoring requests</p>}
      <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-900 hover:text-neutral-900 transition-colors">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
        Get an API key from platform.openai.com
      </a>
    </div>
  );
}

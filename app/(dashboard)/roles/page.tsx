"use client";

import { useState, useEffect } from "react";
import { CATEGORIES, CITIES, Role } from "@/lib/roles";
import { loadRoles, saveRoles } from "@/lib/roles-api";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  // Draft state for add/edit
  const [draft, setDraft] = useState<Role>({ title: "", description: "", category: "Sales", locations: [], remote: false, experience: "1-3yr" });

  useEffect(() => { loadRoles().then(setRoles); }, []);

  function handleSave() {
    if (!draft.title.trim()) return;
    const updated = [...roles];
    if (editing !== null) {
      updated[editing] = draft;
    } else {
      updated.push(draft);
    }
    setRoles(updated);
    saveRoles(updated);
    setEditing(null);
    setAdding(false);
    setDraft({ title: "", description: "", category: "Sales", locations: [], remote: false, experience: "1-3yr" });
  }

  function handleDelete(idx: number) {
    const updated = roles.filter((_, i) => i !== idx);
    setRoles(updated);
    saveRoles(updated);
  }

  function startEdit(idx: number) {
    setEditing(idx);
    setAdding(false);
    setDraft({ ...roles[idx] });
  }

  function startAdd() {
    setAdding(true);
    setEditing(null);
    setDraft({ title: "", description: "", category: "Sales", locations: [], remote: false, experience: "1-3yr" });
  }

  function handleReset() {
    // Save defaults back to API to clear custom roles
    import("@/lib/roles").then(({ ROLES }) => {
      setRoles(ROLES);
      saveRoles(ROLES);
    });
    setEditing(null);
    setAdding(false);
  }

  function toggleCity(city: string) {
    setDraft(prev => ({
      ...prev,
      locations: prev.locations.includes(city) ? prev.locations.filter(c => c !== city) : [...prev.locations, city],
    }));
  }

  const isEditing = editing !== null || adding;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Roles</h1>
            <p className="text-sm text-neutral-500 mt-0.5">{roles.length} role templates</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReset} className="px-3 py-2 rounded-lg text-xs font-medium border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition-colors">
              Reset to defaults
            </button>
            <button onClick={startAdd} className="px-4 py-2 rounded-lg text-xs font-medium bg-neutral-900 text-white hover:bg-black transition-colors">
              Add role
            </button>
          </div>
        </div>

        {/* Editor */}
        {isEditing && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-5 mb-6 fade-in">
            <h2 className="font-semibold text-sm mb-4">{editing !== null ? "Edit role" : "New role"}</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Title</label>
                <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-300" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Category</label>
                  <select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Experience</label>
                  <input value={draft.experience} onChange={e => setDraft({ ...draft, experience: e.target.value })}
                    placeholder="e.g. 2-5yr"
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-300" />
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-neutral-600 mb-1">Description</label>
              <textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })}
                rows={5} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white resize-none focus:outline-none focus:border-indigo-300" />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-neutral-600 mb-2">
                Locations
                <label className="inline-flex items-center gap-1.5 ml-4 font-normal">
                  <input type="checkbox" checked={draft.remote} onChange={e => setDraft({ ...draft, remote: e.target.checked })} className="rounded" />
                  <span className="text-xs">Remote OK</span>
                </label>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CITIES.map(city => (
                  <button key={city} onClick={() => toggleCity(city)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      draft.locations.includes(city) ? "bg-neutral-900 text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}>
                    {city}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="px-4 py-2 rounded-lg text-xs font-medium bg-neutral-900 text-white hover:bg-black">
                {editing !== null ? "Save changes" : "Add role"}
              </button>
              <button onClick={() => { setEditing(null); setAdding(false); }} className="px-4 py-2 rounded-lg text-xs font-medium border border-neutral-200 text-neutral-600 hover:bg-neutral-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Role list */}
        <div className="space-y-2">
          {roles.map((role, idx) => (
            <div key={idx} className="rounded-xl border border-neutral-200 bg-white p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">{role.category}</span>
                    <span className="font-semibold text-sm">{role.title}</span>
                    <span className="text-xs text-neutral-400">{role.experience}</span>
                    {role.remote && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Remote</span>}
                  </div>
                  <div className="flex gap-1 mb-2 flex-wrap">
                    {role.locations.slice(0, 5).map(l => (
                      <span key={l} className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">{l}</span>
                    ))}
                    {role.locations.length > 5 && <span className="text-[10px] text-neutral-400">+{role.locations.length - 5}</span>}
                  </div>
                  <p className="text-xs text-neutral-500 line-clamp-2">{role.description.split("\n")[0]}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(idx)} className="px-2.5 py-1.5 rounded-lg text-xs text-neutral-500 hover:bg-neutral-50 border border-neutral-200 transition-colors">Edit</button>
                  <button onClick={() => handleDelete(idx)} className="px-2.5 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-red-500 hover:bg-red-50 border border-neutral-200 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

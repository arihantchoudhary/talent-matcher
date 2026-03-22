"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";

export function CustomUserButton() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  const name = user.fullName || user.primaryEmailAddress?.emailAddress || "User";
  const email = user.primaryEmailAddress?.emailAddress || "";
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 hover:bg-neutral-50 rounded-lg px-2 py-1.5 transition-colors w-full text-left"
      >
        {user.imageUrl ? (
          <img src={user.imageUrl} alt={name} className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] font-semibold text-neutral-600">
            {initials}
          </div>
        )}
        <span className="text-xs font-medium text-neutral-700 truncate">{name.split(" ")[0]}</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-56 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-50 fade-in">
          <div className="px-4 py-3 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
              {user.imageUrl ? (
                <img src={user.imageUrl} alt={name} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-600">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">{name}</p>
                <p className="text-xs text-neutral-500 truncate">{email}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full text-left px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors flex items-center gap-2.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

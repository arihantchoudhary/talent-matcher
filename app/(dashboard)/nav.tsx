"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScoringContext } from "@/lib/scoring-context";

const LINKS = [
  { href: "/upload", label: "New Match" },
  { href: "/stable-match", label: "Stable Match" },
  { href: "/rankings", label: "History" },
  { href: "/roles", label: "Roles" },
  { href: "/settings", label: "Settings" },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { isScoring, progress } = useScoringContext();

  return (
    <nav className="flex md:flex-col md:flex-1 md:py-3 md:px-3 md:space-y-0.5 overflow-x-auto px-2 py-2 gap-1 md:gap-0">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 px-3 py-2 rounded text-sm transition-colors whitespace-nowrap ${
              active ? "bg-neutral-100 text-neutral-900 font-medium" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
            }`}
          >
            {link.label}
          </Link>
        );
      })}

      {/* Scoring indicator */}
      {isScoring && (
        <div className="shrink-0 md:mt-3 px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neutral-900 animate-pulse" />
            <span className="text-xs text-neutral-500">{progress.done}/{progress.total}</span>
          </div>
          <div className="h-1 bg-neutral-100 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-neutral-900 rounded-full transition-all" style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }} />
          </div>
        </div>
      )}
    </nav>
  );
}

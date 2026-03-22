"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/upload", label: "New Match" },
  { href: "/stable-match", label: "Stable Match" },
  { href: "/rankings", label: "History" },
  { href: "/roles", label: "Roles" },
  { href: "/settings", label: "Settings" },
];

export function DashboardNav() {
  const pathname = usePathname();

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
    </nav>
  );
}

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { DashboardNav } from "./nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-zinc-200 bg-white flex flex-col">
        <div className="p-4 border-b border-zinc-100">
          <Link href="/rankings" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">T</div>
            <span className="font-bold text-sm">Talent Matcher</span>
          </Link>
        </div>
        <DashboardNav />
        <div className="mt-auto p-4 border-t border-zinc-100">
          <UserButton />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}

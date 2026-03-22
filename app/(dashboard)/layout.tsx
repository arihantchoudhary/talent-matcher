import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { DashboardNav } from "./nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex overflow-hidden">
      <aside className="w-52 shrink-0 border-r border-neutral-200 bg-white flex flex-col h-screen">
        <div className="px-5 py-4 border-b border-neutral-100">
          <Link href="/upload" className="text-sm font-semibold tracking-tight">Talent Matcher</Link>
        </div>
        <DashboardNav />
        <div className="mt-auto px-5 py-4 border-t border-neutral-100">
          <UserButton />
        </div>
      </aside>
      <div className="flex-1 overflow-y-auto bg-neutral-50">
        {children}
      </div>
    </div>
  );
}

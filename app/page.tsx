import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function LandingPage() {
  const { userId } = await auth();
  const loggedIn = !!userId;

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">T</div>
            <span className="font-bold">Talent Matcher</span>
          </div>
          {loggedIn ? (
            <Link href="/rankings" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
              Dashboard
            </Link>
          ) : (
            <div className="flex gap-2">
              <Link href="/sign-in" className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Sign in</Link>
              <Link href="/sign-up" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">Get started</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-6">AI-powered matching</div>
          <h1 className="text-5xl font-bold tracking-tight mb-6 leading-[1.1]">
            Match candidates to roles<br /><span className="text-indigo-600">in seconds, not weeks</span>
          </h1>
          <p className="text-lg text-zinc-500 max-w-xl mx-auto mb-10">
            Upload your candidate CSV, score them against any job description with GPT-4o, and export your shortlist. Built for recruiting teams.
          </p>
          <Link href={loggedIn ? "/rankings" : "/sign-up"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
            {loggedIn ? "Go to dashboard" : "Start matching free"}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: "1", t: "Upload CSV", d: "Drop any candidate CSV — we auto-detect names, LinkedIn URLs, and all fields." },
              { n: "2", t: "AI scores candidates", d: "GPT-4o-mini evaluates each candidate 0-100 against your role with specific reasoning." },
              { n: "3", t: "Export shortlist", d: "Browse ranked results, shortlist your picks, download CSV or JSON for interviews." },
            ].map((s) => (
              <div key={s.n} className="bg-white rounded-2xl border border-zinc-200 p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center mx-auto mb-4">{s.n}</div>
                <h3 className="font-semibold mb-2">{s.t}</h3>
                <p className="text-sm text-zinc-500">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {[
            { t: "Any CSV format", d: "No rigid templates. Auto-detects columns from any export — ATS, LinkedIn, spreadsheets." },
            { t: "LinkedIn enrichment", d: "If your CSV has LinkedIn URLs, we pull profiles, photos, and experience data." },
            { t: "Detailed reasoning", d: "Every score comes with highlights (strengths) and gaps, not just a number." },
            { t: "Real-time scoring", d: "Watch results stream in live as GPT-4o-mini processes each candidate." },
          ].map((f) => (
            <div key={f.t} className="border border-zinc-200 rounded-xl p-5 bg-white">
              <h3 className="font-semibold mb-1">{f.t}</h3>
              <p className="text-sm text-zinc-500">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6 text-center text-xs text-zinc-400">
        Talent Matcher &middot; Powered by GPT-4o-mini
      </footer>
    </div>
  );
}

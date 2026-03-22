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

      {/* Pricing */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Simple pricing</h2>
          <p className="text-sm text-zinc-500 text-center mb-10">Start free. Upgrade when you need more.</p>
          <div className="grid md:grid-cols-3 gap-4">
            <PriceCard
              tier="Free" price="$0" period="forever" current
              features={["50 AI scores/month", "1 active role", "CSV export", "LinkedIn enrichment"]}
            />
            <PriceCard
              tier="Pro" price="$49" period="/mo per seat" popular
              features={["500 AI scores/month", "Unlimited roles", "CSV + JSON export", "LinkedIn enrichment", "Team collaboration (5 seats)", "Priority scoring queue"]}
            />
            <PriceCard
              tier="Enterprise" price="Custom" period="contact sales"
              features={["Unlimited scores", "Unlimited roles + cities", "ATS integrations (Greenhouse, Lever)", "Custom AI models", "SSO + SAML", "Dedicated support + SLA"]}
            />
          </div>
        </div>
      </section>

      {/* Competitor comparison */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">How we compare</h2>
          <p className="text-sm text-zinc-500 text-center mb-10">vs. enterprise talent intelligence platforms</p>
          <div className="rounded-xl border border-zinc-200 bg-white overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-4 py-3 font-semibold">Feature</th>
                  <th className="text-center px-4 py-3 font-semibold text-indigo-600">Talent Matcher</th>
                  <th className="text-center px-4 py-3 font-semibold text-zinc-400">Eightfold AI</th>
                  <th className="text-center px-4 py-3 font-semibold text-zinc-400">Beamery</th>
                  <th className="text-center px-4 py-3 font-semibold text-zinc-400">HiredScore</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <CRow f="Pricing" us="From $0/mo" c1="Enterprise only" c2="Enterprise only" c3="Custom (Workday)" />
                <CRow f="Setup time" us="< 1 minute" c1="Weeks" c2="Weeks" c3="Weeks" />
                <CRow f="Any CSV import" us="Yes" c1="No" c2="No" c3="No" />
                <CRow f="AI scoring model" us="GPT-4o (transparent)" c1="Proprietary" c2="Proprietary" c3="Proprietary" />
                <CRow f="Reasoning per candidate" us="Yes — highlights + gaps" c1="Match % only" c2="Engagement score" c3="Letter grade" />
                <CRow f="LinkedIn enrichment" us="Yes" c1="Yes" c2="Yes" c3="Limited" />
                <CRow f="Role templates" us="30+ built-in" c1="Custom only" c2="Custom only" c3="Custom only" />
                <CRow f="Self-serve signup" us="Yes" c1="No" c2="No" c3="No" />
                <CRow f="Export" us="CSV + JSON" c1="Limited" c2="Limited" c3="Via Workday" />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to match?</h2>
          <p className="text-sm text-zinc-500 mb-6">Free to start. No credit card required.</p>
          <Link href={loggedIn ? "/rankings" : "/sign-up"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors">
            {loggedIn ? "Go to dashboard" : "Get started free"}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6 text-center text-xs text-zinc-400">
        Talent Matcher &middot; Powered by GPT-4o-mini
      </footer>
    </div>
  );
}

function Chk() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" className="shrink-0"><path d="M20 6 9 17l-5-5" /></svg>;
}

function PriceCard({ tier, price, period, features, popular, current }: {
  tier: string; price: string; period: string; features: string[]; popular?: boolean; current?: boolean;
}) {
  return (
    <div className={`rounded-xl p-6 bg-white relative ${popular ? "border-2 border-indigo-600 shadow-md" : "border border-zinc-200"}`}>
      {popular && <div className="absolute -top-3 left-4 px-2.5 py-0.5 bg-indigo-600 text-white text-xs font-semibold rounded-full">Most popular</div>}
      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{tier}</div>
      <div className="text-3xl font-bold mb-0.5">{price}</div>
      <div className="text-xs text-zinc-500 mb-5">{period}</div>
      <ul className="space-y-2.5 text-sm text-zinc-600 mb-6">
        {features.map((f) => <li key={f} className="flex items-center gap-2"><Chk />{f}</li>)}
      </ul>
      {current ? (
        <div className="py-2.5 rounded-lg bg-zinc-100 text-center text-sm font-medium text-zinc-500">Current plan</div>
      ) : popular ? (
        <button className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">Get started</button>
      ) : (
        <button className="w-full py-2.5 rounded-lg border border-zinc-200 text-sm font-medium hover:bg-zinc-50 transition-colors">Contact sales</button>
      )}
    </div>
  );
}

function CRow({ f, us, c1, c2, c3 }: { f: string; us: string; c1: string; c2: string; c3: string }) {
  return (
    <tr>
      <td className="px-4 py-2.5 font-medium">{f}</td>
      <td className="px-4 py-2.5 text-center text-indigo-600 font-medium">{us}</td>
      <td className="px-4 py-2.5 text-center text-zinc-400">{c1}</td>
      <td className="px-4 py-2.5 text-center text-zinc-400">{c2}</td>
      <td className="px-4 py-2.5 text-center text-zinc-400">{c3}</td>
    </tr>
  );
}

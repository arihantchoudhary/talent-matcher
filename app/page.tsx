import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function LandingPage() {
  const { userId } = await auth();
  const loggedIn = !!userId;

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">Talent Matcher</span>
          <div className="flex items-center gap-4">
            {loggedIn ? (
              <Link href="/upload" className="text-sm font-medium hover:underline underline-offset-4">Dashboard</Link>
            ) : (
              <>
                <Link href="/sign-in" className="text-sm text-neutral-500 hover:text-neutral-900 py-2">Sign in</Link>
                <Link href="/sign-up" className="text-sm font-medium bg-neutral-900 text-white px-4 py-2 rounded-md hover:bg-black transition-colors">Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero — asymmetric layout */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-8" style={{ animation: "fadeIn 0.6s ease-out 0.1s both" }}>AI-powered talent matching</p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-normal leading-[1.05] mb-6 italic" style={{ animation: "fadeIn 0.8s ease-out 0.2s both" }}>
              Score 93 candidates<br />in four minutes.
            </h1>
            <p className="text-lg text-neutral-600 leading-relaxed max-w-xl mb-10" style={{ animation: "fadeIn 0.6s ease-out 0.5s both" }}>
              Upload a CSV. Pick a role. GPT-4o reads every resume and scores each candidate with reasoning, strengths, and gaps.
            </p>
            <div className="flex items-center gap-6" style={{ animation: "fadeIn 0.6s ease-out 0.7s both" }}>
              <Link href={loggedIn ? "/upload" : "/sign-up"}
                className="text-base font-medium bg-neutral-900 text-white px-8 py-3.5 rounded-md hover:bg-black transition-colors">
                {loggedIn ? "Go to dashboard" : "Try it free"}
              </Link>
              <span className="text-sm text-neutral-400">No credit card required</span>
            </div>
          </div>

          {/* Product preview */}
          <div className="mt-16 scroll-fade" style={{ animation: "fadeIn 0.8s ease-out 0.9s both" }}>
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              {/* Browser chrome */}
              <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                </div>
                <div className="ml-4 bg-white border border-neutral-200 rounded px-3 py-0.5 text-xs text-neutral-400 flex-1 max-w-sm">talent-matcher-seven.vercel.app</div>
              </div>
              {/* App content mock */}
              <div className="bg-white p-6 md:p-8">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs uppercase tracking-wider text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded">Sales</span>
                  <h3 className="text-xl md:text-2xl font-serif italic">Founding GTM, Legal</h3>
                </div>
                <p className="text-xs text-neutral-400 mb-6">93 candidates scored · takehome-assessment.csv · 3/22/2026</p>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="border border-neutral-200 rounded p-3">
                    <p className="text-2xl font-semibold">93</p>
                    <p className="text-xs text-neutral-500">Total</p>
                  </div>
                  <div className="border border-neutral-200 rounded p-3">
                    <p className="text-2xl font-semibold">58</p>
                    <p className="text-xs text-neutral-500">Avg Score</p>
                  </div>
                  <div className="border border-neutral-200 rounded p-3 bg-neutral-900 text-white">
                    <p className="text-2xl font-semibold">13</p>
                    <p className="text-xs text-neutral-400">Top Tier</p>
                  </div>
                  <div className="border border-neutral-200 rounded p-3">
                    <p className="text-2xl font-semibold">62</p>
                    <p className="text-xs text-neutral-500">Good Fit</p>
                  </div>
                </div>

                {/* Candidate rows */}
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Top Tier (70+)</p>
                <div className="space-y-2">
                  {[
                    { init: "G", name: "Geovanny Morales", score: 75, reason: "Relevant experience in business development and legal assistance. Strong stakeholder management..." },
                    { init: "T", name: "Tim Nguyen", score: 75, reason: "Relevant sales experience with strong track record. Lacks direct legal industry exposure..." },
                    { init: "D", name: "Dhanush S.", score: 75, reason: "Relevant GTM experience. Strong sales background and stakeholder engagement skills..." },
                  ].map((c) => (
                    <div key={c.name} className="flex items-center gap-3 border border-neutral-100 rounded p-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-medium text-neutral-600 shrink-0">{c.init}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{c.name}</span>
                          <span className="text-xs font-mono bg-neutral-900 text-white px-1.5 py-0.5 rounded">{c.score}</span>
                        </div>
                        <p className="text-xs text-neutral-500 truncate">{c.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — no divider above, different rhythm */}
      <section id="how" className="py-20 px-6 bg-neutral-50">
        <div className="max-w-4xl mx-auto scroll-fade">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4">Process</p>
          <h2 className="text-2xl md:text-3xl font-serif italic mb-12">Three steps to your shortlist.</h2>
          <div className="grid md:grid-cols-3 gap-12 scroll-stagger">
            {[
              { n: "01", t: "Upload", d: "Drop any CSV of candidates. We parse every format — ATS exports, LinkedIn, spreadsheets. No templates required." },
              { n: "02", t: "Match", d: "GPT-4o scores each candidate against your role description. You get a score, reasoning, strengths, and gaps for every person." },
              { n: "03", t: "Export", d: "Review the ranked list. Shortlist your picks. Download CSV or JSON for your ATS or interview pipeline." },
            ].map((s) => (
              <div key={s.n}>
                <span className="text-2xl font-serif italic text-neutral-300">{s.n}</span>
                <h3 className="text-lg font-semibold mt-3 mb-2">{s.t}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — asymmetric: heading left, grid right */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto scroll-fade">
          <div className="md:grid md:grid-cols-[1fr_2fr] md:gap-16">
            <div className="mb-10 md:mb-0">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4">Capabilities</p>
              <h2 className="text-2xl md:text-3xl font-serif italic">Built for recruiting at scale.</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-8 scroll-stagger">
              {[
                { t: "Any CSV format", d: "No rigid templates. Auto-detects names, LinkedIn URLs, and fields from any export." },
                { t: "LinkedIn enrichment", d: "If your CSV has LinkedIn URLs, we pull full profiles — experience, education, skills, photos." },
                { t: "Scored reasoning", d: "Every candidate gets a score with specific strengths and gaps. Not just a number." },
                { t: "Stable matching", d: "Multiple open roles? Gale-Shapley algorithm optimally assigns candidates across all positions." },
                { t: "Session history", d: "Every match is saved. Review past sessions, compare runs, track candidate pipelines." },
                { t: "Role templates", d: "20 built-in roles across Sales, GTM, Engineering, Product, Finance. Add your own." },
              ].map((f, i) => (
                <div key={f.t}>
                  <span className="text-xs font-mono text-neutral-300">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-base font-semibold mt-1 mb-1">{f.t}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing — tighter spacing */}
      <section className="py-20 px-6 bg-neutral-50">
        <div className="max-w-4xl mx-auto scroll-fade">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4">Pricing</p>
          <h2 className="text-2xl md:text-3xl font-serif italic mb-10">Simple, transparent pricing.</h2>
          <div className="grid md:grid-cols-3 gap-6 scroll-stagger">
            <PriceCard tier="Free" price="$0" period="forever" features={["50 scores/month", "1 role", "CSV export", "LinkedIn enrichment"]} />
            <PriceCard tier="Pro" price="$49" period="/month" featured features={["500 scores/month", "Unlimited roles", "Stable matching", "Team seats (5)", "Priority scoring"]} />
            <PriceCard tier="Enterprise" price="Custom" period="contact us" features={["Unlimited scores", "ATS integrations", "Custom models", "SSO + SAML", "Dedicated support"]} />
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto scroll-fade">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4">Comparison</p>
          <h2 className="text-2xl md:text-3xl font-serif italic mb-10">How we compare.</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-neutral-900">
                  <th className="text-left py-3 font-semibold">Feature</th>
                  <th className="text-center py-3 font-semibold">Talent Matcher</th>
                  <th className="text-center py-3 text-neutral-400">Eightfold AI</th>
                  <th className="text-center py-3 text-neutral-400">Beamery</th>
                  <th className="text-center py-3 text-neutral-400">HiredScore</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                <CRow f="Pricing" us="From $0" c1="Enterprise" c2="Enterprise" c3="Custom" />
                <CRow f="Setup" us="< 1 minute" c1="Weeks" c2="Weeks" c3="Weeks" />
                <CRow f="Any CSV import" us="Yes" c1="No" c2="No" c3="No" />
                <CRow f="AI reasoning" us="Per candidate" c1="Match %" c2="Score" c3="Grade" />
                <CRow f="Stable matching" us="Gale-Shapley" c1="No" c2="No" c3="No" />
                <CRow f="Self-serve" us="Yes" c1="No" c2="No" c3="No" />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA — left-aligned, not centered */}
      <section className="py-20 px-6 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto scroll-fade md:flex md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif italic mb-2">Ready to match?</h2>
            <p className="text-neutral-400">Free to start. No credit card.</p>
          </div>
          <Link href={loggedIn ? "/upload" : "/sign-up"}
            className="inline-block mt-6 md:mt-0 text-sm font-medium bg-white text-neutral-900 px-6 py-3 rounded-md hover:bg-neutral-100 transition-colors">
            {loggedIn ? "Go to dashboard" : "Get started free"}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-neutral-400">
          <span className="font-serif italic">Talent Matcher</span>
          <span>Powered by GPT-4o</span>
        </div>
      </footer>
    </div>
  );
}

function PriceCard({ tier, price, period, features, featured }: { tier: string; price: string; period: string; features: string[]; featured?: boolean }) {
  return (
    <div className={`p-6 ${featured ? "border-2 border-neutral-900 bg-neutral-950 text-white relative" : "border border-neutral-200"}`}>
      {featured && <span className="absolute top-0 right-0 text-[10px] uppercase tracking-wider bg-neutral-900 text-neutral-400 px-2 py-1 border-l border-b border-neutral-700">Most popular</span>}
      <p className={`text-xs uppercase tracking-[0.15em] mb-3 text-neutral-400`}>{tier}</p>
      <p className="text-3xl font-semibold mb-0.5">{price}</p>
      <p className={`text-xs mb-6 ${featured ? "text-neutral-500" : "text-neutral-400"}`}>{period}</p>
      <ul className="space-y-2">
        {features.map((f) => (
          <li key={f} className={`text-sm flex items-center gap-2 ${featured ? "text-neutral-300" : "text-neutral-600"}`}>
            <span className="text-xs opacity-40">—</span> {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CRow({ f, us, c1, c2, c3 }: { f: string; us: string; c1: string; c2: string; c3: string }) {
  return (
    <tr>
      <td className="py-2.5 font-medium">{f}</td>
      <td className="py-2.5 text-center font-medium">{us}</td>
      <td className="py-2.5 text-center text-neutral-300">{c1}</td>
      <td className="py-2.5 text-center text-neutral-300">{c2}</td>
      <td className="py-2.5 text-center text-neutral-300">{c3}</td>
    </tr>
  );
}

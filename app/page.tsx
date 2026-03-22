import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function LandingPage() {
  const { userId } = await auth();
  const loggedIn = !!userId;
  const cta = loggedIn ? "/upload" : "/sign-up";
  const ctaLabel = loggedIn ? "Go to dashboard" : "Try it free";

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">Talent Matcher</span>
          <div className="flex items-center gap-3">
            {loggedIn ? (
              <Link href="/upload" className="text-sm font-medium hover:underline underline-offset-4 py-3">Dashboard</Link>
            ) : (
              <>
                <Link href="/sign-in" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors py-3 px-2">Sign in</Link>
                <Link href="/sign-up" className="text-sm font-medium bg-neutral-900 text-white px-4 py-3 rounded-md hover:bg-neutral-800 active:bg-black transition-colors">Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero — asymmetric, specific headline */}
      <section className="pt-20 md:pt-28 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-6" style={{ animation: "fadeIn 0.6s ease-out 0.1s both" }}>AI-powered talent matching</p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-normal leading-[1.05] mb-6 italic" style={{ animation: "fadeIn 0.8s ease-out 0.2s both" }}>
              Score 93 candidates<br />in four minutes.
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-xl mb-10" style={{ animation: "fadeIn 0.6s ease-out 0.5s both" }}>
              Upload a CSV. Pick a role. GPT-4o reads every resume and scores each candidate with reasoning, strengths, and gaps.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6" style={{ animation: "fadeIn 0.6s ease-out 0.7s both" }}>
              <Link href={cta}
                className="text-base font-medium bg-neutral-900 text-white px-8 py-3.5 rounded-md hover:bg-neutral-800 active:bg-black transition-colors text-center">
                {ctaLabel}
              </Link>
              <span className="text-sm text-neutral-400">No credit card required</span>
            </div>
          </div>

          {/* Product preview — browser mockup */}
          <div className="mt-14 md:mt-20" style={{ animation: "fadeIn 0.8s ease-out 0.9s both" }}>
            <div className="border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
              {/* Browser chrome */}
              <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                </div>
                <div className="ml-4 bg-white border border-neutral-200 rounded px-3 py-0.5 text-xs text-neutral-400 flex-1 max-w-sm hidden sm:block">talent-matcher-seven.vercel.app</div>
              </div>
              {/* App content mock */}
              <div className="bg-white p-4 sm:p-6 md:p-8">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs uppercase tracking-wider text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded">Sales</span>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-serif italic">Founding GTM, Legal</h3>
                </div>
                <p className="text-xs text-neutral-400 mb-4 sm:mb-6">93 candidates scored · takehome-assessment.csv · 3/22/2026</p>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="border border-neutral-200 rounded p-2.5 sm:p-3">
                    <p className="text-xl sm:text-2xl font-semibold tabular-nums">93</p>
                    <p className="text-xs text-neutral-500">Total</p>
                  </div>
                  <div className="border border-neutral-200 rounded p-2.5 sm:p-3">
                    <p className="text-xl sm:text-2xl font-semibold tabular-nums">58</p>
                    <p className="text-xs text-neutral-500">Avg Score</p>
                  </div>
                  <div className="border border-neutral-200 rounded p-2.5 sm:p-3 bg-neutral-900 text-white">
                    <p className="text-xl sm:text-2xl font-semibold tabular-nums">13</p>
                    <p className="text-xs text-neutral-400">Top Tier</p>
                  </div>
                  <div className="border border-neutral-200 rounded p-2.5 sm:p-3">
                    <p className="text-xl sm:text-2xl font-semibold tabular-nums">62</p>
                    <p className="text-xs text-neutral-500">Good Fit</p>
                  </div>
                </div>

                {/* Candidate rows */}
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2 sm:mb-3">Top Tier (70+)</p>
                <div className="space-y-1.5 sm:space-y-2">
                  {[
                    { init: "G", name: "Geovanny Morales", score: 75, reason: "Relevant experience in business development and legal assistance. Strong stakeholder management..." },
                    { init: "T", name: "Tim Nguyen", score: 75, reason: "Relevant sales experience with strong track record. Lacks direct legal industry exposure..." },
                    { init: "D", name: "Dhanush S.", score: 75, reason: "Relevant GTM experience. Strong sales background and stakeholder engagement skills..." },
                  ].map((c) => (
                    <div key={c.name} className="flex items-center gap-3 border border-neutral-100 rounded p-2.5 sm:p-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-medium text-neutral-600 shrink-0">{c.init}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{c.name}</span>
                          <span className="text-xs font-mono bg-neutral-900 text-white px-1.5 py-0.5 rounded tabular-nums">{c.score}</span>
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

      {/* How it works — staggered layout, not symmetric 3-col */}
      <section id="how" className="py-20 md:py-24 px-6 bg-neutral-50">
        <div className="max-w-4xl mx-auto scroll-fade">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4">How it works</p>
          <h2 className="text-2xl md:text-3xl font-serif italic mb-14">Three steps to your shortlist.</h2>
          <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-[1fr_1px_1fr_1px_1fr] md:gap-0 scroll-stagger">
            {[
              { n: "01", t: "Upload", d: "Drop any CSV of candidates. We parse every format — ATS exports, LinkedIn, spreadsheets. No templates required." },
              { n: "02", t: "Match", d: "GPT-4o scores each candidate against your role description. You get a score, reasoning, strengths, and gaps for every person." },
              { n: "03", t: "Export", d: "Review the ranked list. Shortlist your picks. Download CSV or JSON for your ATS or interview pipeline." },
            ].flatMap((s, i) => {
              const step = (
                <div key={s.n} className="md:px-8 first:md:pl-0 last:md:pr-0">
                  <span className="text-3xl font-serif italic text-neutral-200">{s.n}</span>
                  <h3 className="text-lg font-semibold mt-3 mb-2">{s.t}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{s.d}</p>
                </div>
              );
              if (i < 2) return [step, <div key={`sep-${i}`} className="hidden md:block bg-neutral-200" />];
              return [step];
            })}
          </div>
        </div>
      </section>

      {/* Features — asymmetric: heading left, grid right */}
      <section className="py-24 md:py-28 px-6">
        <div className="max-w-5xl mx-auto scroll-fade">
          <div className="md:grid md:grid-cols-[1fr_2fr] md:gap-16">
            <div className="mb-10 md:mb-0 md:sticky md:top-24 md:self-start">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4">Capabilities</p>
              <h2 className="text-2xl md:text-3xl font-serif italic mb-4">Built for recruiting at scale.</h2>
              <p className="text-sm text-neutral-500 leading-relaxed hidden md:block">Everything you need to go from raw CSV to ranked shortlist.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10 scroll-stagger">
              {[
                { t: "Any CSV format", d: "No rigid templates. Auto-detects names, LinkedIn URLs, and fields from any export." },
                { t: "LinkedIn enrichment", d: "If your CSV has LinkedIn URLs, we pull full profiles — experience, education, skills, photos." },
                { t: "Scored reasoning", d: "Every candidate gets a score with specific strengths and gaps. Not just a number." },
                { t: "Stable matching", d: "Multiple open roles? Gale-Shapley algorithm optimally assigns candidates across all positions." },
                { t: "Session history", d: "Every match is saved. Review past sessions, compare runs, track candidate pipelines." },
                { t: "Role templates", d: "20 built-in roles across Sales, GTM, Engineering, Product, Finance. Add your own." },
              ].map((f, i) => (
                <div key={f.t} className="group">
                  <span className="text-xs font-mono text-neutral-300 group-hover:text-neutral-500 transition-colors">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-base font-semibold mt-1.5 mb-1.5">{f.t}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 md:py-24 px-6 bg-neutral-50">
        <div className="max-w-4xl mx-auto scroll-fade">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4">Pricing</p>
          <h2 className="text-2xl md:text-3xl font-serif italic mb-4">Simple, transparent pricing.</h2>
          <p className="text-sm text-neutral-500 mb-10">Start free. Upgrade when you need more.</p>
          <div className="grid md:grid-cols-3 gap-4 md:gap-0 scroll-stagger">
            <PriceCard tier="Free" price="$0" period="forever" features={["50 scores/month", "1 role", "CSV export", "LinkedIn enrichment"]} position="first" />
            <PriceCard tier="Pro" price="$49" period="/month" featured features={["500 scores/month", "Unlimited roles", "Stable matching", "Team seats (5)", "Priority scoring"]} position="middle" />
            <PriceCard tier="Enterprise" price="Custom" period="contact us" features={["Unlimited scores", "ATS integrations", "Custom models", "SSO + SAML", "Dedicated support"]} position="last" />
          </div>
        </div>
      </section>

      {/* Comparison — checkmarks for wins */}
      <section className="py-20 md:py-24 px-6">
        <div className="max-w-4xl mx-auto scroll-fade">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4">Comparison</p>
          <h2 className="text-2xl md:text-3xl font-serif italic mb-10">How we compare.</h2>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-neutral-900">
                  <th className="text-left py-3 font-semibold">Feature</th>
                  <th className="text-center py-3 font-semibold">Talent Matcher</th>
                  <th className="text-center py-3 text-neutral-400 font-normal">Eightfold AI</th>
                  <th className="text-center py-3 text-neutral-400 font-normal">Beamery</th>
                  <th className="text-center py-3 text-neutral-400 font-normal">HiredScore</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                <CRow f="Pricing" us="From $0" c1="Enterprise" c2="Enterprise" c3="Custom" usWin />
                <CRow f="Setup" us="< 1 minute" c1="Weeks" c2="Weeks" c3="Weeks" usWin />
                <CRow f="Any CSV import" us="Yes" c1="No" c2="No" c3="No" usWin />
                <CRow f="AI reasoning" us="Per candidate" c1="Match %" c2="Score" c3="Grade" usWin />
                <CRow f="Stable matching" us="Gale-Shapley" c1="No" c2="No" c3="No" usWin />
                <CRow f="Self-serve" us="Yes" c1="No" c2="No" c3="No" usWin />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA — left-aligned, not centered */}
      <section className="py-16 md:py-20 px-6 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto scroll-fade md:flex md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif italic mb-2">Ready to match?</h2>
            <p className="text-neutral-500">Free to start. No credit card.</p>
          </div>
          <Link href={cta}
            className="inline-block mt-6 md:mt-0 text-sm font-medium bg-white text-neutral-900 px-6 py-3 rounded-md hover:bg-neutral-100 active:bg-neutral-200 transition-colors">
            {loggedIn ? "Go to dashboard" : "Get started free"}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-neutral-400">
          <span className="font-serif italic">Talent Matcher</span>
          <span>Powered by GPT-4o</span>
        </div>
      </footer>
    </div>
  );
}

function PriceCard({ tier, price, period, features, featured, position }: { tier: string; price: string; period: string; features: string[]; featured?: boolean; position: "first" | "middle" | "last" }) {
  const base = featured
    ? "border-2 border-neutral-900 bg-neutral-950 text-white relative z-10 md:-my-2"
    : "border border-neutral-200 bg-white";
  const corners = position === "first"
    ? "rounded-lg md:rounded-r-none"
    : position === "last"
    ? "rounded-lg md:rounded-l-none"
    : "rounded-lg md:rounded-none";

  return (
    <div className={`p-6 md:p-8 ${base} ${corners} transition-shadow hover:shadow-md`}>
      {featured && <span className="absolute -top-3 right-4 text-[10px] uppercase tracking-wider bg-neutral-900 text-neutral-300 px-3 py-1 border border-neutral-700 rounded-full">Most popular</span>}
      <p className="text-xs uppercase tracking-[0.15em] mb-3 text-neutral-400">{tier}</p>
      <p className="text-4xl font-semibold mb-0.5 tabular-nums">{price}</p>
      <p className={`text-xs mb-8 ${featured ? "text-neutral-500" : "text-neutral-400"}`}>{period}</p>
      <ul className="space-y-3">
        {features.map((f) => (
          <li key={f} className={`text-sm flex items-start gap-2.5 ${featured ? "text-neutral-300" : "text-neutral-600"}`}>
            <svg className={`w-4 h-4 mt-0.5 shrink-0 ${featured ? "text-neutral-500" : "text-neutral-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CRow({ f, us, c1, c2, c3, usWin }: { f: string; us: string; c1: string; c2: string; c3: string; usWin?: boolean }) {
  return (
    <tr className="group hover:bg-neutral-50 transition-colors">
      <td className="py-3 font-medium">{f}</td>
      <td className={`py-3 text-center ${usWin ? "font-semibold" : "font-medium"}`}>{us}</td>
      <td className="py-3 text-center text-neutral-300">{c1}</td>
      <td className="py-3 text-center text-neutral-300">{c2}</td>
      <td className="py-3 text-center text-neutral-300">{c3}</td>
    </tr>
  );
}

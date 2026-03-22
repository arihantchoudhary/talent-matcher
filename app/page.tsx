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
                <Link href="/sign-in" className="text-sm text-neutral-500 hover:text-neutral-900">Sign in</Link>
                <Link href="/sign-up" className="text-sm font-medium bg-neutral-900 text-white px-4 py-1.5 rounded-md hover:bg-black transition-colors">Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-28 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-400 mb-8">AI-powered talent matching</p>
          <h1 className="text-6xl md:text-8xl font-serif font-normal leading-[1.05] mb-8 italic">
            The right candidate<br />for every role.
          </h1>
          <p className="text-xl md:text-2xl text-neutral-400 leading-relaxed max-w-2xl mb-12">
            Upload your candidates. Define the role. Our matching engine scores, ranks, and explains every fit — so you hire with confidence.
          </p>
          <div className="flex items-center gap-6">
            <Link href={loggedIn ? "/upload" : "/sign-up"}
              className="text-base font-medium bg-neutral-900 text-white px-8 py-3.5 rounded-md hover:bg-black transition-colors">
              {loggedIn ? "Go to dashboard" : "Start matching"}
            </Link>
            <Link href="#how" className="text-base text-neutral-500 hover:text-neutral-900 underline underline-offset-4">
              How it works
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6"><div className="border-t border-neutral-200" /></div>

      {/* How it works */}
      <section id="how" className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-4">Process</p>
          <h2 className="text-4xl md:text-5xl font-serif italic mb-14">Three steps to your shortlist.</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { n: "01", t: "Upload", d: "Drop any CSV of candidates. We parse every format — ATS exports, LinkedIn, spreadsheets. No templates required." },
              { n: "02", t: "Match", d: "GPT-4o scores each candidate against your role description. You get a score, reasoning, strengths, and gaps for every person." },
              { n: "03", t: "Export", d: "Review the ranked list. Shortlist your picks. Download CSV or JSON for your ATS or interview pipeline." },
            ].map((s) => (
              <div key={s.n}>
                <span className="text-xs text-neutral-300 font-mono">{s.n}</span>
                <h3 className="text-lg font-semibold mt-2 mb-2">{s.t}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6"><div className="border-t border-neutral-200" /></div>

      {/* Features */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-4">Capabilities</p>
          <h2 className="text-4xl md:text-5xl font-serif italic mb-14">Built for recruiting at scale.</h2>
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-8">
            {[
              { t: "Any CSV format", d: "No rigid templates. Auto-detects names, LinkedIn URLs, and fields from any export." },
              { t: "LinkedIn enrichment", d: "If your CSV has LinkedIn URLs, we pull full profiles — experience, education, skills, photos." },
              { t: "Scored reasoning", d: "Every candidate gets a score with specific strengths and gaps. Not just a number." },
              { t: "Stable matching", d: "Multiple open roles? Gale-Shapley algorithm optimally assigns candidates across all positions." },
              { t: "Session history", d: "Every match is saved. Review past sessions, compare runs, track candidate pipelines." },
              { t: "Role templates", d: "20 built-in roles across Sales, GTM, Engineering, Product, Finance. Add your own." },
            ].map((f) => (
              <div key={f.t} className="border-l-2 border-neutral-900 pl-4">
                <h3 className="text-sm font-semibold mb-1">{f.t}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6"><div className="border-t border-neutral-200" /></div>

      {/* Pricing */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-4">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-serif italic mb-14">Simple, transparent pricing.</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <PriceCard tier="Free" price="$0" period="forever" features={["50 scores/month", "1 role", "CSV export", "LinkedIn enrichment"]} />
            <PriceCard tier="Pro" price="$49" period="/month" featured features={["500 scores/month", "Unlimited roles", "Stable matching", "Team seats (5)", "Priority scoring"]} />
            <PriceCard tier="Enterprise" price="Custom" period="contact us" features={["Unlimited scores", "ATS integrations", "Custom models", "SSO + SAML", "Dedicated support"]} />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6"><div className="border-t border-neutral-200" /></div>

      {/* Comparison */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-4">Comparison</p>
          <h2 className="text-4xl md:text-5xl font-serif italic mb-14">How we compare.</h2>
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

      {/* CTA */}
      <section className="py-28 px-6 bg-neutral-950 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-5xl font-serif italic mb-6">Ready to match?</h2>
          <p className="text-neutral-400 mb-8">Free to start. No credit card.</p>
          <Link href={loggedIn ? "/upload" : "/sign-up"}
            className="inline-block text-sm font-medium bg-white text-neutral-900 px-6 py-2.5 rounded-md hover:bg-neutral-100 transition-colors">
            {loggedIn ? "Go to dashboard" : "Get started free"}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-neutral-400">
          <span>Talent Matcher</span>
          <span>Powered by GPT-4o</span>
        </div>
      </footer>
    </div>
  );
}

function PriceCard({ tier, price, period, features, featured }: { tier: string; price: string; period: string; features: string[]; featured?: boolean }) {
  return (
    <div className={`p-6 ${featured ? "border-2 border-neutral-900 bg-neutral-950 text-white" : "border border-neutral-200"}`}>
      <p className={`text-xs uppercase tracking-[0.15em] mb-3 ${featured ? "text-neutral-400" : "text-neutral-400"}`}>{tier}</p>
      <p className="text-3xl font-semibold mb-0.5">{price}</p>
      <p className={`text-xs mb-6 ${featured ? "text-neutral-500" : "text-neutral-400"}`}>{period}</p>
      <ul className="space-y-2">
        {features.map((f) => (
          <li key={f} className={`text-sm flex items-center gap-2 ${featured ? "text-neutral-300" : "text-neutral-600"}`}>
            <span className="text-[10px]">+</span> {f}
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
      <td className="py-2.5 text-center text-neutral-400">{c1}</td>
      <td className="py-2.5 text-center text-neutral-400">{c2}</td>
      <td className="py-2.5 text-center text-neutral-400">{c3}</td>
    </tr>
  );
}

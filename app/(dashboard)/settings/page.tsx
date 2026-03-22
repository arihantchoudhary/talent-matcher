import { ApiKeyCard } from "./api-key-card";

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Settings</h1>
        <p className="text-sm text-neutral-500 mb-8">Manage your account and subscription</p>

        {/* Current plan */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 mb-8">
          <h2 className="font-semibold mb-1">Current Plan</h2>
          <p className="text-sm text-neutral-500 mb-4">You are on the <span className="font-medium text-neutral-900">Free</span> plan</p>
          <div className="text-xs text-neutral-400">50 candidate scores/month &middot; 1 role template &middot; CSV export</div>
        </div>

        {/* Pricing cards */}
        <h2 className="font-semibold text-lg mb-4">Plans</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {/* Free */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Free</div>
            <div className="text-3xl font-bold mb-1">$0</div>
            <div className="text-xs text-neutral-500 mb-4">Forever free</div>
            <ul className="space-y-2 text-sm text-neutral-600 mb-6">
              <li className="flex items-center gap-2"><Check /> 50 scores/month</li>
              <li className="flex items-center gap-2"><Check /> 1 active role</li>
              <li className="flex items-center gap-2"><Check /> CSV export</li>
              <li className="flex items-center gap-2"><Check /> LinkedIn enrichment</li>
            </ul>
            <div className="py-2 px-4 rounded-lg bg-neutral-100 text-center text-sm font-medium text-neutral-500">Current plan</div>
          </div>

          {/* Pro */}
          <div className="rounded-xl border-2 border-neutral-900 bg-white p-6 relative">
            <div className="absolute -top-3 left-4 px-2 py-0.5 bg-neutral-900 text-white text-xs font-semibold rounded-full">Popular</div>
            <div className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-2">Pro</div>
            <div className="text-3xl font-bold mb-1">$49<span className="text-base font-normal text-neutral-400">/mo</span></div>
            <div className="text-xs text-neutral-500 mb-4">Per seat, billed annually</div>
            <ul className="space-y-2 text-sm text-neutral-600 mb-6">
              <li className="flex items-center gap-2"><Check /> 500 scores/month</li>
              <li className="flex items-center gap-2"><Check /> Unlimited roles</li>
              <li className="flex items-center gap-2"><Check /> CSV + JSON export</li>
              <li className="flex items-center gap-2"><Check /> LinkedIn enrichment</li>
              <li className="flex items-center gap-2"><Check /> Team collaboration (5 seats)</li>
              <li className="flex items-center gap-2"><Check /> Priority scoring</li>
            </ul>
            <button className="w-full py-2 px-4 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-black transition-colors">Upgrade to Pro</button>
          </div>

          {/* Enterprise */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Enterprise</div>
            <div className="text-3xl font-bold mb-1">Custom</div>
            <div className="text-xs text-neutral-500 mb-4">Contact sales</div>
            <ul className="space-y-2 text-sm text-neutral-600 mb-6">
              <li className="flex items-center gap-2"><Check /> Unlimited scores</li>
              <li className="flex items-center gap-2"><Check /> Unlimited roles + cities</li>
              <li className="flex items-center gap-2"><Check /> ATS integrations</li>
              <li className="flex items-center gap-2"><Check /> Custom AI models</li>
              <li className="flex items-center gap-2"><Check /> SSO + SAML</li>
              <li className="flex items-center gap-2"><Check /> Dedicated support</li>
              <li className="flex items-center gap-2"><Check /> SLA + DPA</li>
            </ul>
            <button className="w-full py-2 px-4 rounded-lg border border-neutral-200 text-sm font-medium hover:bg-neutral-50 transition-colors">Contact sales</button>
          </div>
        </div>

        {/* Competitors */}
        <h2 className="font-semibold text-lg mb-4">How we compare</h2>
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-4 py-3 font-semibold">Feature</th>
                <th className="text-center px-4 py-3 font-semibold text-neutral-900">Talent Matcher</th>
                <th className="text-center px-4 py-3 font-semibold text-neutral-500">Eightfold AI</th>
                <th className="text-center px-4 py-3 font-semibold text-neutral-500">Beamery</th>
                <th className="text-center px-4 py-3 font-semibold text-neutral-500">HiredScore</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              <CompRow f="Pricing" us="From $0/mo" c1="Enterprise only" c2="Enterprise only" c3="Custom (Workday)" />
              <CompRow f="Setup time" us="< 1 minute" c1="Weeks" c2="Weeks" c3="Weeks" />
              <CompRow f="Any CSV import" us="Yes" c1="No" c2="No" c3="No" />
              <CompRow f="AI scoring with reasoning" us="Yes (GPT-4o)" c1="Proprietary" c2="Proprietary" c3="Proprietary" />
              <CompRow f="LinkedIn enrichment" us="Yes" c1="Yes" c2="Yes" c3="Limited" />
              <CompRow f="Candidate ranking" us="0-100 with reasoning" c1="Match %" c2="Engagement score" c3="Grade A-D" />
              <CompRow f="Multi-role matching" us="30+ templates" c1="Custom only" c2="Custom only" c3="Custom only" />
              <CompRow f="Export to CSV/JSON" us="Yes" c1="Limited" c2="Limited" c3="Via Workday" />
              <CompRow f="Self-serve signup" us="Yes" c1="No" c2="No" c3="No" />
            </tbody>
          </table>
        </div>

        {/* API key */}
        <ApiKeyCard />
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CompRow({ f, us, c1, c2, c3 }: { f: string; us: string; c1: string; c2: string; c3: string }) {
  return (
    <tr>
      <td className="px-4 py-2.5 font-medium">{f}</td>
      <td className="px-4 py-2.5 text-center text-neutral-900 font-medium">{us}</td>
      <td className="px-4 py-2.5 text-center text-neutral-500">{c1}</td>
      <td className="px-4 py-2.5 text-center text-neutral-500">{c2}</td>
      <td className="px-4 py-2.5 text-center text-neutral-500">{c3}</td>
    </tr>
  );
}

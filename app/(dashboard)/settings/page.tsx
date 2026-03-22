"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { ApiKeyCard } from "./api-key-card";
import { getSubscription, Subscription } from "@/lib/subscription";

export default function SettingsPage() {
  const { user } = useUser();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) getSubscription(user.id).then(setSub);
  }, [user?.id]);

  const API = "https://aicm3pweed.us-east-1.awsapprunner.com";
  const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "price_1TDoJ10HItikqOd0C96bWMOE";

  async function handleUpgrade() {
    setLoading(true);
    try {
      const resp = await fetch(`${API}/talent-pluto/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.id || "anonymous", price_id: PRO_PRICE_ID, success_url: `${window.location.origin}/settings?upgraded=true`, cancel_url: `${window.location.origin}/settings` }),
      });
      const data = await resp.json();
      if (data.url) window.location.href = data.url;
      else alert("Checkout error: " + JSON.stringify(data));
    } catch (err) { alert("Network error: " + (err instanceof Error ? err.message : String(err))); }
    setLoading(false);
  }

  const plan = sub?.plan || "free";
  const used = sub?.postings_used || 0;
  const limit = sub?.postings_limit || 3;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return (
    <div className="flex-1 overflow-auto bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="text-3xl font-bold tracking-tight font-serif italic mb-1">Settings</h1>
        <p className="text-sm text-neutral-400 mb-8">Manage your subscription and API keys</p>

        {/* Current plan + usage */}
        <div className="border border-neutral-200 bg-white p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lg">Current Plan</h2>
                <span className="px-2 py-0.5 bg-neutral-900 text-white text-[10px] font-medium uppercase tracking-wider">{plan}</span>
              </div>
              <p className="text-sm text-neutral-500 mt-1">{used} of {limit === Infinity ? "unlimited" : limit} job postings used this month</p>
            </div>
            {plan === "free" && (
              <button onClick={handleUpgrade} disabled={loading}
                className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium hover:bg-black transition-colors disabled:opacity-50">
                {loading ? "Loading..." : "Upgrade to Pro"}
              </button>
            )}
          </div>
          {limit !== Infinity && (
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${pct >= 80 ? "bg-red-500" : "bg-neutral-900"}`} style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>

        {/* Pricing cards — per job posting */}
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-4">Plans</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {/* Free */}
          <div className={`border bg-white p-6 ${plan === "free" ? "border-neutral-900" : "border-neutral-200"}`}>
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Free</div>
            <div className="text-3xl font-bold tracking-tight mb-1">$0</div>
            <div className="text-xs text-neutral-500 mb-5">Forever free</div>
            <ul className="space-y-2 text-sm text-neutral-600 mb-6">
              <li className="flex items-center gap-2"><Ck /> 3 job postings/month</li>
              <li className="flex items-center gap-2"><Ck /> 93 candidates per posting</li>
              <li className="flex items-center gap-2"><Ck /> CSV export</li>
              <li className="flex items-center gap-2"><Ck /> LinkedIn enrichment</li>
              <li className="flex items-center gap-2"><Ck /> 5 judge presets</li>
            </ul>
            {plan === "free" ? (
              <div className="py-2 text-center text-sm font-medium text-neutral-400 border border-neutral-200">Current plan</div>
            ) : (
              <div className="py-2 text-center text-sm text-neutral-400">—</div>
            )}
          </div>

          {/* Pro */}
          <div className={`border-2 bg-white p-6 relative ${plan === "pro" ? "border-neutral-900" : "border-neutral-900"}`}>
            <div className="absolute -top-3 left-4 px-2 py-0.5 bg-neutral-900 text-white text-[10px] font-bold tracking-wider">POPULAR</div>
            <div className="text-[10px] font-bold text-neutral-900 uppercase tracking-wider mb-3">Pro</div>
            <div className="text-3xl font-bold tracking-tight mb-1">$49<span className="text-base font-normal text-neutral-400">/mo</span></div>
            <div className="text-xs text-neutral-500 mb-5">Per seat, billed monthly</div>
            <ul className="space-y-2 text-sm text-neutral-600 mb-6">
              <li className="flex items-center gap-2"><Ck /> 25 job postings/month</li>
              <li className="flex items-center gap-2"><Ck /> Unlimited candidates per posting</li>
              <li className="flex items-center gap-2"><Ck /> CSV + JSON export</li>
              <li className="flex items-center gap-2"><Ck /> LinkedIn enrichment</li>
              <li className="flex items-center gap-2"><Ck /> Stable matching (multi-role)</li>
              <li className="flex items-center gap-2"><Ck /> Embedding similarity analysis</li>
              <li className="flex items-center gap-2"><Ck /> Priority scoring</li>
            </ul>
            {plan === "pro" ? (
              <div className="py-2 text-center text-sm font-medium text-neutral-400 border border-neutral-200">Current plan</div>
            ) : (
              <button onClick={handleUpgrade} disabled={loading}
                className="w-full py-2 bg-neutral-900 text-white text-sm font-medium hover:bg-black transition-colors disabled:opacity-50">
                {loading ? "Loading..." : "Upgrade to Pro"}
              </button>
            )}
          </div>

          {/* Enterprise */}
          <div className={`border bg-white p-6 ${plan === "enterprise" ? "border-neutral-900" : "border-neutral-200"}`}>
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Enterprise</div>
            <div className="text-3xl font-bold tracking-tight mb-1">Custom</div>
            <div className="text-xs text-neutral-500 mb-5">Contact for pricing</div>
            <ul className="space-y-2 text-sm text-neutral-600 mb-6">
              <li className="flex items-center gap-2"><Ck /> Unlimited job postings</li>
              <li className="flex items-center gap-2"><Ck /> Unlimited candidates</li>
              <li className="flex items-center gap-2"><Ck /> ATS integrations</li>
              <li className="flex items-center gap-2"><Ck /> Custom AI models</li>
              <li className="flex items-center gap-2"><Ck /> SSO + SAML</li>
              <li className="flex items-center gap-2"><Ck /> Dedicated support + SLA</li>
            </ul>
            <a href="mailto:ari@talentmatcher.ai"
              className="block w-full py-2 text-center border border-neutral-200 text-sm font-medium hover:bg-neutral-50 transition-colors">
              Contact sales
            </a>
          </div>
        </div>

        {/* Competitors */}
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-4">How we compare</h2>
        <div className="border border-neutral-200 bg-white overflow-hidden mb-8">
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
              <CompRow f="Billing unit" us="Per job posting" c1="Per seat" c2="Per seat" c3="Per seat" />
              <CompRow f="AI scoring" us="GPT-4o + embeddings" c1="Proprietary" c2="Proprietary" c3="Proprietary" />
              <CompRow f="LinkedIn enrichment" us="493 profiles" c1="Yes" c2="Yes" c3="Limited" />
              <CompRow f="Score explanation" us="Per-criterion evidence" c1="Match %" c2="Engagement %" c3="Grade A-D" />
              <CompRow f="Multi-role matching" us="Gale-Shapley" c1="Manual" c2="Manual" c3="Manual" />
              <CompRow f="Self-serve" us="Yes" c1="No" c2="No" c3="No" />
            </tbody>
          </table>
        </div>

        {/* API key */}
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-4">API Key</h2>
        <ApiKeyCard />
      </div>
    </div>
  );
}

function Ck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#171717" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
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

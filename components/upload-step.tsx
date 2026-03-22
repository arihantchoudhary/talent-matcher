"use client";

import { useState, useRef, DragEvent } from "react";

const ROLES = [
  {
    title: "Founding GTM, Legal",
    desc: `Build the Legal go-to-market motion for an AI-native procurement platform. High-ownership sales role targeting U.S. enterprise legal buyers (GC/CFO level).

Requirements:
- 1-4 years in high-performance environment (law, banking, consulting, startups, VC)
- Familiarity with the Legal sector
- Ambition to own outcomes, carry a number, build in new markets
- Strong presence with senior stakeholders (CFO/GC-level buyers)
- In-person Tuesday-Thursday`,
    tag: "Sales",
  },
  {
    title: "Enterprise Account Executive",
    desc: `Close six- and seven-figure SaaS deals with Fortune 500 companies. Full-cycle AE owning pipeline from qualification through close.

Requirements:
- 3-7 years B2B SaaS closing experience, $500K+ quota
- Track record of hitting/exceeding quota (top 10-20% of team)
- Experience selling to VP/C-suite in enterprise orgs
- Complex, multi-stakeholder deal experience (6+ month cycles)
- MEDDIC, Challenger, or similar methodology proficiency
- Comfortable with technical product demos`,
    tag: "Sales",
  },
  {
    title: "SDR Team Lead",
    desc: `Player-coach leading a team of 6-8 SDRs while carrying your own outbound quota. Build playbooks, coach reps, and drive pipeline for the sales org.

Requirements:
- 2-4 years SDR/BDR experience with at least 6 months in a lead or mentor role
- Proven top-performer track record (top 10% of team, President's Club, etc.)
- Experience with outbound prospecting across cold call, email, and LinkedIn
- Ability to coach, motivate, and develop junior reps
- Familiarity with Salesforce, Outreach/Salesloft, and ZoomInfo/Apollo
- Data-driven approach to pipeline metrics and conversion rates`,
    tag: "Sales",
  },
  {
    title: "Mid-Market Account Executive",
    desc: `Own the full sales cycle for mid-market accounts ($50K-$250K ACV). Prospect, demo, negotiate, and close deals with department heads and VPs.

Requirements:
- 1-3 years of closing experience in B2B SaaS
- Track record of meeting or exceeding quota
- Experience running product demos and managing POCs
- Ability to navigate multi-stakeholder deals (3-6 month cycles)
- Strong discovery and qualification skills
- CRM hygiene and pipeline management discipline`,
    tag: "Sales",
  },
  {
    title: "Business Development Representative",
    desc: `Generate qualified pipeline for the sales team through outbound prospecting. Multi-channel outreach to target accounts across enterprise and mid-market.

Requirements:
- 0-2 years experience in sales, business development, or customer-facing roles
- High energy, competitive drive, and coachability
- Excellent written and verbal communication
- Comfort with high-volume outbound (80+ activities/day)
- Familiarity with sales tools (Salesforce, Outreach, LinkedIn Sales Navigator)
- Resilience and ability to handle rejection positively`,
    tag: "Sales",
  },
  {
    title: "Head of Partnerships",
    desc: `Build and lead the partnerships function from scratch — channel partners, technology integrations, co-selling motions, and strategic alliances.

Requirements:
- 5-8 years in partnerships, business development, or strategic alliances at a SaaS company
- Experience building partner programs from 0→1
- Track record of driving revenue through indirect/channel sales
- Strong relationship skills with C-suite and VP-level partner contacts
- Commercial acumen — can structure and negotiate partner agreements
- Experience with co-marketing and joint GTM motions`,
    tag: "Partnerships",
  },
  {
    title: "Customer Success Manager",
    desc: `Own a book of 30-50 mid-market and enterprise accounts. Drive adoption, expansion, and retention. Be the trusted advisor between the customer and the product team.

Requirements:
- 2-5 years in customer success, account management, or consulting
- Experience managing $2M+ ARR book of business
- Track record of net revenue retention above 110%
- Strong executive communication skills (VP/C-suite)
- Ability to identify upsell/cross-sell opportunities
- Technical enough to understand SaaS product workflows`,
    tag: "Customer Success",
  },
  {
    title: "Revenue Operations Analyst",
    desc: `Build and maintain the data infrastructure that powers the GTM team. Own Salesforce, dashboards, forecasting models, territory planning, and comp plans.

Requirements:
- 1-3 years in RevOps, Sales Ops, or BizOps at a B2B SaaS company
- Expert-level Salesforce administration
- SQL proficiency and experience with BI tools (Looker, Tableau, or similar)
- Understanding of sales processes, pipeline stages, and forecasting
- Detail-oriented with strong data hygiene standards
- Experience with tools like Gong, Outreach, Clari, or similar`,
    tag: "Operations",
  },
  {
    title: "Solutions Engineer / Sales Engineer",
    desc: `Partner with AEs to run technical demos, POCs, and RFP responses for enterprise prospects. Bridge the gap between product capabilities and customer needs.

Requirements:
- 2-5 years in solutions engineering, pre-sales, or technical consulting
- Strong technical foundation (APIs, integrations, SaaS architecture)
- Experience running live product demos to technical and non-technical audiences
- Ability to scope and deliver POCs within deal timelines
- Excellent written communication for RFPs and technical documentation
- Consultative selling mindset — can uncover technical requirements and map to value`,
    tag: "Sales",
  },
  {
    title: "VP of Sales",
    desc: `Build and lead the sales organization from Series B through scale. Own revenue targets, hiring, process, and strategy across SDR, AE, and CS teams.

Requirements:
- 8-12 years in B2B SaaS sales with 3+ years in sales leadership
- Experience scaling a team from 5→30+ reps
- Track record of building repeatable sales processes and playbooks
- Managed $10M+ ARR quota attainment
- Experience hiring, coaching, and developing sales managers
- Strong board-level communication and forecasting skills
- Operated in high-growth (2-3x YoY) environments`,
    tag: "Leadership",
  },
  {
    title: "Growth Marketing Manager",
    desc: `Own demand generation and pipeline marketing. Run paid campaigns, ABM programs, events, and content that drive qualified meetings for the sales team.

Requirements:
- 3-5 years in B2B demand gen or growth marketing
- Experience managing $500K+ annual marketing budget
- Track record of driving measurable pipeline (not just MQLs)
- Proficiency with marketing automation (HubSpot/Marketo) and ABM tools (6sense/Demandbase)
- Data-driven approach — comfortable with attribution modeling and funnel analytics
- Experience with events, webinars, and field marketing`,
    tag: "Marketing",
  },
  {
    title: "Product-Led Sales Rep",
    desc: `Convert product-qualified leads (PQLs) into paying customers. Work inbound leads from free trial and freemium users, run short-cycle demos and close deals.

Requirements:
- 1-3 years in inside sales, PLG sales, or SaaS closing
- Experience with high-velocity sales (30-60 day cycles, $10K-$80K ACV)
- Ability to quickly qualify and prioritize based on product usage signals
- Comfortable running 4-6 demos per day
- Strong at creating urgency and driving short decision timelines
- Experience with product analytics tools (Pendo, Amplitude, Mixpanel)`,
    tag: "Sales",
  },
];

export function UploadStep({ onStart }: { onStart: (csv: string, title: string, desc: string, apiKey: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [jobTitle, setJobTitle] = useState(ROLES[0].title);
  const [jobDesc, setJobDesc] = useState(ROLES[0].desc);
  const [selectedRole, setSelectedRole] = useState(0);
  const [showRoles, setShowRoles] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      const lines = text.split("\n").filter((l) => l.trim());
      setRowCount(Math.max(0, lines.length - 1));
    };
    reader.readAsText(file);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function selectRole(idx: number) {
    setSelectedRole(idx);
    setJobTitle(ROLES[idx].title);
    setJobDesc(ROLES[idx].desc);
    setShowRoles(false);
  }

  const tagColors: Record<string, string> = {
    Sales: "bg-blue-100 text-blue-700",
    Partnerships: "bg-violet-100 text-violet-700",
    "Customer Success": "bg-emerald-100 text-emerald-700",
    Operations: "bg-amber-100 text-amber-700",
    Leadership: "bg-rose-100 text-rose-700",
    Marketing: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 fade-in">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Match candidates to your role</h1>
        <p className="text-lg text-[var(--text-muted)]">Upload any CSV, pick a role, get AI-powered rankings.</p>
      </div>

      <div className="space-y-5">
        {/* CSV upload */}
        <div>
          <label className="block text-sm font-semibold mb-2">1. Candidate CSV</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragging ? "drop-active" : fileName ? "border-emerald-300 bg-emerald-50" : "border-[var(--border)] hover:border-[var(--border-light)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <input ref={fileRef} type="file" accept=".csv" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {fileName ? (
              <div className="space-y-1">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" className="mx-auto"><path d="M20 6 9 17l-5-5" /></svg>
                <p className="font-semibold text-[var(--green)]">{fileName}</p>
                <p className="text-sm text-[var(--text-muted)]">{rowCount} candidates detected</p>
              </div>
            ) : (
              <div className="space-y-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" className="mx-auto">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="font-semibold">Drop your CSV here, or click to browse</p>
                <p className="text-xs text-[var(--text-muted)]">Works with any CSV format</p>
              </div>
            )}
          </div>
        </div>

        {/* Role picker */}
        <div>
          <label className="block text-sm font-semibold mb-2">2. Pick a role</label>

          {/* Selected role display */}
          <button
            onClick={() => setShowRoles(!showRoles)}
            className="w-full text-left rounded-xl border border-[var(--border)] px-4 py-3 bg-white hover:bg-[var(--surface-2)] transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${tagColors[ROLES[selectedRole].tag] || "bg-gray-100 text-gray-600"}`}>
                {ROLES[selectedRole].tag}
              </span>
              <span className="text-sm font-medium">{ROLES[selectedRole].title}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-[var(--text-muted)] transition-transform ${showRoles ? "rotate-180" : ""}`}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {/* Role grid */}
          {showRoles && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto rounded-xl border border-[var(--border)] p-2 bg-white">
              {ROLES.map((role, idx) => (
                <button
                  key={idx}
                  onClick={() => selectRole(idx)}
                  className={`text-left rounded-lg p-3 border transition-all ${
                    selectedRole === idx
                      ? "border-[var(--accent)] bg-[var(--accent-light)]"
                      : "border-transparent hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${tagColors[role.tag] || "bg-gray-100 text-gray-600"}`}>
                      {role.tag}
                    </span>
                  </div>
                  <div className="text-sm font-medium">{role.title}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{role.desc.split("\n")[0]}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editable title */}
        <div>
          <label className="block text-sm font-semibold mb-2">Role title <span className="font-normal text-[var(--text-muted)]">(editable)</span></label>
          <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]" />
        </div>

        {/* Editable description */}
        <div>
          <label className="block text-sm font-semibold mb-2">Role description <span className="font-normal text-[var(--text-muted)]">(editable)</span></label>
          <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} rows={6}
            className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]" />
        </div>

        {/* API key (optional) */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            OpenAI API Key <span className="font-normal text-[var(--text-muted)]">(optional — default key included)</span>
          </label>
          <div className="relative">
            <input type={showKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-proj-..."
              className="w-full rounded-xl border border-[var(--border)] px-4 py-3 pr-16 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]" />
            <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text)]">
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={() => csvText && onStart(csvText, jobTitle, jobDesc, apiKey)}
          disabled={!csvText}
          className="w-full py-4 rounded-xl bg-[var(--accent)] text-white font-semibold text-base
                     hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed
                     transition-all shadow-sm hover:shadow-md mt-2"
        >
          Score {rowCount > 0 ? `${rowCount} candidates` : "candidates"} with AI
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useMemo, useEffect, DragEvent } from "react";
import { useUser } from "@clerk/nextjs";
import { ROLES as DEFAULT_ROLES, CATEGORIES, CITIES, Role } from "@/lib/roles";
import { loadRoles } from "@/lib/roles-api";
import { getApiKey } from "@/lib/api-key";
import { parseCSV } from "@/lib/parse-csv";
import { saveSession, ScoredCandidate } from "@/lib/sessions";
import { useScoringContext } from "@/lib/scoring-context";

export default function UploadPage() {
  const { user } = useUser();
  const scoring = useScoringContext();

  const [ROLES, setROLES] = useState<Role[]>(DEFAULT_ROLES);
  useEffect(() => { loadRoles().then(setROLES); }, []);

  // Form state
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [jobTitle, setJobTitle] = useState(DEFAULT_ROLES[0].title);
  const [jobDesc, setJobDesc] = useState(DEFAULT_ROLES[0].description);
  const [showPicker, setShowPicker] = useState(false);
  const [catFilter, setCatFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [roleSearch, setRoleSearch] = useState("");

  // Rubric presets (judges) — same 6 criteria, different weights
  type Criterion = { name: string; weight: number; description: string };
  const CRITERIA_DEFS: Criterion[] = [
    { name: "Relevant Experience", weight: 0, description: "Years and quality of experience in relevant roles" },
    { name: "Industry Fit", weight: 0, description: "Familiarity with the target industry/sector" },
    { name: "Sales Capability", weight: 0, description: "Track record of sales, pipeline, and revenue generation" },
    { name: "Stakeholder Presence", weight: 0, description: "Ability to engage with senior decision-makers" },
    { name: "Cultural Fit", weight: 0, description: "Drive, ambition, coachability, team orientation" },
    { name: "Location", weight: 0, description: "Proximity to office, willingness to work in-person" },
  ];
  const makeWeights = (w: number[]) => CRITERIA_DEFS.map((c, i) => ({ ...c, weight: w[i] }));
  const PRESETS: Record<string, { label: string; desc: string; criteria: Criterion[]; idealCandidate: string }> = {
    balanced: { label: "The Generalist", desc: "Equal weight across all criteria",
      idealCandidate: "2-3 years in consulting or banking. Strong communicator who can engage C-suite buyers. Some exposure to legal or procurement. Based in NYC or SF. Ambitious, coachable, team player. Has carried a quota or driven pipeline.",
      criteria: makeWeights([20, 20, 20, 15, 15, 10]) },
    hunter: { label: "The Hunter", desc: "Prioritize outbound, prospecting, cold outreach",
      idealCandidate: "Top-performing SDR/BDR with 1-3 years of high-volume outbound. 100+ calls/day, cold email sequences, LinkedIn prospecting. President's Club or top 10% of team. Uses Salesforce, Outreach, Apollo. Resilient, competitive, loves the hunt.",
      criteria: makeWeights([15, 10, 35, 10, 25, 5]) },
    closer: { label: "The Closer", desc: "Prioritize closing, deal sizes, enterprise selling",
      idealCandidate: "3-5 years closing B2B SaaS deals $100K+ ACV. Enterprise sales cycles 6+ months. Sold to VP/C-suite. MEDDIC or Challenger methodology. Consistently hit quota. Managed complex multi-stakeholder deals with legal, procurement, IT involved.",
      criteria: makeWeights([20, 15, 30, 20, 10, 5]) },
    pedigree: { label: "The Pedigree", desc: "Prioritize top companies, elite schools, brand names",
      idealCandidate: "Goldman Sachs, McKinsey, BCG, or top-tier tech (Stripe, Google, Brex). Ivy League or Stanford/MIT. Fast promotions — analyst to associate in 2 years. JD or MBA from a top-10 program. Articulate, polished, trusted by senior executives.",
      criteria: makeWeights([30, 15, 10, 15, 25, 5]) },
    scrappy: { label: "The Builder", desc: "Prioritize founders, 0-1 builders, scrappiness",
      idealCandidate: "Founded or co-founded a company. Built a team or product from zero. Wore many hats — sales, ops, product. Comfortable with ambiguity and limited resources. Startup experience at seed/Series A. High ownership mentality, low ego.",
      criteria: makeWeights([15, 10, 20, 10, 40, 5]) },
    custom: { label: "Custom", desc: "Define your own criteria and weights",
      criteria: makeWeights([20, 20, 20, 15, 15, 10]),
      idealCandidate: "" },
  };

  const [selectedPreset, setSelectedPreset] = useState("balanced");
  const [criteria, setCriteria] = useState(PRESETS.balanced.criteria);
  const [idealCandidate, setIdealCandidate] = useState(PRESETS.balanced.idealCandidate);
  const [profileMode, setProfileMode] = useState<"fields" | "text">("fields");
  const [idealProfile, setIdealProfile] = useState({
    years_experience: "2-3",
    industries: "financial-services, technology",
    departments_sold_to: "finance, legal, operations",
    buyer_personas: "c-suite-decision-maker, department-head",
    sales_focus: "enterprise, mid-market",
    sdr_grade: "A",
    ae_grade: "B",
    location: "New York, NY",
    skills: "Salesforce, Outreach, LinkedIn Sales Navigator",
    background: "consulting, banking, or law",
  });

  // Build natural language from structured profile for embedding
  function profileToText(p: typeof idealProfile): string {
    return `${p.years_experience} years sales experience in ${p.industries}. Sold to ${p.departments_sold_to} departments. Buyer personas: ${p.buyer_personas}. Focus: ${p.sales_focus}. SDR grade ${p.sdr_grade}, AE grade ${p.ae_grade}. Location: ${p.location}. Skills: ${p.skills}. Background: ${p.background}.`;
  }

  // Dropdown options for natural language builder
  const NL_OPTIONS = {
    experience: ["0-1 years", "1-2 years", "2-3 years", "3-5 years", "5-7 years", "7-10 years", "10+ years"],
    background: ["consulting", "banking", "law", "SaaS sales", "SDR/BDR", "enterprise AE", "founder", "startup early employee", "Big Tech", "private equity", "venture capital", "real estate"],
    industries: ["technology", "financial services", "legal", "healthcare", "SaaS", "fintech", "real estate", "enterprise software", "AI/ML", "cybersecurity", "edtech", "consulting"],
    buyer_personas: ["C-suite", "VP/Director", "Department heads", "Technical evaluators", "Procurement", "Legal", "Finance leaders", "Founders/CEOs"],
    sales_focus: ["Enterprise ($100K+ ACV)", "Mid-market ($25-100K)", "SMB (< $25K)", "Outbound/cold calling", "Inbound/closing", "Full-cycle", "Channel/partnerships"],
    skills: ["Salesforce", "Outreach", "Apollo", "LinkedIn Sales Nav", "HubSpot", "Gong", "MEDDIC", "Challenger", "SPIN", "cold calling", "email sequences", "demo skills"],
    traits: ["quota attainment", "President's Club", "fast promotions", "high activity volume", "built from zero", "wore many hats", "low ego", "coachable", "competitive", "resilient"],
    location: ["New York, NY", "San Francisco, CA", "Los Angeles, CA", "Chicago, IL", "Boston, MA", "Austin, TX", "Miami, FL", "Seattle, WA", "Remote", "Any"],
  };
  type NLCategory = keyof typeof NL_OPTIONS;

  const [nlSelections, setNlSelections] = useState<Record<NLCategory, string[]>>({
    experience: ["2-3 years"],
    background: ["consulting", "banking"],
    industries: ["financial services", "technology"],
    buyer_personas: ["C-suite", "Department heads"],
    sales_focus: ["Enterprise ($100K+ ACV)", "Mid-market ($25-100K)"],
    skills: ["Salesforce", "Outreach", "LinkedIn Sales Nav"],
    traits: ["coachable", "competitive"],
    location: ["New York, NY"],
  });
  const [nlEditMode, setNlEditMode] = useState(false);

  const NL_PRESETS: Record<string, Record<NLCategory, string[]>> = {
    balanced: { experience: ["2-3 years"], background: ["consulting", "banking"], industries: ["financial services", "technology"], buyer_personas: ["C-suite", "Department heads"], sales_focus: ["Enterprise ($100K+ ACV)", "Mid-market ($25-100K)"], skills: ["Salesforce", "Outreach", "LinkedIn Sales Nav"], traits: ["coachable", "competitive"], location: ["New York, NY"] },
    hunter: { experience: ["1-2 years", "2-3 years"], background: ["SDR/BDR", "SaaS sales"], industries: ["technology", "SaaS"], buyer_personas: ["Department heads", "Technical evaluators"], sales_focus: ["Outbound/cold calling", "Mid-market ($25-100K)"], skills: ["Outreach", "Apollo", "cold calling", "email sequences"], traits: ["high activity volume", "competitive", "resilient"], location: ["New York, NY"] },
    closer: { experience: ["3-5 years", "5-7 years"], background: ["enterprise AE", "SaaS sales"], industries: ["financial services", "technology", "legal"], buyer_personas: ["C-suite", "VP/Director", "Procurement"], sales_focus: ["Enterprise ($100K+ ACV)", "Full-cycle"], skills: ["Salesforce", "MEDDIC", "Challenger", "demo skills"], traits: ["quota attainment", "President's Club"], location: ["New York, NY"] },
    pedigree: { experience: ["2-3 years", "3-5 years"], background: ["consulting", "banking", "Big Tech"], industries: ["financial services", "consulting"], buyer_personas: ["C-suite"], sales_focus: ["Enterprise ($100K+ ACV)"], skills: ["Salesforce"], traits: ["fast promotions", "President's Club"], location: ["New York, NY"] },
    scrappy: { experience: ["1-2 years", "2-3 years"], background: ["founder", "startup early employee"], industries: ["technology", "SaaS"], buyer_personas: ["C-suite", "Department heads", "Founders/CEOs"], sales_focus: ["SMB (< $25K)", "Mid-market ($25-100K)", "Full-cycle"], skills: ["Salesforce", "cold calling"], traits: ["built from zero", "wore many hats", "low ego", "resilient"], location: ["New York, NY"] },
    custom: { experience: [], background: [], industries: [], buyer_personas: [], sales_focus: [], skills: [], traits: [], location: [] },
  };

  function nlSelectionsToText(sel: Record<NLCategory, string[]>): string {
    const parts: string[] = [];
    if (sel.experience.length) parts.push(`${sel.experience.join(" or ")} of experience`);
    if (sel.background.length) parts.push(`background in ${sel.background.join(", ")}`);
    if (sel.industries.length) parts.push(`selling into ${sel.industries.join(", ")}`);
    if (sel.buyer_personas.length) parts.push(`engaging ${sel.buyer_personas.join(", ")} buyers`);
    if (sel.sales_focus.length) parts.push(`focused on ${sel.sales_focus.join(", ")}`);
    if (sel.skills.length) parts.push(`proficient with ${sel.skills.join(", ")}`);
    if (sel.traits.length) parts.push(`demonstrating ${sel.traits.join(", ")}`);
    if (sel.location.length) parts.push(`based in ${sel.location.join(" or ")}`);
    return parts.join(". ") + (parts.length ? "." : "");
  }

  function toggleNlOption(cat: NLCategory, option: string) {
    setNlSelections(prev => {
      const cur = prev[cat];
      const next = cur.includes(option) ? cur.filter(o => o !== option) : [...cur, option];
      const updated = { ...prev, [cat]: next };
      setIdealCandidate(nlSelectionsToText(updated));
      setSelectedPreset("custom");
      return updated;
    });
  }

  const IDEAL_PROFILES: Record<string, typeof idealProfile> = {
    balanced: { years_experience: "2-3", industries: "financial-services, technology", departments_sold_to: "finance, legal, operations", buyer_personas: "c-suite-decision-maker, department-head", sales_focus: "enterprise, mid-market", sdr_grade: "A", ae_grade: "B", location: "New York, NY", skills: "Salesforce, Outreach, LinkedIn Sales Navigator", background: "consulting, banking, or law" },
    hunter: { years_experience: "1-3", industries: "technology, SaaS", departments_sold_to: "sales, marketing, operations", buyer_personas: "department-head, technical-evaluator", sales_focus: "mid-market, enterprise", sdr_grade: "S", ae_grade: "F", location: "New York, NY", skills: "Outreach, Apollo, Salesforce, cold calling", background: "SDR/BDR at high-growth startup, 100+ calls/day" },
    closer: { years_experience: "3-5", industries: "financial-services, technology, legal", departments_sold_to: "finance, legal, procurement", buyer_personas: "c-suite-decision-maker, vp-director", sales_focus: "enterprise", sdr_grade: "B", ae_grade: "A", location: "New York, NY", skills: "Salesforce, MEDDIC, Challenger methodology", background: "enterprise AE at top SaaS, $500K+ quota" },
    pedigree: { years_experience: "2-4", industries: "financial-services, consulting", departments_sold_to: "finance, operations", buyer_personas: "c-suite-decision-maker", sales_focus: "enterprise", sdr_grade: "A", ae_grade: "B", location: "New York, NY", skills: "Goldman Sachs, McKinsey, Stanford, Harvard", background: "top-tier firm, Ivy League, fast promotions" },
    scrappy: { years_experience: "1-3", industries: "technology, startups", departments_sold_to: "operations, sales, engineering", buyer_personas: "c-suite-decision-maker, department-head", sales_focus: "smb, mid-market", sdr_grade: "A", ae_grade: "C", location: "New York, NY", skills: "founding experience, built from zero, multi-hat", background: "founder or early employee at seed/Series A startup" },
    custom: { years_experience: "", industries: "", departments_sold_to: "", buyer_personas: "", sales_focus: "", sdr_grade: "", ae_grade: "", location: "", skills: "", background: "" },
  };

  function selectPreset(key: string) {
    setSelectedPreset(key);
    if (key !== "custom" && PRESETS[key]) {
      setCriteria([...PRESETS[key].criteria]);
      setIdealCandidate(PRESETS[key].idealCandidate);
      setIdealProfile({ ...IDEAL_PROFILES[key] });
      if (NL_PRESETS[key]) {
        setNlSelections({ ...NL_PRESETS[key] });
        setNlEditMode(false);
      }
    }
  }

  // Scoring state
  const [step, setStep] = useState<"setup" | "scoring" | "results">("setup");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<ScoredCandidate[]>([]);
  const [logs, setLogs] = useState<{ name: string; step: string; detail: string }[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "card" | "table">("list");
  const [scoreFilter, setScoreFilter] = useState<number | null>(null);
  const [topK, setTopK] = useState(100); // How many to GPT-score (rest pre-filtered by embeddings)
  const [elapsed, setElapsed] = useState(0);
  const scoringStartRef = useRef(0);

  // Elapsed timer — starts when scoring begins
  useEffect(() => {
    if (step !== "scoring") return;
    if (!scoringStartRef.current) scoringStartRef.current = Date.now();
    const interval = setInterval(() => setElapsed(Math.round((Date.now() - scoringStartRef.current) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [step]);

  // Context sync disabled — scoring handled locally via SSE

  const filteredRoles = useMemo(() => {
    let list = ROLES;
    if (catFilter !== "All") list = list.filter(r => r.category === catFilter);
    if (cityFilter !== "All") list = list.filter(r => r.locations.includes(cityFilter) || r.remote);
    if (roleSearch) { const q = roleSearch.toLowerCase(); list = list.filter(r => r.title.toLowerCase().includes(q)); }
    return list;
  }, [ROLES, catFilter, cityFilter, roleSearch]);

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => { const t = e.target?.result as string; setCsvText(t); setRowCount(parseCSV(t).length); };
    reader.readAsText(file);
  }
  function handleDrop(e: DragEvent) { e.preventDefault(); setDragging(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]); }
  function pickRole(idx: number) { setSelectedIdx(idx); setJobTitle(ROLES[idx].title); setJobDesc(ROLES[idx].description); setShowPicker(false); }

  async function startScoring() {
    if (!csvText) return;
    const parsed = parseCSV(csvText);
    const startTime = Date.now();
    if (parsed.length === 0) return;

    const jd = `${jobTitle}\n\n${jobDesc}\n\nSCORING RUBRIC (weight each criterion accordingly):\n${criteria.map(c => `- ${c.name} (${c.weight}%): ${c.description}`).join("\n")}`;
    // Don't use context scoring — we handle SSE locally
    // scoring.startScoring(...);

    setStep("scoring");
    scoringStartRef.current = Date.now();
    setElapsed(0);
    setProgress({ done: 0, total: parsed.length });
    setResults([]); setLogs([]); setTotalTokens(0); setTotalCost(0);

    const scoredMap = new Map<string, ScoredCandidate>();
    let doneCount = 0;
    let doneHandled = false;
    const API = "https://aicm3pweed.us-east-1.awsapprunner.com";

    try {
      const resp = await fetch(`${API}/talent-pluto/score`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: parsed.map(c => ({ id: c.id, name: c.name, fullText: c.fullText, linkedinUrl: c.linkedinUrl || "" })), job_description: jd, api_key: getApiKey(), top_k: topK, ideal_candidate: `${profileToText(idealProfile)}\n\n${idealCandidate}`, criteria: criteria.filter(c => c.weight > 0).map(c => ({ name: c.name, weight: c.weight })) }),
      });

      const reader = resp.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "start") {
              // Backend tells us actual number being scored (after pre-filter)
              setProgress(prev => ({ ...prev, total: data.total }));
            }
            if (data.type === "log") setLogs(prev => [{ name: data.name, step: data.step, detail: data.detail }, ...prev].slice(0, 100));
            if (data.type === "scored" || data.type === "error") {
              doneCount++;
              scoredMap.set(data.id, {
                id: data.id, rank: 0, name: data.name, score: data.score || 0,
                reasoning: data.reasoning || data.error || "", highlights: data.highlights || [], gaps: data.gaps || [],
                photo_url: data.photo_url || "", linkedin_url: data.linkedin_url || "",
                evidence: data.evidence || {}, criteria: data.criteria || [],
              });
              if (data.tokens) setTotalTokens(prev => prev + (data.tokens.prompt || 0) + (data.tokens.completion || 0));
              if (data.cost) setTotalCost(prev => prev + data.cost);
              setProgress({ done: doneCount, total: parsed.length });
              const sorted = [...scoredMap.values()].sort((a, b) => b.score - a.score);
              sorted.forEach((s, i) => s.rank = i + 1);
              setResults([...sorted]);
            }
            if (data.type === "done") {
              doneHandled = true;
              const duration = Math.round((Date.now() - startTime) / 1000);
              const finalResults = [...scoredMap.values()].sort((a, b) => b.score - a.score);
              finalResults.forEach((s, i) => s.rank = i + 1);
              setResults(finalResults);
              saveSession({ userId: user?.id || "anonymous", userName: user?.fullName || user?.primaryEmailAddress?.emailAddress || "Anonymous", device: window.innerWidth < 768 ? "mobile" : "desktop",
                role: jobTitle, roleCategory: ROLES[selectedIdx]?.category || "Custom", description: jobDesc.substring(0, 300),
                fileName: fileName || "unknown.csv", candidateCount: parsed.length,
                topTier: finalResults.filter(r => r.score >= 70).length, goodFit: finalResults.filter(r => r.score >= 50 && r.score < 70).length,
                avgScore: Math.round(finalResults.reduce((s, r) => s + r.score, 0) / finalResults.length), judge: PRESETS[selectedPreset]?.label || "Custom", results: finalResults, duration, tokens: totalTokens, cost: Math.round(totalCost * 10000) / 10000,
              });
              setStep("results");
            }
          } catch {}
        }
      }
    } catch (err) { console.error(err); }
    // Fallback: if stream ended without "done" event, show whatever we have
    if (scoredMap.size > 0 && !doneHandled) {
      const finalResults = [...scoredMap.values()].sort((a, b) => b.score - a.score);
      finalResults.forEach((s, i) => s.rank = i + 1);
      setResults(finalResults);
      setStep("results");
    }
  }

  // Move candidate up/down for manual re-ranking
  function moveCandidate(idx: number, direction: "up" | "down") {
    const arr = [...results];
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    arr.forEach((s, i) => s.rank = i + 1);
    setResults(arr);
  }

  const role = ROLES[selectedIdx];
  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  // ── SCORING ──
  if (step === "scoring") {
    const enrichCount = logs.filter(l => l.step === "enrich").length;
    const elapsed = Math.round((Date.now() - (scoring.isScoring ? Date.now() : Date.now())) / 1000);

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Matching Algorithm</h1>
        <p className="text-sm text-neutral-500 mb-4">
          {progress.done} of {progress.total} candidates scored for <span className="font-medium text-neutral-900">{jobTitle}</span>
          <span className="ml-3 tabular-nums font-mono text-neutral-400">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</span>
        </p>

        {/* Progress bar */}
        <div className="h-2 bg-neutral-100 rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-neutral-900 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="border border-neutral-200 bg-white rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{progress.total}</div>
            <div className="text-[10px] text-neutral-400 uppercase mt-0.5">Parsed</div>
          </div>
          <div className="border border-neutral-200 bg-white rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{enrichCount}</div>
            <div className="text-[10px] text-neutral-400 uppercase mt-0.5">Enriched</div>
          </div>
          <div className="border border-neutral-200 bg-white rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{progress.done}</div>
            <div className="text-[10px] text-neutral-400 uppercase mt-0.5">Scored</div>
          </div>
          <div className={`border rounded-lg p-3 text-center ${pct === 100 ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white"}`}>
            <div className="text-xl font-bold">{pct}%</div>
            <div className={`text-[10px] uppercase mt-0.5 ${pct === 100 ? "text-neutral-400" : "text-neutral-400"}`}>Complete</div>
          </div>
        </div>

        {/* Pipeline steps */}
        <div className="border border-neutral-200 bg-white rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            {[
              { label: "Parse CSV", done: progress.total > 0 },
              { label: "LinkedIn Enrich", done: enrichCount > 0 },
              { label: "GPT-4o Score", done: progress.done > 0 },
              { label: "Rank Results", done: pct === 100 },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                {i > 0 && <div className={`w-8 h-px ${step.done ? "bg-neutral-900" : "bg-neutral-200"}`} />}
                <div className={`flex items-center gap-1.5 ${step.done ? "text-neutral-900" : "text-neutral-300"}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step.done ? "bg-neutral-900 text-white" : "border-2 border-neutral-200"}`}>
                    {step.done ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg> : i + 1}
                  </div>
                  <span className="text-xs font-medium hidden md:inline">{step.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-neutral-400 mb-3">Pipeline Log</p>
            <div className="border border-neutral-200 bg-white max-h-80 overflow-y-auto font-mono text-xs rounded-lg">
              {logs.length === 0 ? (
                <div className="p-6 text-center text-neutral-400">
                  <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto mb-2" />
                  Loading LinkedIn profiles...
                </div>
              ) : logs.slice(0, 40).map((log, i) => (
                <div key={i} className="px-3 py-1.5 border-b border-neutral-50 flex gap-2">
                  <span className={`shrink-0 w-12 font-semibold ${log.step === "parse" ? "text-blue-600" : log.step === "enrich" ? "text-emerald-600" : log.step === "score" ? "text-amber-600" : log.step === "result" ? "text-neutral-900" : "text-red-500"}`}>{log.step}</span>
                  <span className="text-neutral-400 shrink-0 w-24 truncate">{log.name}</span>
                  <span className="text-neutral-600">{log.detail}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-neutral-400 mb-3">Top Matches</p>
            <div className="border border-neutral-200 bg-white">
              {results.slice(0, 8).map((r, i) => (
                <div key={r.id} className="px-4 py-2 border-b border-neutral-50 flex items-center gap-3">
                  {r.photo_url ? <img src={r.photo_url} alt="" className="w-7 h-7 rounded-full object-cover" /> : <div className="w-7 h-7 rounded-full bg-neutral-100" />}
                  <span className="text-xs font-bold w-6">{r.score}</span>
                  <span className="text-sm truncate">{r.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS ──
  if (step === "results") {
    const scores = results.map(r => r.score);
    const mean = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const stdDev = scores.length > 0 ? Math.round(Math.sqrt(scores.reduce((s, x) => s + (x - mean) ** 2, 0) / scores.length)) : 0;

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{results.length} candidates ranked</h1>
            <p className="text-sm text-neutral-500">{jobTitle} &middot; Mean {mean} &middot; Std Dev {stdDev} {totalTokens > 0 && <>&middot; {(totalTokens/1000).toFixed(1)}k tokens (${totalCost.toFixed(3)})</>}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setStep("setup"); setResults([]); scoring.reset(); }} className="text-xs text-neutral-500 hover:text-neutral-900 border border-neutral-200 rounded-lg px-3 py-1.5">New match</button>
            <button onClick={() => {
              const csv = ["Rank,Name,Score,Reasoning,Highlights,Gaps,LinkedIn", ...results.map(r => `${r.rank},"${r.name}",${r.score},"${(r.reasoning||'').replace(/"/g,'""')}","${(r.highlights||[]).join('; ')}","${(r.gaps||[]).join('; ')}","${r.linkedin_url||''}"`)].join("\n");
              const blob = new Blob([csv], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${jobTitle.replace(/[^a-z0-9]/gi, '-')}-rankings.csv`; a.click();
            }} className="text-xs font-medium bg-neutral-900 text-white rounded-lg px-3 py-1.5 hover:bg-black">Download CSV</button>
          </div>
        </div>

        {/* Score distribution — clickable bars */}
        <div className="border border-neutral-200 bg-white rounded-lg p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-[0.1em] text-neutral-400">Score Distribution</p>
            {scoreFilter !== null && (
              <button onClick={() => setScoreFilter(null)} className="text-[10px] text-neutral-400 hover:text-neutral-900 underline">Show all</button>
            )}
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {[0,10,20,30,40,50,60,70,80,90].map(b => {
              const count = results.filter(r => r.score >= b && r.score < b + 10).length;
              const max = Math.max(...[0,10,20,30,40,50,60,70,80,90].map(x => results.filter(r => r.score >= x && r.score < x + 10).length), 1);
              const isActive = scoreFilter === b;
              return (
                <button key={b} onClick={() => setScoreFilter(isActive ? null : b)} className="flex-1 flex flex-col items-center gap-1 group">
                  {count > 0 && <span className={`text-[9px] font-medium ${isActive ? "text-neutral-900" : "text-neutral-400"}`}>{count}</span>}
                  <div className={`w-full rounded transition-all ${isActive ? "bg-neutral-900" : count > 0 ? "bg-neutral-300 group-hover:bg-neutral-900" : "bg-neutral-100"}`}
                    style={{ height: `${(count / max) * 48}px`, minHeight: count > 0 ? 3 : 0 }} />
                  <span className={`text-[9px] ${isActive ? "text-neutral-900 font-bold" : "text-neutral-400"}`}>{b}</span>
                </button>
              );
            })}
          </div>
          {scoreFilter !== null && (
            <p className="text-xs text-neutral-500 mt-3">Showing {results.filter(r => r.score >= scoreFilter && r.score < scoreFilter + 10).length} candidates with scores {scoreFilter}-{scoreFilter + 9}. Drag to re-rank within this group.</p>
          )}
        </div>

        {/* View toggle */}
        <div className="flex gap-1 mb-4">
          {(["list", "card", "table"] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewMode === v ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"}`}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* LIST VIEW */}
        {viewMode === "list" && (() => {
          const displayResults = scoreFilter !== null
            ? results.filter(r => r.score >= scoreFilter && r.score < scoreFilter + 10)
            : results;
          return (
          <div className="space-y-2">
            {displayResults.map((c, idx) => {
              const realIdx = results.indexOf(c);
              return (
              <div key={c.id} className="border border-neutral-200 bg-white rounded-lg overflow-hidden">
                <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-neutral-50" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                  {/* Rerank arrows */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={e => { e.stopPropagation(); moveCandidate(realIdx, "up"); }} className="text-neutral-300 hover:text-neutral-900 disabled:opacity-20" disabled={realIdx === 0}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6" /></svg>
                    </button>
                    <button onClick={e => { e.stopPropagation(); moveCandidate(realIdx, "down"); }} className="text-neutral-300 hover:text-neutral-900 disabled:opacity-20" disabled={realIdx === results.length - 1}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                    </button>
                  </div>
                  {c.photo_url ? <img src={c.photo_url} alt={c.name} className="w-12 h-12 rounded-lg object-cover shrink-0" /> : <div className="w-12 h-12 rounded-lg bg-neutral-100 shrink-0 flex items-center justify-center text-neutral-400 font-bold">{c.name?.charAt(0)}</div>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400 font-mono">#{c.rank}</span>
                      <span className="font-semibold text-sm">{c.name}</span>
                      <span className={`px-2 py-0.5 text-xs font-bold ${c.score >= 70 ? "bg-neutral-900 text-white" : c.score >= 50 ? "bg-neutral-100" : "text-neutral-400"}`}>{c.score}</span>
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{c.reasoning}</p>
                  </div>
                </div>
                {expanded === c.id && (
                  <div className="px-4 pb-4 border-t border-neutral-100 fade-in">
                    <div className="mt-3 h-1 bg-neutral-100 mb-3"><div className="h-full bg-neutral-900" style={{ width: `${c.score}%` }} /></div>
                    {c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-900 mb-2">LinkedIn</a>}
                    <p className="text-sm text-neutral-700 mb-3">{c.reasoning}</p>
                    {c.criteria && c.criteria.length > 0 && (
                      <div className="flex flex-col sm:flex-row gap-4 mb-3">
                        {/* Pie chart */}
                        <div className="shrink-0">
                          <svg width="100" height="100" viewBox="0 0 100 100">
                            {(() => {
                              const colors = ["#171717", "#404040", "#737373", "#a3a3a3", "#d4d4d4", "#e5e5e5"];
                              let cumulative = 0;
                              const total = c.criteria.reduce((s, cr) => s + (cr.max || 0), 0) || 100;
                              return c.criteria.map((cr, i) => {
                                const pct = (cr.score || 0) / total;
                                const startAngle = cumulative * 2 * Math.PI;
                                cumulative += (cr.max || 0) / total;
                                const endAngle = cumulative * 2 * Math.PI;
                                const scorePct = (cr.score || 0) / total;
                                const scoreEndAngle = startAngle + scorePct * 2 * Math.PI;
                                const x1 = 50 + 45 * Math.cos(startAngle - Math.PI / 2);
                                const y1 = 50 + 45 * Math.sin(startAngle - Math.PI / 2);
                                const x2 = 50 + 45 * Math.cos(scoreEndAngle - Math.PI / 2);
                                const y2 = 50 + 45 * Math.sin(scoreEndAngle - Math.PI / 2);
                                const large = scorePct > 0.5 ? 1 : 0;
                                return (
                                  <g key={i}>
                                    <title>{cr.name}: {cr.score}/{cr.max} — {cr.evidence || ""}</title>
                                    <path d={`M50,50 L${x1},${y1} A45,45 0 ${large},1 ${x2},${y2} Z`} fill={colors[i % colors.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                                  </g>
                                );
                              });
                            })()}
                            <circle cx="50" cy="50" r="22" fill="white" />
                            <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="text-lg font-bold" fill="#171717">{c.score}</text>
                          </svg>
                        </div>
                        {/* Legend */}
                        <div className="flex-1 space-y-1.5">
                          {c.criteria.map((cr, i) => {
                            const colors = ["#171717", "#404040", "#737373", "#a3a3a3", "#d4d4d4", "#e5e5e5"];
                            return (
                              <div key={i} className="flex items-start gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm shrink-0 mt-0.5" style={{ backgroundColor: colors[i % colors.length] }} />
                                <div className="flex-1">
                                  <div className="flex justify-between">
                                    <span className="text-[11px] font-medium">{cr.name}</span>
                                    <span className="text-[11px] font-bold tabular-nums">{cr.score}/{cr.max}</span>
                                  </div>
                                  {cr.evidence && <p className="text-[10px] text-neutral-500 leading-tight">{cr.evidence}</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-4">
                      {(c.highlights||[]).length > 0 && <div>{c.highlights.map((h,i) => <span key={i} className="inline-block text-[10px] bg-neutral-50 border border-neutral-100 rounded px-1.5 py-0.5 mr-1 mb-1">+ {h}</span>)}</div>}
                      {(c.gaps||[]).length > 0 && <div>{c.gaps.map((g,i) => <span key={i} className="inline-block text-[10px] text-neutral-400 bg-neutral-50 border border-neutral-100 rounded px-1.5 py-0.5 mr-1 mb-1">- {g}</span>)}</div>}
                    </div>
                  </div>
                )}
              </div>
            );
            })}
          </div>
          );
        })()}

        {/* CARD VIEW */}
        {viewMode === "card" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {results.map(c => (
              <div key={c.id} className="border border-neutral-200 bg-white rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-neutral-400 font-mono">#{c.rank}</span>
                  <span className={`px-2 py-0.5 text-xs font-bold ${c.score >= 70 ? "bg-neutral-900 text-white" : c.score >= 50 ? "bg-neutral-100" : "text-neutral-400"}`}>{c.score}</span>
                </div>
                {c.photo_url ? <img src={c.photo_url} alt={c.name} className="w-16 h-16 rounded-xl object-cover mx-auto mb-3" /> : <div className="w-16 h-16 rounded-xl bg-neutral-100 mx-auto mb-3 flex items-center justify-center text-xl font-bold text-neutral-300">{c.name?.charAt(0)}</div>}
                <h3 className="font-semibold text-sm text-center mb-1">{c.name}</h3>
                <p className="text-[10px] text-neutral-500 text-center line-clamp-2">{c.reasoning}</p>
                {c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="block text-center text-[10px] text-neutral-400 hover:text-neutral-700 mt-2">LinkedIn</a>}
              </div>
            ))}
          </div>
        )}

        {/* TABLE VIEW */}
        {viewMode === "table" && (
          <div className="border border-neutral-200 bg-white rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500">#</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500">Candidate</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500">Score</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500">Reasoning</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500">Strengths</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500">Gaps</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500">LinkedIn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {results.map(c => (
                  <tr key={c.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-2 text-xs text-neutral-400">{c.rank}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        {c.photo_url ? <img src={c.photo_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" /> : null}
                        <span className="font-medium text-sm">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2"><span className={`px-2 py-0.5 text-xs font-bold ${c.score >= 70 ? "bg-neutral-900 text-white" : c.score >= 50 ? "bg-neutral-100" : "text-neutral-400"}`}>{c.score}</span></td>
                    <td className="px-4 py-2 text-xs text-neutral-500 max-w-sm">{c.reasoning}</td>
                    <td className="px-4 py-2 text-xs text-neutral-500">{(c.highlights||[]).slice(0,2).join(", ")}</td>
                    <td className="px-4 py-2 text-xs text-neutral-400">{(c.gaps||[]).slice(0,2).join(", ")}</td>
                    <td className="px-4 py-2">{c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs text-neutral-400 hover:text-neutral-700">Open</a>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── SETUP — compact, no-scroll power user flow ──
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <h1 className="text-2xl font-bold tracking-tight mb-6">New Match</h1>

      {/* 3-column: Role | CSV | JD — all visible without scrolling */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* 1. Role picker */}
        <div className="border border-neutral-200 bg-white rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 mb-2">1. Role</p>
          <button onClick={() => setShowPicker(!showPicker)} className="w-full text-left rounded border border-neutral-200 p-2 hover:bg-neutral-50 text-sm">
            <span className="font-medium">{role.title}</span>
            <span className="text-[10px] text-neutral-400 ml-1">{role.category}</span>
          </button>
          {showPicker && (
            <div className="mt-1 border border-neutral-200 rounded bg-white shadow-lg max-h-32 overflow-y-auto">
              <div className="p-1.5 border-b border-neutral-100 flex gap-1 flex-wrap">
                {["All", ...CATEGORIES].map(c => (
                  <button key={c} onClick={() => setCatFilter(c)} className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] ${catFilter === c ? "bg-neutral-900 text-white" : "text-neutral-500"}`}>{c}</button>
                ))}
              </div>
              {filteredRoles.map((r) => {
                const ri = ROLES.indexOf(r);
                return <button key={ri} onClick={() => pickRole(ri)} className="w-full text-left px-2 py-1.5 text-xs hover:bg-neutral-50">{r.title}</button>;
              })}
            </div>
          )}
        </div>

        {/* 2. CSV */}
        <div className="border border-neutral-200 bg-white rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 mb-2">2. Candidates</p>
          <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border border-dashed rounded py-6 text-center cursor-pointer transition-all ${dragging ? "border-neutral-900 bg-neutral-50" : fileName ? "border-neutral-300 bg-neutral-50" : "border-neutral-300 hover:border-neutral-400"}`}>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {fileName ? (
              <div><p className="text-xs font-medium">{fileName}</p><p className="text-[10px] text-neutral-400">{rowCount} candidates</p></div>
            ) : (
              <p className="text-xs text-neutral-400">Drop CSV or click</p>
            )}
          </div>
        </div>

        {/* 3. JD (collapsible) */}
        <div className="border border-neutral-200 bg-white rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 mb-2">3. Job Description</p>
          <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="w-full border border-neutral-100 rounded px-2 py-1.5 text-xs font-medium mb-1.5 focus:outline-none focus:border-neutral-300" />
          <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={3} className="w-full border border-neutral-100 rounded px-2 py-1.5 text-[10px] resize-none focus:outline-none focus:border-neutral-300 leading-relaxed" />
        </div>
      </div>

      {/* Judge selection — big, visual, the main event */}
      <div className="border border-neutral-200 bg-white rounded-lg p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold">Choose Your Judge</p>
          <span className={`text-xs tabular-nums ${criteria.reduce((s, c) => s + c.weight, 0) === 100 ? "text-neutral-400" : "text-red-500 font-medium"}`}>
            {criteria.reduce((s, c) => s + c.weight, 0)}%
          </span>
        </div>

        {/* Judge cards — big */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-5">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button key={key} onClick={() => selectPreset(key)}
              className={`rounded-xl p-4 text-center transition-all duration-300 ${selectedPreset === key ? "bg-neutral-900 text-white shadow-lg scale-105 ring-2 ring-neutral-900 ring-offset-2" : "border border-neutral-200 hover:border-neutral-400 hover:shadow-sm"}`}>
              <div className="text-base font-semibold font-serif italic leading-tight">{preset.label}</div>
              <div className={`text-[9px] mt-1.5 leading-tight ${selectedPreset === key ? "text-neutral-400" : "text-neutral-400"}`}>{preset.desc}</div>
            </button>
          ))}
        </div>

        {/* Ideal candidate profile — inline editable fields + freeform */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-neutral-500">Ideal Candidate Profile</p>
            <button onClick={() => setProfileMode(profileMode === "fields" ? "text" : "fields")}
              className="text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors">
              {profileMode === "fields" ? "Edit as text" : "Back to fields"}
            </button>
          </div>
          {profileMode === "text" ? (
            <textarea value={idealCandidate} onChange={e => { setIdealCandidate(e.target.value); setSelectedPreset("custom"); }}
              rows={4} placeholder="Describe your ideal candidate in plain language..."
              className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-700 resize-y focus:outline-none focus:border-neutral-400 leading-relaxed" />
          ) : (
            <div className="border border-neutral-200 rounded-lg p-3 space-y-2.5 overflow-hidden">
              {([
                ["years_experience", "Experience", ["1-2 yr", "2-3 yr", "3-5 yr", "5-8 yr", "8+"]],
                ["industries", "Industries", ["tech", "finserv", "legal", "consulting", "healthcare", "SaaS"]],
                ["sales_focus", "Focus", ["SMB", "mid-market", "enterprise", "PLG"]],
                ["buyer_personas", "Buyer", ["C-suite", "VP/Dir", "Dept Head", "Technical", "End-user"]],
                ["location", "Location", ["NYC", "SF", "Remote", "Austin", "Chicago", "Boston"]],
                ["background", "Background", ["consulting", "banking", "law", "founder", "big tech", "SDR/BDR"]],
              ] as [keyof typeof idealProfile, string, string[]][]).map(([key, label, options]) => (
                <div key={key} className="flex items-center gap-2 min-w-0">
                  <span className="text-[9px] text-neutral-400 w-16 shrink-0 text-right uppercase tracking-wider leading-tight">{label}</span>
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {options.map(opt => {
                      const current = idealProfile[key].toLowerCase();
                      const active = current.includes(opt.toLowerCase()) || current.includes(opt.split("/")[0].toLowerCase());
                      return (
                        <button key={opt} onClick={() => {
                          const val = idealProfile[key];
                          const newVal = active
                            ? val.split(",").map(s => s.trim()).filter(s => !s.toLowerCase().includes(opt.toLowerCase())).join(", ")
                            : val ? `${val}, ${opt}` : opt;
                          setIdealProfile(prev => ({ ...prev, [key]: newVal }));
                          setSelectedPreset("custom");
                        }}
                          className={`px-1.5 py-0.5 rounded text-[10px] transition-colors shrink-0 ${active ? "bg-neutral-900 text-white" : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100 border border-neutral-200"}`}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Criteria weights — compact */}
        <p className="text-xs font-medium text-neutral-500 mb-2">Criteria Weights</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
          {criteria.map((c, i) => (
            <div key={c.name || i} className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-600 w-20 shrink-0 truncate">{c.name}</span>
              <input type="range" min={0} max={50} value={c.weight}
                onChange={e => { setSelectedPreset("custom"); const n = [...criteria]; n[i] = { ...n[i], weight: parseInt(e.target.value) }; setCriteria(n); }}
                className="flex-1 h-1 bg-neutral-100 rounded-full appearance-none cursor-pointer min-w-0"
                style={{ background: `linear-gradient(to right, #171717 ${c.weight * 2}%, #f5f5f5 ${c.weight * 2}%)` }} />
              <span className="text-[10px] font-bold tabular-nums text-neutral-500 w-7 text-right">{c.weight}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Score button + top K */}
      <div className="flex items-center gap-3 mb-2">
        {rowCount > 0 && (
          <div className="flex items-center gap-1 fade-in">
            <span className="text-[10px] text-neutral-400 mr-1">Top</span>
            {[10, 25, 50, 100].map(n => (
              <button key={n} onClick={() => setTopK(n)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-all duration-200 ${topK === n ? "bg-neutral-900 text-white" : "border border-neutral-200 text-neutral-400 hover:border-neutral-400"}`}>
                {n}
              </button>
            ))}
            {rowCount > 100 && (
              <button onClick={() => setTopK(rowCount)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-all duration-200 ${topK === rowCount ? "bg-neutral-900 text-white" : "border border-neutral-200 text-neutral-400"}`}>
                All
              </button>
            )}
          </div>
        )}
        <div className="flex-1" />
      </div>
      <button onClick={startScoring} disabled={!csvText || rowCount === 0}
        className="w-full py-3.5 bg-neutral-900 text-white font-semibold text-sm rounded-lg hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.99]">
        <span key={topK} style={{ animation: "fadeIn 0.2s ease-out" }}>
          Score {rowCount > 0 ? (rowCount > topK ? `top ${topK} of ${rowCount}` : `${rowCount}`) : ""} candidates for {jobTitle}
        </span>
      </button>
    </div>
  );
}

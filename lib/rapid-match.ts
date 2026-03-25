import { Role } from "./roles";

export interface RapidCandidate {
  id: string;
  name: string;
  yearsExperience: number;
  industries: string[];
  currentCity: string;
  currentState: string;
  desiredCities: string[];
  willingToRelocate: boolean;
  workingStyle: string;
  letterGrade: string;
  sdrGrade: string;
  aeGrade: string;
  skills: string[];
  toolExperience: string[];
  methodologies: string[];
  dealSizes: string[];
  buyerPersonas: string[];
  departmentsSoldTo: string[];
  salesFocus: string[];
  companyExperience: string;
  rankingWithinTeam: number;
  baseSalaryMin: number;
  oteMin: number;
  jobTitle: string;
  headline: string;
  highlights: string;
  competencies: string;
  linkedinUrl: string;
  photoUrl: string;
  resumeSnippet: string;
  outboundStrategy: string;
  salesCycleDescription: string;
  prevSalesEnv: string;
  whySales: string;
}

export interface RapidResult {
  id: string;
  rank: number;
  name: string;
  score: number;
  reasoning: string;
  highlights: string[];
  gaps: string[];
  photo_url: string;
  linkedin_url: string;
  breakdown: { name: string; score: number; max: number; detail: string }[];
}

// ── Helpers ──

function tryParseJSONArray(val: string): string[] {
  if (!val || val === "[]" || val === "null") return [];
  try {
    const parsed = JSON.parse(val.replace(/'/g, '"'));
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {}
  return val.split(",").map(s => s.trim().replace(/^["'\[\]]+|["'\[\]]+$/g, "")).filter(Boolean);
}

function parseLocationJSON(val: string): { city: string; state: string } {
  if (!val) return { city: "", state: "" };
  try {
    const obj = JSON.parse(val);
    return { city: obj.city || "", state: obj.state || "" };
  } catch {}
  return { city: val, state: "" };
}

function parseLocationArrayJSON(val: string): string[] {
  if (!val || val === "[]" || val === "null") return [];
  try {
    const arr = JSON.parse(val);
    if (Array.isArray(arr)) {
      return arr.map((o: { city?: string; state?: string }) => {
        if (typeof o === "string") return o;
        return [o.city, o.state].filter(Boolean).join(", ");
      }).filter(Boolean);
    }
  } catch {}
  return [];
}

function gradeToNumber(g: string): number {
  const map: Record<string, number> = { S: 100, "A+": 95, A: 90, "A-": 85, "B+": 80, B: 75, "B-": 70, "C+": 65, C: 60, "C-": 55, "D+": 50, D: 45, "D-": 40, F: 20, "": 0 };
  return map[g.toUpperCase().trim()] ?? 0;
}

function getField(row: Record<string, string>, ...names: string[]): string {
  for (const n of names) {
    const key = Object.keys(row).find(k => k.toLowerCase().trim() === n.toLowerCase());
    if (key && row[key] && row[key] !== "null" && row[key] !== "[]" && row[key] !== "{}") return row[key].trim();
  }
  return "";
}

// Known LinkedIn slug → name mappings
const SLUG_NAMES: Record<string, string> = {
  taronarshakian: "Taron Arshakian",
  katherinestiplosek: "Katherine Stiplosek",
  sifathmannan: "Sifath Mannan",
  porges: "Matt Porges",
  henrysmith1997: "Henry Smith",
  ethanfaber: "Ethan Faber",
  kylereinheimer: "Kyle Reinheimer",
  andrewthompson123: "Andrew Thompson",
  dhanushsivakaminathan: "Dhanush Sivakaminathan",
  danielmbarrett1: "Daniel Barrett",
  swarajagarwal: "Swaraj Agarwal",
  davidkeptsi: "David Keptsi",
  imboywa: "Gil Imboywa",
  davidneiltraub: "David Traub",
  awschleifer: "Ami Schleifer",
  rebekahcturner24: "Rebekah Turner",
  abbietulloch: "Abbie Tulloch",
  caioteig: "Caio Teig",
  jolinferro: "Jo-Lin Ferro",
  "-emilyshih": "Emily Shih",
  arjunr111: "Arjun Raman",
  "emily%7edominguez": "Emily Dominguez",
  "emily~dominguez": "Emily Dominguez",
};

function detectName(row: Record<string, string>): string {
  // 1. Direct name fields
  for (const p of ["name", "full_name", "fullname", "candidate_name"]) {
    const v = getField(row, p);
    if (v && v.length > 1 && v.length < 60) return v;
  }

  // 2. LinkedIn first + last
  const first = getField(row, "linkedin_first_name", "first_name");
  const last = getField(row, "linkedin_last_name", "last_name");
  if (first && last) return `${first} ${last}`;
  if (first) return first;

  // 3. Extract from grade reasoning ("Christine is a strong SDR candidate...")
  for (const f of ["sdr_grade_reasoning", "ae_grade_reasoning", "letter_grade_reasoning"]) {
    const t = getField(row, f);
    if (t) {
      const m = t.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s(?:is|has|shows|demonstrates|would|could|brings|lacks|excels|possesses|presents|stands|appears|comes|scored|earned|received|holds|maintains|displays)/);
      if (m && m[1].length > 2 && m[1].length < 30) return m[1];
    }
  }

  // 4. Extract from resume_text first lines
  const resume = getField(row, "resume_text");
  if (resume) {
    const skip = new Set(["experience", "education", "skills", "summary", "objective", "professional", "career", "work"]);
    for (const line of resume.split("\n").map(l => l.trim()).filter(Boolean).slice(0, 3)) {
      if (skip.has(line.toLowerCase())) continue;
      if (line.length > 2 && line.length < 40 && !/[@|•\d]/.test(line) && /^[A-Za-z\s.\-']+$/.test(line)) return line;
    }
  }

  // 5. LinkedIn URL slug
  const linkedinUrl = getField(row, "linkedin_url", "linkedin_flagship_url", "linkedin_profile_url");
  if (linkedinUrl) {
    const match = linkedinUrl.match(/linkedin\.com\/in\/([^/?]+)/);
    if (match) {
      const slug = decodeURIComponent(match[1]).replace(/\/$/, "").toLowerCase();
      if (SLUG_NAMES[slug]) return SLUG_NAMES[slug];
      // Split on hyphens, keep alpha parts 2+ chars, need at least 2
      if (slug.includes("-")) {
        const parts = slug.split("-").filter(p => p.length > 1 && /^[a-z]+$/i.test(p));
        if (parts.length >= 2) {
          return parts.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
        }
      }
      // Single word slugs — capitalize
      if (/^[a-z]+$/i.test(slug) && slug.length > 2 && slug.length < 20) {
        return slug.charAt(0).toUpperCase() + slug.slice(1);
      }
    }
  }

  return `Candidate ${(getField(row, "id") || getField(row, "user_id") || "?").substring(0, 8)}`;
}

// ── CSV parser ──

export function parseStructuredCSV(raw: string): RapidCandidate[] {
  const rows: string[][] = [];
  let fields: string[] = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inQ) {
      if (ch === '"') { if (raw[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') { fields.push(field); field = ""; }
      else if (ch === '\n' || (ch === '\r' && raw[i + 1] === '\n')) {
        fields.push(field);
        if (fields.length > 1 || fields[0]) rows.push(fields);
        fields = []; field = "";
        if (ch === '\r') i++;
      } else field += ch;
    }
  }
  if (field || fields.length) { fields.push(field); rows.push(fields); }

  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim());
  const candidates: RapidCandidate[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    const filled = values.filter(v => v && v.trim() && v.trim() !== "null" && v.trim() !== "[]").length;
    if (filled < 2) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = (values[idx] || "").trim(); });

    const loc = parseLocationJSON(getField(row, "current_location"));
    const desiredLocs = parseLocationArrayJSON(getField(row, "desired_locations"));

    candidates.push({
      id: getField(row, "id", "user_id") || `row-${i}`,
      name: detectName(row),
      yearsExperience: parseFloat(getField(row, "total_years_sales_experience")) || 0,
      industries: tryParseJSONArray(getField(row, "industries")),
      currentCity: loc.city,
      currentState: loc.state,
      desiredCities: desiredLocs,
      willingToRelocate: getField(row, "willing_to_relocate") === "t" || getField(row, "willing_to_relocate").toLowerCase() === "true",
      workingStyle: getField(row, "preferred_working_style_new"),
      letterGrade: getField(row, "letter_grade"),
      sdrGrade: getField(row, "sdr_grade"),
      aeGrade: getField(row, "ae_grade"),
      skills: tryParseJSONArray(getField(row, "skills")),
      toolExperience: tryParseJSONArray(getField(row, "sales_tool_experience")),
      methodologies: tryParseJSONArray(getField(row, "sales_methodologies")),
      dealSizes: tryParseJSONArray(getField(row, "deal_sizes")),
      buyerPersonas: tryParseJSONArray(getField(row, "buyer_personas")),
      departmentsSoldTo: tryParseJSONArray(getField(row, "departments_sold_to")),
      salesFocus: tryParseJSONArray(getField(row, "sales_focus_new")),
      companyExperience: getField(row, "company_experience_new"),
      rankingWithinTeam: parseFloat(getField(row, "ranking_within_team_new")) || 0,
      baseSalaryMin: parseFloat(getField(row, "base_salary_min")) || 0,
      oteMin: parseFloat(getField(row, "ote_min")) || 0,
      jobTitle: getField(row, "job_title", "source_job_title"),
      headline: getField(row, "linkedin_headline"),
      highlights: getField(row, "highlights"),
      competencies: getField(row, "competencies"),
      linkedinUrl: getField(row, "linkedin_url", "linkedin_flagship_url", "linkedin_profile_url"),
      photoUrl: getField(row, "profile_picture_storage", "altered_profile_picture_storage"),
      resumeSnippet: (getField(row, "resume_text") || getField(row, "sales_career_overview") || "").substring(0, 500),
      outboundStrategy: getField(row, "outbound_strategy_example"),
      salesCycleDescription: getField(row, "sales_cycle_description"),
      prevSalesEnv: getField(row, "prev_sales_env"),
      whySales: getField(row, "why_sales"),
    });
  }
  return candidates;
}

// ── Scoring engine ──

interface RoleConfig {
  title: string;
  description: string;
  category: string;
  locations: string[];
  remote: boolean;
  keywords: string[];
  minYears: number;
  maxYears: number;
  wantsSalesFocus: string[]; // enterprise, mid-market, smb
  wantsBuyerPersonas: string[]; // c-suite, vp, department-head, etc.
}

function extractRoleConfig(role: Role): RoleConfig {
  const expMatch = role.experience?.match(/(\d+)-(\d+)/);
  const minYears = expMatch ? parseInt(expMatch[1]) : 0;
  const maxYears = expMatch ? parseInt(expMatch[2]) : 20;
  const desc = (role.description || "").toLowerCase();

  // Extract skill/tool keywords
  const keywords: string[] = [];
  const kwPatterns = [
    "salesforce", "outreach", "salesloft", "gong", "hubspot", "marketo",
    "apollo", "linkedin sales navigator", "clari",
    "meddic", "challenger", "spin",
    "cold call", "outbound", "inbound",
    "python", "react", "node", "typescript", "sql",
    "pytorch", "tensorflow",
    "pipeline", "quota", "revenue", "arr", "demo",
    "president's club", "top 10%", "top 20%",
  ];
  for (const kw of kwPatterns) if (desc.includes(kw)) keywords.push(kw);

  // Extract sales focus wants
  const wantsSalesFocus: string[] = [];
  if (desc.includes("enterprise")) wantsSalesFocus.push("enterprise");
  if (desc.includes("mid-market")) wantsSalesFocus.push("mid-market");
  if (desc.includes("smb") || desc.includes("small")) wantsSalesFocus.push("smb");
  if (desc.includes("full-cycle") || desc.includes("full cycle")) wantsSalesFocus.push("full-cycle");

  // Extract buyer persona wants
  const wantsBuyerPersonas: string[] = [];
  if (desc.includes("c-suite") || desc.includes("cfo") || desc.includes("cro") || desc.includes("gc") || desc.includes("ceo") || desc.includes("cto")) wantsBuyerPersonas.push("c-suite-decision-maker");
  if (desc.includes("vp") || desc.includes("director")) wantsBuyerPersonas.push("vp-director", "department-head");
  if (desc.includes("technical")) wantsBuyerPersonas.push("technical-evaluator");
  if (desc.includes("procurement")) wantsBuyerPersonas.push("procurement");

  return { ...role, keywords, minYears, maxYears, wantsSalesFocus, wantsBuyerPersonas };
}

// ── Individual scoring dimensions ──

function scoreExperience(c: RapidCandidate, min: number, max: number): { score: number; detail: string } {
  const yrs = c.yearsExperience;
  if (yrs === 0) return { score: 5, detail: "No experience data" };
  if (yrs >= min && yrs <= max) return { score: 20, detail: `${yrs}yr experience — perfect fit (${min}-${max}yr range)` };
  if (yrs > max && yrs <= max + 2) return { score: 16, detail: `${yrs}yr — slightly senior for ${min}-${max}yr range` };
  if (yrs > max + 2) return { score: 8, detail: `${yrs}yr — overqualified for ${min}-${max}yr range` };
  if (yrs === min - 1) return { score: 14, detail: `${yrs}yr — just under ${min}yr minimum` };
  return { score: 4, detail: `${yrs}yr — below ${min}yr minimum` };
}

function scoreLocation(c: RapidCandidate, roleLocations: string[], remote: boolean): { score: number; detail: string } {
  const candidateCities = [c.currentCity, ...c.desiredCities.map(d => d.split(",")[0]?.trim())].filter(Boolean);

  if (candidateCities.length === 0 && !c.currentState) {
    return { score: 0, detail: "No location data" };
  }

  // Check city match
  for (const rl of roleLocations) {
    const roleCityLower = rl.toLowerCase();
    for (const cc of candidateCities) {
      if (cc.toLowerCase().includes(roleCityLower) || roleCityLower.includes(cc.toLowerCase())) {
        return { score: 15, detail: `Location match: ${cc}` };
      }
    }
  }

  // Remote + willing
  if (remote && (c.workingStyle?.toLowerCase().includes("remote") || c.willingToRelocate)) {
    return { score: 12, detail: "Remote-compatible" };
  }

  if (c.willingToRelocate) {
    return { score: 8, detail: `Willing to relocate from ${c.currentCity || c.currentState}` };
  }

  return { score: 2, detail: `${c.currentCity || c.currentState} — not in ${roleLocations.slice(0, 3).join(", ")}` };
}

function scoreGrades(c: RapidCandidate, category: string): { score: number; detail: string } {
  // For sales roles, combine SDR + AE grades with weighting based on role type
  const hasSdr = !!c.sdrGrade;
  const hasAe = !!c.aeGrade;
  const hasLetter = !!c.letterGrade;

  if (!hasSdr && !hasAe && !hasLetter) return { score: 0, detail: "No grade data" };

  const sdrNum = gradeToNumber(c.sdrGrade);
  const aeNum = gradeToNumber(c.aeGrade);
  const letterNum = gradeToNumber(c.letterGrade);

  // Combine available grades
  let combined = 0;
  let parts: string[] = [];
  let count = 0;

  if (hasSdr) { combined += sdrNum; parts.push(`SDR: ${c.sdrGrade}`); count++; }
  if (hasAe) { combined += aeNum; parts.push(`AE: ${c.aeGrade}`); count++; }
  if (hasLetter) { combined += letterNum; parts.push(`Overall: ${c.letterGrade}`); count++; }

  const avg = combined / count;
  const score = Math.round((avg / 100) * 20);

  return { score, detail: parts.join(", ") + ` (avg ${Math.round(avg)}/100)` };
}

function scoreSalesFocus(c: RapidCandidate, wantsFocus: string[]): { score: number; detail: string } {
  if (wantsFocus.length === 0) return { score: 8, detail: "No specific focus required" };
  if (c.salesFocus.length === 0) return { score: 3, detail: "No sales focus data" };

  const matched = wantsFocus.filter(wf =>
    c.salesFocus.some(sf => sf.toLowerCase().includes(wf.toLowerCase()) || wf.toLowerCase().includes(sf.toLowerCase()))
  );

  if (matched.length === wantsFocus.length) return { score: 10, detail: `Focus match: ${matched.join(", ")}` };
  if (matched.length > 0) return { score: 7, detail: `Partial focus: ${matched.join(", ")} (missing ${wantsFocus.filter(w => !matched.includes(w)).join(", ")})` };
  return { score: 2, detail: `Focus mismatch: has ${c.salesFocus.join(", ")}, needs ${wantsFocus.join(", ")}` };
}

function scoreBuyerPersonas(c: RapidCandidate, wantsPersonas: string[]): { score: number; detail: string } {
  if (wantsPersonas.length === 0) return { score: 5, detail: "No persona requirements" };
  if (c.buyerPersonas.length === 0) return { score: 2, detail: "No buyer persona data" };

  const matched = wantsPersonas.filter(wp =>
    c.buyerPersonas.some(bp => bp.toLowerCase().includes(wp.toLowerCase()) || wp.toLowerCase().includes(bp.toLowerCase()))
  );

  if (matched.length > 0) return { score: 10, detail: `Persona match: ${c.buyerPersonas.slice(0, 3).map(b => b.replace(/-/g, " ")).join(", ")}` };
  return { score: 2, detail: `No persona overlap: has ${c.buyerPersonas.slice(0, 2).map(b => b.replace(/-/g, " ")).join(", ")}` };
}

function scoreIndustry(c: RapidCandidate, description: string): { score: number; detail: string } {
  if (c.industries.length === 0) return { score: 0, detail: "No industry data" };
  const descLower = description.toLowerCase();

  // Map industry values to broader keywords
  const industryKeywords: Record<string, string[]> = {
    technology: ["tech", "saas", "software", "ai"],
    "financial-services": ["financ", "banking", "fintech"],
    healthcare: ["health", "medical", "pharma"],
    legal: ["legal", "law"],
    "media-advertising": ["media", "advertising", "marketing"],
    retail: ["retail", "commerce", "consumer"],
    "real-estate": ["real estate", "property"],
    education: ["education", "edtech"],
    hospitality: ["hospitality", "travel"],
    other: [],
  };

  const matched: string[] = [];
  for (const ind of c.industries) {
    const indLower = ind.toLowerCase();
    if (descLower.includes(indLower)) { matched.push(ind); continue; }
    const aliases = industryKeywords[indLower] || [];
    if (aliases.some(a => descLower.includes(a))) { matched.push(ind); }
  }

  if (matched.length > 0) return { score: 10, detail: `Industry match: ${matched.join(", ")}` };
  if (c.industries.length >= 3) return { score: 5, detail: `Diverse: ${c.industries.slice(0, 3).join(", ")}` };
  return { score: 2, detail: `Industries: ${c.industries.join(", ")}` };
}

function scoreTeamRanking(c: RapidCandidate): { score: number; detail: string } {
  const rank = c.rankingWithinTeam;
  if (!rank) return { score: 0, detail: "No ranking data" };
  // Lower rank number = better (top 1 is best, top 4 is good, etc.)
  if (rank <= 5) return { score: 10, detail: `Top ${rank} on team — elite performer` };
  if (rank <= 15) return { score: 8, detail: `Top ${rank} on team — strong performer` };
  if (rank <= 25) return { score: 6, detail: `Top ${rank} on team — above average` };
  if (rank <= 50) return { score: 4, detail: `Top ${rank} on team — average` };
  return { score: 2, detail: `Rank ${rank} on team` };
}

function scoreDataCompleteness(c: RapidCandidate): { score: number; detail: string } {
  // Reward candidates who filled out more profile data — they're more serious
  let filled = 0;
  if (c.yearsExperience > 0) filled++;
  if (c.industries.length > 0) filled++;
  if (c.currentCity) filled++;
  if (c.sdrGrade || c.aeGrade || c.letterGrade) filled++;
  if (c.salesFocus.length > 0) filled++;
  if (c.buyerPersonas.length > 0) filled++;
  if (c.rankingWithinTeam > 0) filled++;
  if (c.resumeSnippet) filled++;
  if (c.outboundStrategy) filled++;
  if (c.headline || c.jobTitle) filled++;

  const score = Math.min(5, Math.round((filled / 10) * 5));
  return { score, detail: `${filled}/10 profile sections completed` };
}

// ── Main scorer ──

export function rapidScoreAll(candidates: RapidCandidate[], role: Role): RapidResult[] {
  const config = extractRoleConfig(role);

  const results: RapidResult[] = candidates.map(c => {
    const exp = scoreExperience(c, config.minYears, config.maxYears);
    const loc = scoreLocation(c, config.locations, config.remote);
    const grd = scoreGrades(c, config.category);
    const foc = scoreSalesFocus(c, config.wantsSalesFocus);
    const per = scoreBuyerPersonas(c, config.wantsBuyerPersonas);
    const ind = scoreIndustry(c, config.description);
    const rnk = scoreTeamRanking(c);
    const cmp = scoreDataCompleteness(c);

    const breakdown = [
      { name: "Experience", score: exp.score, max: 20, detail: exp.detail },
      { name: "Location", score: loc.score, max: 15, detail: loc.detail },
      { name: "Grades", score: grd.score, max: 20, detail: grd.detail },
      { name: "Sales Focus", score: foc.score, max: 10, detail: foc.detail },
      { name: "Buyer Personas", score: per.score, max: 10, detail: per.detail },
      { name: "Industry", score: ind.score, max: 10, detail: ind.detail },
      { name: "Team Ranking", score: rnk.score, max: 10, detail: rnk.detail },
      { name: "Profile", score: cmp.score, max: 5, detail: cmp.detail },
    ];

    const rawScore = breakdown.reduce((s, b) => s + b.score, 0);
    const maxPossible = breakdown.reduce((s, b) => s + b.max, 0);
    const score = Math.round((rawScore / maxPossible) * 100);

    // Build reasoning
    const strengths = breakdown.filter(b => b.score >= b.max * 0.7).map(b => b.detail);
    const weaknesses = breakdown.filter(b => b.score <= b.max * 0.3 && b.max > 0).map(b => b.detail);

    const reasoningParts: string[] = [];
    if (c.headline) reasoningParts.push(c.headline + ".");
    else if (c.jobTitle) reasoningParts.push(`Currently: ${c.jobTitle}.`);
    if (c.yearsExperience > 0) reasoningParts.push(`${c.yearsExperience}yr experience.`);
    if (c.currentCity) reasoningParts.push(`Based in ${c.currentCity}${c.currentState ? `, ${c.currentState}` : ""}.`);
    if (c.sdrGrade || c.aeGrade) reasoningParts.push(`Grades: ${[c.sdrGrade && `SDR ${c.sdrGrade}`, c.aeGrade && `AE ${c.aeGrade}`].filter(Boolean).join(", ")}.`);
    if (c.industries.length > 0) reasoningParts.push(`Industries: ${c.industries.join(", ")}.`);

    return {
      id: c.id,
      rank: 0,
      name: c.name,
      score,
      reasoning: reasoningParts.join(" "),
      highlights: strengths.slice(0, 4),
      gaps: weaknesses.slice(0, 4),
      photo_url: c.photoUrl || "",
      linkedin_url: c.linkedinUrl || "",
      breakdown,
    };
  });

  results.sort((a, b) => b.score - a.score);
  results.forEach((r, i) => r.rank = i + 1);

  return results;
}

import { Role } from "./roles";

export interface RapidCandidate {
  id: string;
  name: string;
  yearsExperience: number;
  industries: string[];
  currentLocation: string;
  desiredLocations: string[];
  willingToRelocate: boolean;
  workingStyle: string;
  letterGrade: string;
  sdrGrade: string;
  aeGrade: string;
  skills: string[];
  methodologies: string[];
  dealSizes: string[];
  buyerPersonas: string[];
  departmentsSoldTo: string[];
  salesFocus: string;
  companyExperience: string;
  rankingWithinTeam: string;
  baseSalaryMin: number;
  oteMin: number;
  jobTitle: string;
  headline: string;
  highlights: string;
  competencies: string;
  linkedinUrl: string;
  photoUrl: string;
  resumeSnippet: string;
  rawFields: Record<string, string>;
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

// ── Parse structured fields from CSV ──

function tryParseJSON(val: string): string[] {
  if (!val || val === "[]" || val === "null") return [];
  try {
    const parsed = JSON.parse(val.replace(/'/g, '"'));
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {}
  // Fallback: comma-separated
  return val.split(",").map(s => s.trim().replace(/^["'\[\]]+|["'\[\]]+$/g, "")).filter(Boolean);
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

function detectName(row: Record<string, string>): string {
  // Try direct name fields
  for (const p of ["name", "full_name", "fullname", "candidate_name", "candidate"]) {
    const v = getField(row, p);
    if (v && v.length > 1 && v.length < 60) return v;
  }
  // Try first + last
  const first = getField(row, "linkedin_first_name", "first_name", "firstname");
  const last = getField(row, "linkedin_last_name", "last_name", "lastname");
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  // Try headline
  const headline = getField(row, "linkedin_headline");
  if (headline) {
    const parts = headline.split(/[|,\-–]/).map(s => s.trim());
    if (parts[0] && parts[0].length < 40) return parts[0];
  }
  // Fallback to ID
  return `Candidate ${(getField(row, "id") || getField(row, "user_id") || "?").substring(0, 8)}`;
}

export function parseStructuredCSV(raw: string): RapidCandidate[] {
  // Parse CSV
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

    candidates.push({
      id: getField(row, "id", "user_id") || `row-${i}`,
      name: detectName(row),
      yearsExperience: parseFloat(getField(row, "total_years_sales_experience")) || 0,
      industries: tryParseJSON(getField(row, "industries")),
      currentLocation: getField(row, "current_location"),
      desiredLocations: getField(row, "desired_locations").split(",").map(s => s.trim()).filter(Boolean),
      willingToRelocate: getField(row, "willing_to_relocate") === "t" || getField(row, "willing_to_relocate").toLowerCase() === "true",
      workingStyle: getField(row, "preferred_working_style_new"),
      letterGrade: getField(row, "letter_grade"),
      sdrGrade: getField(row, "sdr_grade"),
      aeGrade: getField(row, "ae_grade"),
      skills: tryParseJSON(getField(row, "skills")),
      methodologies: tryParseJSON(getField(row, "sales_methodologies")),
      dealSizes: tryParseJSON(getField(row, "deal_sizes")),
      buyerPersonas: getField(row, "buyer_personas").split(",").map(s => s.trim()).filter(Boolean),
      departmentsSoldTo: getField(row, "departments_sold_to").split(",").map(s => s.trim()).filter(Boolean),
      salesFocus: getField(row, "sales_focus_new"),
      companyExperience: getField(row, "company_experience_new"),
      rankingWithinTeam: getField(row, "ranking_within_team_new"),
      baseSalaryMin: parseFloat(getField(row, "base_salary_min")) || 0,
      oteMin: parseFloat(getField(row, "ote_min")) || 0,
      jobTitle: getField(row, "job_title", "source_job_title"),
      headline: getField(row, "linkedin_headline"),
      highlights: getField(row, "highlights"),
      competencies: getField(row, "competencies"),
      linkedinUrl: getField(row, "linkedin_url", "linkedin_flagship_url", "linkedin_profile_url"),
      photoUrl: getField(row, "profile_picture_storage", "altered_profile_picture_storage"),
      resumeSnippet: (getField(row, "resume_text") || getField(row, "sales_career_overview") || "").substring(0, 500),
      rawFields: row,
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
  experience: string; // e.g. "1-4yr"
  // Extracted from description for matching
  keywords: string[];
  minYears: number;
  maxYears: number;
}

function extractRoleConfig(role: Role): RoleConfig {
  const expMatch = role.experience?.match(/(\d+)-(\d+)/);
  const minYears = expMatch ? parseInt(expMatch[1]) : 0;
  const maxYears = expMatch ? parseInt(expMatch[2]) : 20;

  // Extract keywords from description
  const desc = (role.description || "").toLowerCase();
  const keywords: string[] = [];
  const kwPatterns = [
    "salesforce", "outreach", "salesloft", "gong", "hubspot", "marketo", "linkedin",
    "meddic", "challenger", "spin", "cold call", "outbound", "inbound",
    "enterprise", "mid-market", "smb", "saas", "b2b",
    "python", "react", "node", "typescript", "sql",
    "pytorch", "tensorflow", "ml", "ai",
    "c-suite", "vp", "cfo", "cro", "cto",
    "legal", "healthcare", "fintech", "cybersecurity",
    "pipeline", "quota", "revenue", "arr",
    "president's club", "top 10%", "top 20%",
  ];
  for (const kw of kwPatterns) {
    if (desc.includes(kw)) keywords.push(kw);
  }

  return { ...role, keywords, minYears, maxYears };
}

function fuzzyContains(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function locationMatch(candidate: RapidCandidate, roleLocations: string[], remote: boolean): { score: number; detail: string } {
  if (remote && (candidate.workingStyle?.toLowerCase().includes("remote") || candidate.willingToRelocate)) {
    return { score: 15, detail: "Remote-friendly role, candidate open to remote" };
  }

  const candidateLocs = [candidate.currentLocation, ...candidate.desiredLocations].filter(Boolean).map(l => l.toLowerCase());
  for (const rl of roleLocations) {
    for (const cl of candidateLocs) {
      if (cl.includes(rl.toLowerCase()) || rl.toLowerCase().includes(cl.split(",")[0]?.trim())) {
        return { score: 15, detail: `Location match: ${rl}` };
      }
    }
  }

  if (candidate.willingToRelocate) {
    return { score: 10, detail: "Willing to relocate" };
  }

  if (candidateLocs.length === 0) {
    return { score: 5, detail: "No location data" };
  }

  return { score: 0, detail: `Location mismatch: ${candidate.currentLocation || "unknown"} vs ${roleLocations.join(", ")}` };
}

function experienceMatch(candidate: RapidCandidate, min: number, max: number): { score: number; detail: string } {
  const yrs = candidate.yearsExperience;
  if (yrs === 0) return { score: 8, detail: "No experience data provided" };
  if (yrs >= min && yrs <= max) return { score: 20, detail: `${yrs} years — within ${min}-${max}yr range` };
  if (yrs > max && yrs <= max + 3) return { score: 15, detail: `${yrs} years — slightly over ${max}yr max but valuable` };
  if (yrs > max + 3) return { score: 8, detail: `${yrs} years — overqualified for ${min}-${max}yr range` };
  if (yrs >= min - 1) return { score: 12, detail: `${yrs} years — just under ${min}yr minimum` };
  return { score: 3, detail: `${yrs} years — under ${min}yr minimum` };
}

function gradeMatch(candidate: RapidCandidate, category: string): { score: number; detail: string } {
  // Use SDR grade for entry-level sales, AE grade for closing roles, letter_grade as fallback
  let grade = candidate.letterGrade;
  let gradeType = "Overall";

  if (["Sales", "GTM"].includes(category)) {
    if (candidate.sdrGrade && ["SDR", "BDR", "Business Development"].some(k => candidate.jobTitle?.includes(k) || candidate.salesFocus?.includes(k.toLowerCase()))) {
      grade = candidate.sdrGrade;
      gradeType = "SDR";
    } else if (candidate.aeGrade) {
      grade = candidate.aeGrade;
      gradeType = "AE";
    }
  }

  if (!grade) return { score: 5, detail: "No grade data" };

  const num = gradeToNumber(grade);
  const score = Math.round((num / 100) * 20);
  return { score, detail: `${gradeType} grade: ${grade} (${num}/100)` };
}

function skillsMatch(candidate: RapidCandidate, keywords: string[], description: string): { score: number; detail: string } {
  const allCandidateText = [
    ...candidate.skills,
    ...candidate.methodologies,
    candidate.competencies,
    candidate.highlights,
    candidate.jobTitle,
    candidate.headline,
    candidate.resumeSnippet,
  ].join(" ").toLowerCase();

  const matched: string[] = [];
  const missed: string[] = [];

  for (const kw of keywords) {
    if (allCandidateText.includes(kw.toLowerCase())) {
      matched.push(kw);
    } else {
      missed.push(kw);
    }
  }

  // Also check for deal size / buyer persona alignment from description
  const descLower = description.toLowerCase();
  if (descLower.includes("enterprise") && candidate.dealSizes.some(d => d.toLowerCase().includes("enterprise") || d.includes("100") || d.includes("250") || d.includes("500"))) {
    matched.push("enterprise deal size");
  }
  if (descLower.includes("cold call") && allCandidateText.includes("cold")) {
    matched.push("cold outreach");
  }

  if (keywords.length === 0) return { score: 10, detail: "No specific skills to match" };

  const ratio = matched.length / Math.max(keywords.length, 1);
  const score = Math.round(ratio * 15);
  const detail = matched.length > 0
    ? `${matched.length}/${keywords.length + (matched.length - keywords.length > 0 ? matched.length - keywords.length : 0)} skills matched: ${matched.slice(0, 4).join(", ")}${matched.length > 4 ? "..." : ""}`
    : `No skill matches found`;

  return { score, detail };
}

function industryMatch(candidate: RapidCandidate, description: string): { score: number; detail: string } {
  if (candidate.industries.length === 0) return { score: 5, detail: "No industry data" };

  const descLower = description.toLowerCase();
  const matched = candidate.industries.filter(ind =>
    descLower.includes(ind.toLowerCase()) ||
    (ind.toLowerCase() === "technology" && descLower.includes("tech")) ||
    (ind.toLowerCase() === "financial services" && (descLower.includes("financ") || descLower.includes("banking"))) ||
    (ind.toLowerCase() === "healthcare" && descLower.includes("health")) ||
    (ind.toLowerCase() === "saas" && descLower.includes("saas"))
  );

  if (matched.length > 0) return { score: 15, detail: `Industry match: ${matched.join(", ")}` };

  // Partial credit if they have diverse industry experience
  if (candidate.industries.length >= 3) return { score: 8, detail: `Diverse experience: ${candidate.industries.slice(0, 3).join(", ")}` };

  return { score: 3, detail: `Industries (${candidate.industries.join(", ")}) don't match role` };
}

function teamRankingBonus(candidate: RapidCandidate): { score: number; detail: string } {
  const ranking = candidate.rankingWithinTeam?.toLowerCase() || "";
  if (!ranking) return { score: 5, detail: "No team ranking data" };
  if (ranking.includes("top") && (ranking.includes("1") || ranking.includes("5%") || ranking.includes("10%"))) {
    return { score: 10, detail: `Team ranking: ${candidate.rankingWithinTeam}` };
  }
  if (ranking.includes("top") && (ranking.includes("20%") || ranking.includes("25%") || ranking.includes("quarter"))) {
    return { score: 8, detail: `Team ranking: ${candidate.rankingWithinTeam}` };
  }
  if (ranking.includes("above average") || ranking.includes("top half") || ranking.includes("50%")) {
    return { score: 6, detail: `Team ranking: ${candidate.rankingWithinTeam}` };
  }
  return { score: 4, detail: `Team ranking: ${candidate.rankingWithinTeam}` };
}

export function rapidScoreAll(candidates: RapidCandidate[], role: Role): RapidResult[] {
  const config = extractRoleConfig(role);

  const results: RapidResult[] = candidates.map(c => {
    const exp = experienceMatch(c, config.minYears, config.maxYears);
    const loc = locationMatch(c, config.locations, config.remote);
    const grd = gradeMatch(c, config.category);
    const skl = skillsMatch(c, config.keywords, config.description);
    const ind = industryMatch(c, config.description);
    const rnk = teamRankingBonus(c);

    const breakdown = [
      { name: "Experience", score: exp.score, max: 20, detail: exp.detail },
      { name: "Location", score: loc.score, max: 15, detail: loc.detail },
      { name: "Grade", score: grd.score, max: 20, detail: grd.detail },
      { name: "Skills", score: skl.score, max: 15, detail: skl.detail },
      { name: "Industry", score: ind.score, max: 15, detail: ind.detail },
      { name: "Team Ranking", score: rnk.score, max: 10, detail: rnk.detail },
    ];

    // Sum up raw score (max ~95 to leave room for normalization)
    const rawScore = breakdown.reduce((s, b) => s + b.score, 0);
    // Normalize to 0-100 scale
    const maxPossible = breakdown.reduce((s, b) => s + b.max, 0);
    const score = Math.round((rawScore / maxPossible) * 100);

    // Build reasoning
    const strengths = breakdown.filter(b => b.score >= b.max * 0.7).map(b => b.detail);
    const weaknesses = breakdown.filter(b => b.score < b.max * 0.4).map(b => b.detail);

    const reasoning = [
      c.jobTitle ? `Currently: ${c.jobTitle}.` : "",
      c.headline ? `${c.headline}.` : "",
      strengths.length > 0 ? `Strengths: ${strengths.slice(0, 2).join("; ")}.` : "",
      weaknesses.length > 0 ? `Gaps: ${weaknesses.slice(0, 2).join("; ")}.` : "",
    ].filter(Boolean).join(" ");

    return {
      id: c.id,
      rank: 0,
      name: c.name,
      score,
      reasoning,
      highlights: strengths.slice(0, 4),
      gaps: weaknesses.slice(0, 4),
      photo_url: c.photoUrl || "",
      linkedin_url: c.linkedinUrl || "",
      breakdown,
    };
  });

  // Sort by score descending, assign ranks
  results.sort((a, b) => b.score - a.score);
  results.forEach((r, i) => r.rank = i + 1);

  return results;
}

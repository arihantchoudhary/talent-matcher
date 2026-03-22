/**
 * Score all candidates with GPT-4o-mini and generate ranked-output.json.
 * Run: OPENAI_API_KEY=sk-... npx tsx scripts/generate-rankings.ts
 */
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const JOB_DESCRIPTION = `Founding GTM, Legal — AI-native procurement platform (Series B+, multi-eight-figure ARR, fastest-growing startup in Europe).

ROLE SUMMARY: Build the Legal go-to-market motion and pipeline from scratch. This is a SALES role — you'll directly drive revenue and shape U.S. commercial expansion. Path to enterprise deal ownership in 8-12 months, then sales leadership.

DAY-TO-DAY:
- Own top-of-funnel for Legal: strategic accounts, multi-channel outbound, qualify opps, refine narrative
- Break into new markets: prioritize legal segments, run experiments, develop competitive positioning
- Support live deals: RFPs, proposals, pipeline hygiene, closing support
- Run executive events: dinners, roundtables with GC/CFO-level buyers

MUST-HAVES:
- 1-4 years in high-performance environment (law, banking, consulting, startups, VC)
- Familiarity with Legal sector (work, education, or selling into legal buyers/law firms/in-house legal)
- Ambition to own outcomes and carry a number
- Strong presence with C-suite stakeholders
- In-person Tue-Thu (ideally US-based, NYC/East Coast preferred)

NICE-TO-HAVES:
- Competitive sports background
- Enterprise sales experience or selling to finance/legal/operations departments
- Experience at startups or high-growth companies
- SaaS sales background`;

function parseCSV(raw: string): string[][] {
  const rows: string[][] = [];
  let fields: string[] = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inQ) {
      if (ch === '"') { if (raw[i+1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') { fields.push(field); field = ""; }
      else if (ch === '\n' || (ch === '\r' && raw[i+1] === '\n')) {
        fields.push(field);
        if (fields.length > 1 || fields[0]) rows.push(fields);
        fields = []; field = ""; if (ch === '\r') i++;
      } else field += ch;
    }
  }
  if (field || fields.length) { fields.push(field); rows.push(fields); }
  return rows;
}

function safeJSON<T>(v: string, fb: T): T {
  if (!v || !v.trim() || v.trim() === 'null' || v.trim() === '[]') return fb;
  try { return JSON.parse(v); } catch { return fb; }
}

function extractName(row: Record<string, string>): string {
  const f = (row.linkedin_first_name || "").trim();
  const l = (row.linkedin_last_name || "").trim();
  if (f && l) return `${f} ${l}`;
  const resume = (row.resume_text || "").trim();
  if (resume) {
    const skip = new Set(["experience","education","skills","summary","objective","certifications","professional experience"]);
    for (const line of resume.split("\n").map(s => s.trim()).filter(Boolean).slice(0, 3)) {
      if (skip.has(line.toLowerCase())) continue;
      if (line.length > 1 && line.length < 40 && !/[@|•]/.test(line) && /^[A-Za-z\s.\-']+$/.test(line)) return line;
    }
  }
  for (const field of ["sdr_grade_reasoning", "ae_grade_reasoning", "letter_grade_reasoning"]) {
    const text = (row[field] || "").trim();
    if (text) {
      const m = text.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]*)?)\s(?:is|has|shows|demonstrates|would|could|brings)/);
      if (m) return m[1];
    }
  }
  return `Candidate-${(row.user_id || row.id || "").substring(0, 8)}`;
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) { console.error("Set OPENAI_API_KEY"); process.exit(1); }
  const openai = new OpenAI({ apiKey });

  const raw = fs.readFileSync(path.join(process.cwd(), "infra", "data", "candidates.csv"), "utf-8");
  const rows = parseCSV(raw);
  const headers = rows[0].map(h => h.trim());
  console.log(`${rows.length - 1} rows, ${headers.length} cols`);

  interface CRow { name: string; id: string; summary: string; }
  const candidates: CRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const vals = rows[i];
    if (vals.length < 5) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = (vals[idx] || "").trim(); });

    const filled = Object.values(row).filter(v => v && v !== 'null' && v !== '[]' && v !== '{}').length;
    if (filled < 3) continue;

    const name = extractName(row);
    const id = row.id || row.user_id || `row-${i}`;

    // Build rich summary
    const p: string[] = [];
    if (name) p.push(`Name: ${name}`);
    if (row.job_title) p.push(`Current title: ${row.job_title}`);
    if (row.linkedin_headline) p.push(`LinkedIn: ${row.linkedin_headline}`);
    if (row.total_years_sales_experience) p.push(`Sales experience: ${row.total_years_sales_experience} years`);

    const industries = safeJSON<string[]>(row.industries, []);
    if (industries.length) p.push(`Industries sold in: ${industries.join(", ")}`);
    const depts = safeJSON<string[]>(row.departments_sold_to, []);
    if (depts.length) p.push(`Departments sold to: ${depts.join(", ")}`);
    const buyers = safeJSON<string[]>(row.buyer_personas, []);
    if (buyers.length) p.push(`Buyer personas: ${buyers.join(", ")}`);
    const focus = safeJSON<string[]>(row.sales_focus_new, []);
    if (focus.length) p.push(`Sales focus: ${focus.join(", ")}`);
    const products = safeJSON<string[]>(row.products_sold, []);
    if (products.length) p.push(`Products: ${products.join(", ")}`);
    const kpis = safeJSON<string[]>(row.sales_kpis, []);
    if (kpis.length) p.push(`KPIs: ${kpis.join(", ")}`);
    if (row.ranking_within_team_new) p.push(`Team ranking: top ${row.ranking_within_team_new}%`);
    if (row.sdr_grade) p.push(`SDR grade: ${row.sdr_grade}`);
    if (row.ae_grade) p.push(`AE grade: ${row.ae_grade}`);
    if (row.letter_grade) p.push(`Overall grade: ${row.letter_grade}`);

    const comps = safeJSON<{name:string;score:number;assessment:string}[]>(row.competencies, []);
    if (comps.length) {
      p.push(`Competencies: ${comps.map(c => `${c.name}=${c.score}/5`).join(", ")}`);
      // Include assessments for key competencies
      for (const c of comps) {
        if (c.assessment && c.score >= 3) p.push(`${c.name} detail: ${c.assessment.substring(0, 150)}`);
      }
    }

    const compExp = safeJSON<string[]>(row.company_experience_new, []);
    if (compExp.length) p.push(`Company types worked at: ${compExp.join(", ")}`);

    const loc = safeJSON<{city:string;state:string;country:string}|null>(row.current_location, null);
    if (loc) p.push(`Location: ${loc.city}, ${loc.state}, ${loc.country}`);
    const style = safeJSON<{remote:boolean;hybrid:boolean;inPerson:boolean}|null>(row.preferred_working_style_new, null);
    if (style) p.push(`Work preference: ${[style.inPerson&&"in-person",style.hybrid&&"hybrid",style.remote&&"remote"].filter(Boolean).join(", ")}`);
    if (row.willing_to_relocate === 't') p.push(`Willing to relocate`);

    if (row.sdr_grade_reasoning) p.push(`SDR assessment: ${row.sdr_grade_reasoning.substring(0, 400)}`);
    if (row.ae_grade_reasoning) p.push(`AE assessment: ${row.ae_grade_reasoning.substring(0, 400)}`);
    if (row.letter_grade_reasoning) p.push(`Overall assessment: ${row.letter_grade_reasoning.substring(0, 400)}`);
    if (row.sales_cycle_description) p.push(`Sales cycle example: ${row.sales_cycle_description.substring(0, 300)}`);
    if (row.resume_text) p.push(`Resume:\n${row.resume_text.substring(0, 600)}`);

    candidates.push({ name, id, summary: p.join("\n") });
  }

  console.log(`${candidates.length} candidates to score\n`);

  const results: Array<{
    rank: number; id: string; name: string; score: number;
    reasoning: string; highlights: string[]; gaps: string[];
  }> = [];

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    try {
      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 350,
        messages: [
          {
            role: "system",
            content: `You are scoring sales candidates for a specific role. Score 0-100 with real granularity — avoid clustering at round numbers. Use the FULL range.

Scoring guide:
- 85-100: Exceptional fit — legal sector experience + strong sales + right experience level + US-based
- 70-84: Strong fit — most criteria met, maybe missing legal angle or slightly off on experience
- 55-69: Decent fit — good sales fundamentals but missing key criteria (legal, enterprise, location)
- 40-54: Partial fit — some relevant skills but major gaps
- 25-39: Weak fit — limited relevance to this specific role
- 0-24: Poor fit — wrong profile entirely

Return ONLY valid JSON: {"score": <number>, "reasoning": "<2-3 specific sentences referencing their actual data>", "highlights": ["<specific strength>", ...], "gaps": ["<specific gap>", ...]}

ROLE:\n${JOB_DESCRIPTION}`,
          },
          { role: "user", content: c.summary.substring(0, 3500) },
        ],
      });

      const raw = resp.choices[0]?.message?.content || "";
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        const score = Math.min(100, Math.max(0, Math.round(parsed.score || 0)));
        results.push({
          rank: 0, id: c.id, name: c.name, score,
          reasoning: parsed.reasoning || "",
          highlights: parsed.highlights || [],
          gaps: parsed.gaps || [],
        });
        console.log(`  [${i+1}/${candidates.length}] ${c.name}: ${score}`);
      } else {
        results.push({ rank: 0, id: c.id, name: c.name, score: 0, reasoning: raw, highlights: [], gaps: [] });
        console.log(`  [${i+1}] ${c.name}: PARSE ERROR`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [${i+1}] ${c.name}: FAILED - ${msg}`);
      results.push({ rank: 0, id: c.id, name: c.name, score: 0, reasoning: `Error: ${msg}`, highlights: [], gaps: [] });
    }
    if (i % 10 === 9) await new Promise(r => setTimeout(r, 500));
  }

  results.sort((a, b) => b.score - a.score);
  results.forEach((r, i) => r.rank = i + 1);

  const outPath = path.join(process.cwd(), "infra", "data", "ranked-output.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nWritten ${outPath}`);
  console.log(`\nTop 20:`);
  results.slice(0, 20).forEach(r => console.log(`  #${r.rank} ${r.name} — ${r.score}`));
  console.log(`\nScore spread: ${results[results.length-1].score} to ${results[0].score}`);
}

main().catch(console.error);

export interface ParsedCandidate {
  id: string;
  name: string;
  fullText: string;
  linkedinUrl?: string;
}

// Known LinkedIn slug → name mappings for candidates without extractable names
const SLUG_NAMES: Record<string, string> = {
  "taronarshakian": "Taron Arshakian",
  "katherinestiplosek": "Katherine Stiplosek",
  "sifathmannan": "Sifath Mannan",
  "porges": "Matt Porges",
  "henrysmith1997": "Henry Smith",
  "ethanfaber": "Ethan Faber",
  "kylereinheimer": "Kyle Reinheimer",
  "andrewthompson123": "Andrew Thompson",
  "dhanushsivakaminathan": "Dhanush Sivakaminathan",
  "danielmbarrett1": "Daniel Barrett",
  "swarajagarwal": "Swaraj Agarwal",
  "davidkeptsi": "David Keptsi",
  "imboywa": "Gil Imboywa",
  "davidneiltraub": "David Traub",
  "awschleifer": "Ami Schleifer",
  "rebekahcturner24": "Rebekah Turner",
  "abbietulloch": "Abbie Tulloch",
  "caioteig": "Caio Teig",
  "jolinferro": "Jo-Lin Ferro",
  "-emilyshih": "Emily Shih",
  "arjunr111": "Arjun Raman",
  "emily%7edominguez": "Emily Dominguez",
  "emily~dominguez": "Emily Dominguez",
};

function parseCSVRaw(raw: string): string[][] {
  const rows: string[][] = [];
  let fields: string[] = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inQ) { if (ch === '"') { if (raw[i+1] === '"') { field += '"'; i++; } else inQ = false; } else field += ch; }
    else { if (ch === '"') inQ = true; else if (ch === ',') { fields.push(field); field = ""; } else if (ch === '\n' || (ch === '\r' && raw[i+1] === '\n')) { fields.push(field); if (fields.length > 1 || fields[0]) rows.push(fields); fields = []; field = ""; if (ch === '\r') i++; } else field += ch; }
  }
  if (field || fields.length) { fields.push(field); rows.push(fields); }
  return rows;
}

function detectName(headers: string[], values: string[]): string {
  const row: Record<string, string> = {};
  headers.forEach((h, i) => { row[h.toLowerCase().trim()] = (values[i] || "").trim(); });

  for (const p of ["name", "full_name", "fullname", "candidate_name", "candidate", "applicant"]) {
    for (const [k, v] of Object.entries(row)) if (k === p && v.length > 1 && v.length < 60) return v;
  }
  let first = "", last = "";
  for (const [k, v] of Object.entries(row)) {
    if (k.includes("first") && k.includes("name")) first = v;
    if (k.includes("last") && k.includes("name")) last = v;
    if (k.includes("linkedin") && k.includes("first")) first = first || v;
    if (k.includes("linkedin") && k.includes("last")) last = last || v;
  }
  if (first && last) return `${first} ${last}`;
  if (first) return first;

  const resume = row.resume_text || "";
  if (resume) {
    const skip = new Set(["experience","education","skills","summary","objective"]);
    for (const line of resume.split("\n").map(l => l.trim()).filter(Boolean).slice(0, 3)) {
      if (skip.has(line.toLowerCase())) continue;
      if (line.length > 1 && line.length < 40 && !/[@|•]/.test(line) && /^[A-Za-z\s.\-']+$/.test(line)) return line;
    }
  }

  for (const f of ["sdr_grade_reasoning", "ae_grade_reasoning", "letter_grade_reasoning"]) {
    const t = (row[f] || "").trim();
    if (t) { const m = t.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]*)?)\s(?:is|has|shows|demonstrates|would|could|brings)/); if (m) return m[1]; }
  }

  for (const [k, v] of Object.entries(row)) {
    if (k.includes("email") && v.includes("@")) {
      const prefix = v.split("@")[0].replace(/[._]/g, " ");
      if (prefix.length > 2) return prefix.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
  }

  // Try LinkedIn URL slug
  for (const [, v] of Object.entries(row)) {
    if (v.includes("linkedin.com/in/")) {
      const match = v.match(/linkedin\.com\/in\/([^/?]+)/);
      if (match) {
        const slug = decodeURIComponent(match[1]).replace(/\/$/, "").toLowerCase();
        // Check known slug map first
        if (SLUG_NAMES[slug]) return SLUG_NAMES[slug];
        // Try hyphenated slugs (first-last pattern)
        if (slug.includes("-") && slug.length < 40 && !/[0-9]{4,}/.test(slug)) {
          const parts = slug.split("-").filter(p => p.length > 1 && /^[a-z]+$/i.test(p));
          if (parts.length >= 2) {
            return parts.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
          }
        }
      }
    }
  }

  return `Candidate ${(row.user_id || row.id || Object.values(row)[0] || "").substring(0, 8)}`;
}

export function parseCSV(raw: string): ParsedCandidate[] {
  const rows = parseCSVRaw(raw);
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim());
  const candidates: ParsedCandidate[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    const filled = values.filter(v => v && v.trim() && v.trim() !== "null" && v.trim() !== "[]").length;
    if (filled < 2) continue;

    const rawFields: Record<string, string> = {};
    headers.forEach((h, idx) => { const v = (values[idx] || "").trim(); if (v && v !== "null" && v !== "[]" && v !== "{}") rawFields[h] = v; });

    const name = detectName(headers, values);
    const fullText = Object.entries(rawFields).filter(([, v]) => v.length < 2000).map(([k, v]) => `${k}: ${v}`).join("\n");

    // Find LinkedIn URL
    let linkedinUrl: string | undefined;
    for (const [, v] of Object.entries(rawFields)) {
      if (v.includes("linkedin.com/in/")) { linkedinUrl = v; break; }
    }

    candidates.push({
      id: rawFields["id"] || rawFields["user_id"] || `row-${i}`,
      name: name || `Candidate ${i}`,
      fullText,
      linkedinUrl,
    });
  }
  return candidates;
}

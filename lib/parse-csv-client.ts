/**
 * Generic CSV parser that works with ANY CSV format.
 * Auto-detects name, location, experience, and other fields from headers.
 */

export interface GenericCandidate {
  id: string;
  name: string;
  linkedinUrl?: string;
  photoUrl?: string;
  rawFields: Record<string, string>;
  /** All non-empty field values concatenated for search/AI scoring */
  fullText: string;
}

function parseCSVRaw(raw: string): string[][] {
  const rows: string[][] = [];
  let currentFields: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  while (i < raw.length) {
    const ch = raw[i];
    if (inQuotes) {
      if (ch === '"') {
        if (raw[i + 1] === '"') { currentField += '"'; i += 2; }
        else { inQuotes = false; i++; }
      } else { currentField += ch; i++; }
    } else {
      if (ch === '"') { inQuotes = true; i++; }
      else if (ch === ",") { currentFields.push(currentField); currentField = ""; i++; }
      else if (ch === "\n" || (ch === "\r" && raw[i + 1] === "\n")) {
        currentFields.push(currentField);
        if (currentFields.length > 1 || currentFields[0] !== "") rows.push(currentFields);
        currentFields = []; currentField = ""; i += ch === "\r" ? 2 : 1;
      } else { currentField += ch; i++; }
    }
  }
  if (currentField || currentFields.length > 0) {
    currentFields.push(currentField);
    if (currentFields.length > 1 || currentFields[0] !== "") rows.push(currentFields);
  }
  return rows;
}

/** Try to find the name from a row by checking common column name patterns */
function detectName(headers: string[], values: string[]): string {
  const row: Record<string, string> = {};
  headers.forEach((h, i) => { row[h.toLowerCase().trim()] = (values[i] || "").trim(); });

  // Direct name fields
  const namePatterns = ["name", "full_name", "fullname", "candidate_name", "candidate name", "applicant_name", "applicant"];
  for (const p of namePatterns) {
    for (const [k, v] of Object.entries(row)) {
      if (k === p && v && v.length > 1 && v.length < 60) return v;
    }
  }

  // First + last name
  let first = "";
  let last = "";
  for (const [k, v] of Object.entries(row)) {
    if ((k.includes("first") && k.includes("name")) || k === "first_name" || k === "firstname") first = v;
    if ((k.includes("last") && k.includes("name")) || k === "last_name" || k === "lastname") last = v;
  }
  if (first && last) return `${first} ${last}`;
  if (first) return first;

  // LinkedIn name fields
  for (const [k, v] of Object.entries(row)) {
    if (k.includes("linkedin") && k.includes("first")) first = v;
    if (k.includes("linkedin") && k.includes("last")) last = v;
  }
  if (first && last) return `${first} ${last}`;

  // Resume text — first line
  for (const [k, v] of Object.entries(row)) {
    if (k.includes("resume") && v) {
      const lines = v.split("\n").map((l) => l.trim()).filter(Boolean);
      const skipWords = new Set(["experience", "education", "skills", "summary", "objective", "certifications", "professional", "work"]);
      for (const line of lines.slice(0, 3)) {
        if (skipWords.has(line.toLowerCase())) continue;
        if (line.length > 1 && line.length < 40 && !/[@|•]/.test(line) && /^[A-Za-z\s.\-']+$/.test(line)) return line;
      }
    }
  }

  // Grade reasoning — "[Name] is a..."
  for (const [k, v] of Object.entries(row)) {
    if ((k.includes("grade") || k.includes("reasoning") || k.includes("assessment")) && v) {
      const match = v.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]*)?)\s(?:is|has|shows|demonstrates|would|could|brings)/);
      if (match) return match[1];
    }
  }

  // Email prefix
  for (const [k, v] of Object.entries(row)) {
    if (k.includes("email") && v && v.includes("@")) {
      const prefix = v.split("@")[0].replace(/[._]/g, " ");
      if (prefix.length > 2) return prefix.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
  }

  return "";
}

export function parseGenericCSV(raw: string): { candidates: GenericCandidate[]; headers: string[] } {
  const rows = parseCSVRaw(raw);
  if (rows.length < 2) return { candidates: [], headers: [] };

  const headers = rows[0].map((h) => h.trim());
  const candidates: GenericCandidate[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    // Skip rows that are mostly empty
    const filledCount = values.filter((v) => v && v.trim() && v.trim() !== "null" && v.trim() !== "[]").length;
    if (filledCount < 2) continue;

    const rawFields: Record<string, string> = {};
    headers.forEach((h, idx) => {
      const val = (values[idx] || "").trim();
      if (val && val !== "null" && val !== "[]" && val !== "{}") {
        rawFields[h] = val;
      }
    });

    const name = detectName(headers, values);
    const fullText = Object.entries(rawFields)
      .filter(([, v]) => v.length < 2000) // skip huge blobs
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    // Auto-detect LinkedIn URL from any column
    let linkedinUrl: string | undefined;
    let photoUrl: string | undefined;
    for (const [k, v] of Object.entries(rawFields)) {
      if (!linkedinUrl && v.includes("linkedin.com/in/")) linkedinUrl = v;
      if (!photoUrl && (k.toLowerCase().includes("photo") || k.toLowerCase().includes("picture") || k.toLowerCase().includes("avatar")) && v.startsWith("http")) photoUrl = v;
    }

    candidates.push({
      id: rawFields["id"] || rawFields["user_id"] || `row-${i}`,
      name: name || `Candidate ${i}`,
      linkedinUrl,
      photoUrl,
      rawFields,
      fullText,
    });
  }

  return { candidates, headers };
}

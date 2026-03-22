import { NextRequest } from "next/server";
import OpenAI from "openai";

const LINKEDIN_API = process.env.LINKEDIN_API_URL || "https://aicm3pweed.us-east-1.awsapprunner.com";

/** Pull all LinkedIn profiles from the database and build a URL->enrichment map */
async function loadLinkedInDB(): Promise<Map<string, string>> {
  const enrichments = new Map<string, string>();
  try {
    const resp = await fetch(`${LINKEDIN_API}/linkedin/database`, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return enrichments;
    const data = await resp.json() as { items: Record<string, string>[] };
    for (const p of data.items) {
      const url = (p.url || "").replace(/\/$/, "").toLowerCase();
      if (!url) continue;
      const parts: string[] = [];
      if (p.name) parts.push(`LinkedIn Name: ${p.name}`);
      if (p.headline) parts.push(`Headline: ${p.headline}`);
      if (p.company) parts.push(`Company: ${p.company}`);
      if (p.location) parts.push(`Location: ${p.location}`);
      if (p.education) parts.push(`Education: ${p.education}`);
      if (p.experience) parts.push(`Experience: ${(p.experience || "").substring(0, 500)}`);
      if (p.skills) parts.push(`Skills: ${(p.skills || "").substring(0, 300)}`);
      if (p.resume_text) parts.push(`Resume: ${(p.resume_text || "").substring(0, 600)}`);
      if (p.total_years_sales_experience) parts.push(`Sales Experience: ${p.total_years_sales_experience} years`);
      if (parts.length > 0) enrichments.set(url, "\n--- LinkedIn Profile ---\n" + parts.join("\n"));
    }
  } catch { /* best effort */ }
  return enrichments;
}

export async function POST(req: NextRequest) {
  const { candidates, jobDescription, apiKey: clientKey } = await req.json();
  const apiKey = clientKey || process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: "No API key" }, { status: 400 });
  if (!candidates?.length) return Response.json({ error: "No candidates" }, { status: 400 });

  const openai = new OpenAI({ apiKey });

  // Load LinkedIn enrichment data in parallel with setup
  const linkedinPromise = loadLinkedInDB();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (d: Record<string, unknown>) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(d)}\n\n`));

      // Wait for LinkedIn data
      let linkedinDB = new Map<string, string>();
      try {
        linkedinDB = await linkedinPromise;
        if (linkedinDB.size > 0) send({ type: "enriched", count: linkedinDB.size });
      } catch { /* continue without enrichment */ }

      send({ type: "start", total: candidates.length });

      for (let i = 0; i < candidates.length; i += 5) {
        const batch = candidates.slice(i, Math.min(i + 5, candidates.length));
        const promises = batch.map(async (c: { id: string; name: string; fullText: string; linkedinUrl?: string }, bi: number) => {
          const idx = i + bi;
          try {
            // Enrich with LinkedIn data if we have it
            let candidateText = c.fullText.substring(0, 3000);

            if (c.linkedinUrl) {
              const normalized = c.linkedinUrl.replace(/\/$/, "").toLowerCase();
              const enrichment = linkedinDB.get(normalized);
              if (enrichment) {
                candidateText = candidateText.substring(0, 2200) + enrichment;
              }
            }

            // Also try fuzzy match by checking if any LinkedIn URL contains similar slug
            if (!c.linkedinUrl) {
              // Try to find by name in the enrichment data
              const nameLower = c.name.toLowerCase();
              for (const [url, data] of linkedinDB) {
                if (url.includes(nameLower.replace(/\s+/g, "")) || url.includes(nameLower.split(" ")[0])) {
                  candidateText = candidateText.substring(0, 2200) + data;
                  break;
                }
              }
            }

            const resp = await openai.chat.completions.create({
              model: "gpt-4o-mini", temperature: 0.3, max_tokens: 350,
              messages: [
                { role: "system", content: `Score candidates 0-100. Use full range: 85-100 exceptional, 70-84 strong, 55-69 decent, 40-54 partial, 25-39 weak, 0-24 poor.\nReturn ONLY JSON: {"score":<n>,"reasoning":"<2-3 sentences>","highlights":["..."],"gaps":["..."]}\n\nROLE:\n${jobDescription.substring(0, 1500)}` },
                { role: "user", content: candidateText },
              ],
            });
            const raw = resp.choices[0]?.message?.content || "";
            const m = raw.match(/\{[\s\S]*\}/);
            if (m) {
              const p = JSON.parse(m[0]);
              send({ type: "scored", index: idx, id: c.id, name: c.name, score: Math.min(100, Math.max(0, Math.round(p.score || 0))), reasoning: p.reasoning || "", highlights: p.highlights || [], gaps: p.gaps || [] });
            } else {
              send({ type: "scored", index: idx, id: c.id, name: c.name, score: 0, reasoning: raw, highlights: [], gaps: [] });
            }
          } catch (err) {
            send({ type: "error", index: idx, id: c.id, name: c.name, error: err instanceof Error ? err.message : String(err) });
          }
        });
        await Promise.all(promises);
      }
      send({ type: "done" });
      controller.close();
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
}

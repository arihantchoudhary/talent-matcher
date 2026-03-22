import { NextRequest } from "next/server";
import OpenAI from "openai";

const LINKEDIN_API = process.env.LINKEDIN_API_URL || "https://aicm3pweed.us-east-1.awsapprunner.com";

/** Try to enrich candidates with LinkedIn data */
async function enrichWithLinkedIn(
  candidates: { id: string; name: string; fullText: string; linkedinUrl?: string }[]
): Promise<Map<string, string>> {
  const enrichments = new Map<string, string>();

  // Collect all LinkedIn URLs
  const urlToId = new Map<string, string>();
  for (const c of candidates) {
    if (c.linkedinUrl && c.linkedinUrl.includes("linkedin.com")) {
      urlToId.set(c.linkedinUrl, c.id);
    }
  }

  if (urlToId.size === 0) return enrichments;

  // Try bulk lookup from cache
  try {
    const resp = await fetch(`${LINKEDIN_API}/linkedin/database`, {
      signal: AbortSignal.timeout(10000),
    });
    if (resp.ok) {
      const allProfiles = (await resp.json()) as Array<Record<string, string>>;
      for (const p of allProfiles) {
        if (!p.url) continue;
        const normalized = p.url.replace(/\/$/, "").toLowerCase();
        // Match against our URLs
        for (const [url, id] of urlToId) {
          if (url.replace(/\/$/, "").toLowerCase() === normalized) {
            const parts: string[] = [];
            if (p.name) parts.push(`LinkedIn Name: ${p.name}`);
            if (p.headline) parts.push(`LinkedIn Headline: ${p.headline}`);
            if (p.location) parts.push(`LinkedIn Location: ${p.location}`);
            if (p.company) parts.push(`Current Company: ${p.company}`);
            if (p.about) parts.push(`About: ${p.about.substring(0, 300)}`);
            if (p.experience) parts.push(`Experience: ${p.experience.substring(0, 400)}`);
            if (p.education) parts.push(`Education: ${p.education.substring(0, 200)}`);
            if (p.skills) parts.push(`Skills: ${p.skills.substring(0, 200)}`);
            if (parts.length > 0) {
              enrichments.set(id, "\n--- LinkedIn Profile ---\n" + parts.join("\n"));
            }
          }
        }
      }
    }
  } catch {
    // LinkedIn enrichment is best-effort
  }

  return enrichments;
}

export async function POST(req: NextRequest) {
  const { candidates, jobDescription, apiKey: clientKey } = await req.json();

  const apiKey = clientKey || process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: "No API key — set OPENAI_API_KEY env var or provide one in the UI" }, { status: 400 });
  if (!candidates?.length) return Response.json({ error: "No candidates" }, { status: 400 });

  const openai = new OpenAI({ apiKey });

  // Enrich with LinkedIn data in background
  const enrichPromise = enrichWithLinkedIn(candidates);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Wait for LinkedIn enrichment (max 10s, already started above)
      let enrichments = new Map<string, string>();
      try {
        enrichments = await enrichPromise;
        if (enrichments.size > 0) {
          send({ type: "enriched", count: enrichments.size });
        }
      } catch {
        // Continue without enrichment
      }

      send({ type: "start", total: candidates.length });

      for (let i = 0; i < candidates.length; i += 5) {
        const batch = candidates.slice(i, Math.min(i + 5, candidates.length));

        const promises = batch.map(async (candidate: { id: string; name: string; fullText: string }, batchIdx: number) => {
          const idx = i + batchIdx;
          try {
            // Append LinkedIn enrichment if available
            let candidateText = candidate.fullText.substring(0, 3000);
            const linkedinExtra = enrichments.get(candidate.id);
            if (linkedinExtra) {
              candidateText = candidateText.substring(0, 2500) + linkedinExtra;
            }

            const response = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              temperature: 0.3,
              max_tokens: 350,
              messages: [
                {
                  role: "system",
                  content: `You score candidates 0-100 for a role. Use the FULL range with granularity.
Scoring: 85-100 exceptional, 70-84 strong, 55-69 decent, 40-54 partial, 25-39 weak, 0-24 poor.
Return ONLY valid JSON:
{"score": <number>, "reasoning": "<2-3 specific sentences>", "highlights": ["<strength>", ...], "gaps": ["<gap>", ...]}

ROLE:
${jobDescription.substring(0, 1500)}`,
                },
                { role: "user", content: candidateText },
              ],
            });

            const raw = response.choices[0]?.message?.content || "";
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              send({
                type: "scored",
                index: idx,
                id: candidate.id,
                name: candidate.name,
                score: Math.min(100, Math.max(0, Math.round(parsed.score || 0))),
                reasoning: parsed.reasoning || "",
                highlights: parsed.highlights || [],
                gaps: parsed.gaps || [],
              });
            } else {
              send({ type: "scored", index: idx, id: candidate.id, name: candidate.name, score: 0, reasoning: raw, highlights: [], gaps: [] });
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            send({ type: "error", index: idx, id: candidate.id, name: candidate.name, error: msg });
          }
        });

        await Promise.all(promises);
      }

      send({ type: "done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

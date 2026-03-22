import { NextRequest } from "next/server";
import OpenAI from "openai";
import { stableMatch, MatchPreference } from "@/lib/stable-match";

const LINKEDIN_API = process.env.LINKEDIN_API_URL || "https://aicm3pweed.us-east-1.awsapprunner.com";

async function loadLinkedInDB(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const resp = await fetch(`${LINKEDIN_API}/linkedin/database`, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return map;
    const data = await resp.json() as { items: Record<string, string>[] };
    for (const p of data.items) {
      const url = (p.url || "").replace(/\/$/, "").toLowerCase();
      if (!url) continue;
      const parts: string[] = [];
      if (p.name) parts.push(`Name: ${p.name}`);
      if (p.headline) parts.push(`Headline: ${p.headline}`);
      if (p.company) parts.push(`Company: ${p.company}`);
      if (p.experience) parts.push(`Experience: ${(p.experience || "").substring(0, 400)}`);
      if (p.education) parts.push(`Education: ${p.education}`);
      if (p.skills) parts.push(`Skills: ${(p.skills || "").substring(0, 200)}`);
      if (p.resume_text) parts.push(`Resume: ${(p.resume_text || "").substring(0, 500)}`);
      if (parts.length > 0) map.set(url, parts.join("\n"));
    }
  } catch { /* best effort */ }
  return map;
}

export async function POST(req: NextRequest) {
  const { candidates, roles, apiKey: clientKey } = await req.json() as {
    candidates: { id: string; name: string; fullText: string; linkedinUrl?: string }[];
    roles: { title: string; description: string; capacity: number }[];
    apiKey: string;
  };

  const apiKey = clientKey || process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: "No API key" }, { status: 400 });
  if (!candidates?.length || !roles?.length) return Response.json({ error: "Need candidates and roles" }, { status: 400 });

  const openai = new OpenAI({ apiKey });
  const linkedinDB = await loadLinkedInDB();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (d: Record<string, unknown>) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(d)}\n\n`));

      const totalScores = candidates.length * roles.length;
      send({ type: "start", totalCandidates: candidates.length, totalRoles: roles.length, totalScores });

      // Score every candidate against every role
      const allScores: MatchPreference[][] = roles.map(() => []);
      let scored = 0;

      for (let r = 0; r < roles.length; r++) {
        const role = roles[r];
        send({ type: "scoring_role", roleIdx: r, roleTitle: role.title });

        for (let i = 0; i < candidates.length; i += 5) {
          const batch = candidates.slice(i, Math.min(i + 5, candidates.length));
          const promises = batch.map(async (c, bi) => {
            const cIdx = i + bi;
            try {
              let text = c.fullText.substring(0, 2500);
              if (c.linkedinUrl) {
                const enrichment = linkedinDB.get(c.linkedinUrl.replace(/\/$/, "").toLowerCase());
                if (enrichment) text = text.substring(0, 1800) + "\n---LinkedIn---\n" + enrichment;
              }

              const resp = await openai.chat.completions.create({
                model: "gpt-4o-mini", temperature: 0.3, max_tokens: 200,
                messages: [
                  { role: "system", content: `Score candidate 0-100 for this role. Return ONLY JSON: {"score":<n>,"reasoning":"<1-2 sentences>","highlights":["..."],"gaps":["..."]}\n\nROLE: ${role.title}\n${role.description.substring(0, 800)}` },
                  { role: "user", content: text },
                ],
              });

              const raw = resp.choices[0]?.message?.content || "";
              const m = raw.match(/\{[\s\S]*\}/);
              if (m) {
                const p = JSON.parse(m[0]);
                const pref: MatchPreference = {
                  roleIdx: r, candidateIdx: cIdx,
                  score: Math.min(100, Math.max(0, Math.round(p.score || 0))),
                  reasoning: p.reasoning || "", highlights: p.highlights || [], gaps: p.gaps || [],
                };
                allScores[r].push(pref);
                scored++;
                send({ type: "scored", scored, total: totalScores, roleIdx: r, candidateIdx: cIdx, candidateName: c.name, roleTitle: role.title, score: pref.score });
              }
            } catch {
              allScores[r].push({ roleIdx: r, candidateIdx: cIdx, score: 0, reasoning: "Scoring failed", highlights: [], gaps: [] });
              scored++;
              send({ type: "scored", scored, total: totalScores, roleIdx: r, candidateIdx: cIdx, candidateName: c.name, roleTitle: role.title, score: 0 });
            }
          });
          await Promise.all(promises);
        }
      }

      // Run Gale-Shapley
      send({ type: "matching" });
      const result = stableMatch(
        roles.length,
        candidates.length,
        roles.map(r => r.capacity),
        allScores,
      );

      // Build output
      const matches: {
        roleIdx: number; roleTitle: string;
        candidates: { idx: number; name: string; score: number; reasoning: string; highlights: string[]; gaps: string[] }[];
      }[] = [];

      for (let r = 0; r < roles.length; r++) {
        const matchedCandidates = result.roleMatches.get(r) || [];
        matches.push({
          roleIdx: r,
          roleTitle: roles[r].title,
          candidates: matchedCandidates.map(cIdx => {
            const pref = allScores[r].find(s => s.candidateIdx === cIdx);
            return {
              idx: cIdx, name: candidates[cIdx].name,
              score: pref?.score || 0, reasoning: pref?.reasoning || "",
              highlights: pref?.highlights || [], gaps: pref?.gaps || [],
            };
          }).sort((a, b) => b.score - a.score),
        });
      }

      const unmatchedCandidates = result.unmatched.map(cIdx => {
        // Find their best score across all roles
        let bestRole = 0, bestScore = 0, bestPref: MatchPreference | null = null;
        for (let r = 0; r < roles.length; r++) {
          const pref = allScores[r].find(s => s.candidateIdx === cIdx);
          if (pref && pref.score > bestScore) { bestScore = pref.score; bestRole = r; bestPref = pref; }
        }
        return {
          idx: cIdx, name: candidates[cIdx].name,
          bestRoleTitle: roles[bestRole].title, bestScore,
          reasoning: bestPref?.reasoning || "No strong match found",
        };
      });

      send({
        type: "done",
        matches,
        unmatched: unmatchedCandidates,
        allScores: allScores.map((roleScores, r) =>
          roleScores.map(s => ({ ...s, candidateName: candidates[s.candidateIdx]?.name, roleTitle: roles[r].title }))
        ),
      });
      controller.close();
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
}

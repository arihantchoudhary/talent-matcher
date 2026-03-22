import { NextRequest } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const { candidates, jobDescription, apiKey: clientKey } = await req.json();
  const apiKey = clientKey || process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: "No API key" }, { status: 400 });
  if (!candidates?.length) return Response.json({ error: "No candidates" }, { status: 400 });

  const openai = new OpenAI({ apiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (d: Record<string, unknown>) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(d)}\n\n`));
      send({ type: "start", total: candidates.length });

      for (let i = 0; i < candidates.length; i += 5) {
        const batch = candidates.slice(i, Math.min(i + 5, candidates.length));
        const promises = batch.map(async (c: { id: string; name: string; fullText: string }, bi: number) => {
          const idx = i + bi;
          try {
            const resp = await openai.chat.completions.create({
              model: "gpt-4o-mini", temperature: 0.3, max_tokens: 350,
              messages: [
                { role: "system", content: `Score candidates 0-100. Use full range: 85-100 exceptional, 70-84 strong, 55-69 decent, 40-54 partial, 25-39 weak, 0-24 poor.\nReturn ONLY JSON: {"score":<n>,"reasoning":"<2-3 sentences>","highlights":["..."],"gaps":["..."]}\n\nROLE:\n${jobDescription.substring(0, 1500)}` },
                { role: "user", content: c.fullText.substring(0, 3500) },
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

import { NextRequest } from "next/server";

const LINKEDIN_API = process.env.LINKEDIN_API_URL || "https://aicm3pweed.us-east-1.awsapprunner.com";

export async function POST(req: NextRequest) {
  const { urls } = await req.json() as { urls: string[] };

  if (!urls?.length) {
    return Response.json({ error: "No URLs provided" }, { status: 400 });
  }

  const results: Record<string, {
    name?: string;
    headline?: string;
    photo_url?: string;
    location?: string;
    company?: string;
    education?: string;
    experience?: string;
    about?: string;
    skills?: string;
  }> = {};

  // Try bulk cache lookup first
  try {
    const resp = await fetch(`${LINKEDIN_API}/linkedin/database`, {
      signal: AbortSignal.timeout(10000)
    });
    if (resp.ok) {
      const allProfiles = await resp.json() as Array<Record<string, string>>;
      const profileMap = new Map<string, Record<string, string>>();
      for (const p of allProfiles) {
        if (p.url) {
          // Normalize URL for matching
          const normalized = p.url.replace(/\/$/, "").toLowerCase();
          profileMap.set(normalized, p);
        }
      }
      for (const url of urls) {
        const normalized = url.replace(/\/$/, "").toLowerCase();
        const match = profileMap.get(normalized);
        if (match) {
          results[url] = {
            name: match.name,
            headline: match.headline,
            photo_url: match.photo_url,
            location: match.location,
            company: match.company,
            education: match.education,
            experience: match.experience ? match.experience.substring(0, 500) : undefined,
            about: match.about,
            skills: match.skills,
          };
        }
      }
    }
  } catch {
    // Cache lookup failed, try individual lookups
  }

  // For URLs not in cache, try individual scrape endpoint (rate limited)
  const missing = urls.filter((u) => !results[u]);
  const toScrape = missing.slice(0, 10); // Max 10 live scrapes per request

  for (const url of toScrape) {
    try {
      const resp = await fetch(
        `${LINKEDIN_API}/linkedin/manual-scrape`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, name: "", email: "", content: "" }),
          signal: AbortSignal.timeout(15000),
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        results[url] = {
          name: data.name,
          headline: data.headline,
          photo_url: data.photo_url,
          location: data.location,
          company: data.company,
          education: data.education,
          experience: data.experience ? data.experience.substring(0, 500) : undefined,
          about: data.about,
          skills: data.skills,
        };
      }
    } catch {
      // Skip failed individual lookups
    }
  }

  return Response.json({
    enriched: results,
    found: Object.keys(results).length,
    total: urls.length,
  });
}

# Development Timeline

**Read this out loud in 4 points:**

1. **Built in a single continuous session: March 21, 5:49 PM to March 22, 3:00 PM — about 21 hours.** 100+ commits across 8 phases. From `create-next-app` to a production SaaS with AI scoring, LinkedIn enrichment, Gale-Shapley matching, Stripe billing, and a polished editorial UI.

2. **Each major feature followed a Build → Fix → Polish rhythm.** Build it (1-3 commits), fix the edge cases that real data exposes (1-2 commits), then polish the UI (1-2 commits). This pattern repeated ~15 times across the build, each cycle taking 30-90 minutes.

3. **The scoring engine went through 4 major iterations in one night.** v1: bare GPT call. v2: + LinkedIn enrichment. v3: + configurable rubric + evidence. v4: + HyDE pre-filter + cost tracking. Each iteration was driven by a specific user experience gap, not premature optimization.

4. **All design work happened after 3 AM, after all features were functional.** Design polish on a working product is more efficient than polishing wireframes. The design audit identified 7 specific findings, removed AI template patterns, and pushed for A grades on accessibility metrics.

---

## If they probe deeper

**"What was the hardest phase?"** — Phase 4 (Advanced Features, midnight to 1 AM). Gale-Shapley implementation + discovering the 23 unnamed candidates + migrating scoring to the backend. Three unrelated problems hit at once.

**"When did the biggest architecture change happen?"** — 12:33 AM: scoring moved from Vercel edge to App Runner. Hit the 30-second timeout during a real 93-candidate run. Recognized and fixed within one commit cycle.

**"What was peak productivity?"** — 3-5 AM: 20+ commits in 2 hours. This was the design polish + rubric perspectives phase. Features were done, I was iterating on UX and visual design with rapid feedback loops.

**"What was the last thing built?"** — Clerk auth page styling (1-3 PM the next day). The final 4 commits were all CSS: removing Clerk branding, fixing selectors that broke between Clerk versions.

## Key milestones
- 5:49 PM — First commit
- 6:43 PM — Auth working
- 10:14 PM — **GPT scoring live**
- 11:19 PM — **Gale-Shapley shipped**
- 1:27 AM — Rubric editor
- 3:28 AM — **Judge presets**
- 5:13 AM — **HyDE pre-filter**
- 8:54 AM — **Stripe integration**
- 3:00 PM — Final commit

## See also
- [[Build Phases]] — Detailed breakdown of each phase
- [[Decision Log]] — Why decisions were made when they were

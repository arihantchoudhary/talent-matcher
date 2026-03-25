# Build Phases

**Read this out loud in 4 points:**

1. **Phase 1-2 (Scaffold + Foundation, 4 hours): Data model first, then skeleton with real data.** Started with role templates (the scoring contract), then built auth + dashboard + landing page. Immediately populated with 93 real candidates — no lorem ipsum. Collapsed multi-page to single-page at hour 2 when I recognized the complexity wasn't adding value.

2. **Phase 3-4 (AI Scoring + Advanced Features, 3 hours): Core pipeline, then algorithmic depth.** Built scoring in order of data dependency: GPT scoring → LinkedIn enrichment → session persistence → role management. Then added Gale-Shapley for multi-role matching, fixed name extraction edge cases, and migrated scoring to the backend when I hit Vercel's timeout limit.

3. **Phase 5-6 (Analytics + Rubric Perspectives, 3.5 hours): Make the AI transparent and controllable.** Added the rubric editor (the inflection point — transformed from "AI scores" to "you control the AI"). Then built 5 named judges, animated the UI, added stats/export/distribution charts. This is where the product went from functional to differentiated.

4. **Phase 7-8 (Design + Production, 10.5 hours): Polish and monetize.** Systematic design audit (7 findings), broke AI template patterns, added HyDE cost optimization, Stripe billing, full mobile responsive, and auth page styling. The HyDE pre-filter made the free tier economically viable at $0.04/run instead of $0.14.

---

## If they probe deeper on any phase

### Phase 1: Scaffold (17 min)
Next.js 15 + 30 role templates. **Why roles first?** They define the scoring contract. Every downstream feature depends on how roles are structured.

### Phase 2: Foundation (3.5 hrs)
Auth + landing + dashboard. **Key simplification:** Collapsed multi-page to single-page at hour 2. Recognized that page transitions during scoring would break user focus.

### Phase 3: AI Scoring (1.2 hrs)
GPT scoring + LinkedIn enrichment + sessions. **Why enrichment same-day as scoring?** Enrichment is a quality multiplier (50 chars → 1200 chars per candidate). It was recognized as critical, not treated as a nice-to-have.

### Phase 4: Advanced Features (2 hrs)
Gale-Shapley + name fixes + backend migration. **The midnight crisis:** 23 unnamed candidates discovered. Vercel timeout hit. Both fixed in one commit cycle each. Backend migration was the biggest architecture change of the build.

### Phase 5: Analytics & UX (2.5 hrs)
Rubric editor + stats + export + mobile. **The inflection point:** The rubric editor (commit `526d6a5` at 1:27 AM) is the single most important feature — it transforms the product from a demo to a tool.

### Phase 6: Rubric Perspectives (52 min)
5 named judges + animated UI. **Product insight:** Recruiters think in personas, not percentages. "I want someone scrappy" > "set Cultural Fit to 40%."

### Phase 7: Design Polish (2.2 hrs)
7 design findings + anti-AI patterns. **Methodology:** Each finding got an ID, a description, an atomic commit, and a grade (targeting A across 5 dimensions).

### Phase 8: Production Ready (8.5 hrs)
HyDE + Stripe + mobile + auth styling. **The 4-minute Stripe migration:** Frontend Stripe → backend Stripe in 4 minutes when I realized webhook verification needs server-side secrets.

## See also
- [[Development Timeline]] — Visual timeline with commit density
- [[Decision Log]] — Why each decision was made

# Build Phases

Detailed breakdown of the 8 development phases, what was built, and why in that order.

## Phase 1: Scaffold (17 minutes)
*5:49 PM - 6:06 PM | 5 commits*

**Goal:** Get a deployable Next.js app with role data.

| Commit | What |
|--------|------|
| `35d7606` | Initial Next.js 15 + TypeScript + Tailwind v4 |
| `745402d` | 12 role templates (hardcoded) |
| `59738c9` | Expanded to 30 roles across 30+ cities |
| `17975ed` | CLAUDE.md with auto-deploy rule |
| `cb0d34d` | Initial commit (clean git history) |

**Systems thinking:** Start with the data model (roles), not the UI. The role templates define the entire scoring contract — what makes a "good" candidate is determined by the role.

---

## Phase 2: Foundation (3.5 hours)
*6:06 PM - 9:47 PM | 8 commits*

**Goal:** Landing page, auth, dashboard shell, real candidate data.

| Commit | What |
|--------|------|
| `16f1d68` | 23 shadcn/ui components |
| `3da5d4a` | Landing page + Clerk auth + /match route |
| `0e17c44` | Fix Vercel build (route group issue) |
| `ae6fdf1` | Full dashboard with sidebar |
| `8ea424d` | Simplify to ranked candidates view |
| `eaa59e8` | LinkedIn photos/names/headlines for 93 candidates |
| `c6e5782` | Complete product shell (landing + auth + dashboard) |
| `b4667bf` | Move pricing to landing page |

**Systems thinking:** Build the skeleton first — auth, navigation, layout. Then populate with real data (93 actual candidates) to test everything with production-scale data from day one. No lorem ipsum.

**Key decision:** Simplified from multi-page to single-page ranked view early. The initial multi-page design added complexity without value. Simplification happened at commit `8ea424d` — just 2 hours in.

---

## Phase 3: AI Scoring (1.2 hours)
*9:47 PM - 10:58 PM | 7 commits*

**Goal:** Real GPT-powered scoring with LinkedIn enrichment and session history.

| Commit | What |
|--------|------|
| `a11d091` | Role picker + real AI scoring |
| `32842d6` | LinkedIn enrichment API integration |
| `935c4a7` | Session history (grouped by role) |
| `863aa23` | DynamoDB session persistence |
| `03f188a` | Roles management page |
| `323b68d` | Roles persisted to backend API |
| `3536029` | API key settings link |

**Systems thinking:** The core pipeline was built in order of data dependency:
1. Scoring (needs role + candidates)
2. Enrichment (improves scoring quality)
3. Persistence (saves scoring results)
4. Management (CRUD for roles)

Each layer adds value to the previous one. LinkedIn enrichment was added in the same session as scoring — not an afterthought, but a recognized quality multiplier.

---

## Phase 4: Advanced Features (2 hours)
*10:58 PM - 12:54 AM | 14 commits*

**Goal:** Stable matching, fix name extraction bugs, migrate scoring to backend.

| Commit | What |
|--------|------|
| `4009269` | Browser API key storage |
| `ccd1f63` | Gale-Shapley stable matching |
| `421a009` | Rebuild stable match UI |
| `f92a74a` | Fix names + B&W styling |
| `11a4d4c` | Pipeline visualization |
| `8b1964d` | Fix name extraction (LinkedIn slugs) |
| `8cd120e` | Debug console logs |
| `4d48c69` | Retry logic (3x) + batch size 3 |
| `c53a3cb` | Fix 23 unnamed candidates |
| `5955710` | **Move scoring to backend** |
| `157611b` | Candidate photos from LinkedIn DB |
| `c2cafdd` | Fix slug parser edge case |
| `3f8ff21` | Redesign history detail view |
| `b562d5e` | Stream drop resilience |

**Systems thinking:** This phase is where real-world data exposed edge cases. The CSV had 23 candidates whose names couldn't be extracted by any heuristic. Instead of building a perfect general solution, a pragmatic `SLUG_NAMES` map was added for the known dataset, alongside improving the general algorithm.

**Critical decision:** Moving scoring from Vercel edge to backend (commit `5955710`). Hit the 30-second timeout wall. This is a classic "hit the ceiling, replatform" moment — recognized early enough to fix without major refactoring.

---

## Phase 5: Analytics & UX (2.5 hours)
*12:54 AM - 3:23 AM | 19 commits*

**Goal:** Make scoring results actionable — rubric editing, stats, export, responsive.

| Commit | What |
|--------|------|
| `813cf96`-`538b800` | Session metadata (user, duration, LinkedIn) |
| `526d6a5` | **Scoring rubric editor** |
| `54bd846` | Source evidence in results |
| `65a5ddf` | Per-criterion scores |
| `8773935` | Security fix (remove DB count leak) |
| `144335a` | README for submission |
| `4f19fbb` | **Mobile responsive** |
| `9bd905d` | Device tracking |
| `bb562c4` | **Global scoring context** |
| `f3ecb5d` | Enrich count fix + banner |
| `7ded56a` | CSV/JSON export + stats |
| `13e293d` | Score distribution chart |
| `100dba6` | Token/cost display |
| `f0d841b` | Bigger photos + rank badges |
| `382d431` | **Card/table/list views + re-ranking** |

**Systems thinking:** Phase 5 is about making the AI transparent. Raw scores aren't useful — recruiters need:
- **Why** this score? → Per-criterion breakdown + evidence
- **What patterns?** → Distribution chart + tier stats
- **What if I disagree?** → Manual re-ranking
- **How much did this cost?** → Token/cost tracking

The rubric editor (commit `526d6a5`) was the inflection point: it transformed the product from "AI scores your candidates" to "you control how AI evaluates your candidates."

---

## Phase 6: Rubric Perspectives (52 minutes)
*3:23 AM - 4:15 AM | 12 commits*

**Goal:** Judge presets, animated UI, unified design language.

| Commit | What |
|--------|------|
| `efe4506` | 5 rubric presets (judges) |
| `a0b8ec2` | Type fix for presets |
| `f1d27f4` | Donut chart per criterion |
| `d334688` | Unified dashboard design |
| `0466ff8` | Animated rubric bars + judge pills |
| `6798c0b` | Token/cost in session history |
| `dff4387` | Full-width perspective UI |
| `d90a3c4` | Serif headings, draggable sliders |
| `afb9eea` | Clean judge names |
| `a4a51ee` | Judge animations + architecture diagrams |
| `c5de63c` | Architecture mermaid diagrams + paper |
| `62549b0` | Staggered animations |

**Systems thinking:** Named judges are a product insight, not a technical one. Recruiters don't think in weight percentages — they think "I want someone scrappy" or "I need a closer." The judge personas translate recruiter intuition into scoring configuration.

This phase also unified the visual language across all pages. Before this, each page had slightly different styling.

---

## Phase 7: Design Polish (2.2 hours)
*4:15 AM - 6:29 AM | 14 commits*

**Goal:** Landing page redesign, scroll animations, systematic design audit.

| Commit | What |
|--------|------|
| `e5880e7` | Serif headings + letter spacing |
| `73532db` | Shrink landing sections |
| `ac2252c` | Scroll-triggered animations |
| `4b5e67b` | Simpler CSV drop zone |
| `fc81294` | Newsreader logo everywhere |
| `82c96b5`-`137d144` | **Design findings 001-009** |
| `1265555` | Filter history by judge |
| `ae09548` | Build fix |
| `facb97d` | Photos in history detail |
| `a867302` | **Break AI template patterns** |
| `908b9f5` | Rich scoring view |
| `b90de89` | Elapsed timer |
| `2bdbf32` | Clickable distribution bars |
| `7f8eaaf` | Kill all purple/indigo |

**Systems thinking:** Design audit was methodical, not cosmetic. Each "FINDING" commit addresses a specific usability or accessibility issue:
- Touch targets → WCAG compliance
- Contrast ratios → Readability
- AI patterns → Differentiation

The "kill all purple" commit was a conscious brand decision: AI products default to purple/blue. Going pure B&W is a differentiator and signals seriousness.

---

## Phase 8: Production Ready (8.5 hours)
*6:29 AM - 3:00 PM | 26 commits*

**Goal:** HyDE pre-filter, cost optimization, Stripe billing, mobile polish, auth styling.

| Commit | What |
|--------|------|
| `46ddfc7` | A-grade design push |
| `b68d472` | History detail stats |
| `b90ace1` | **Top K selection** |
| `d78a033` | TopK button animation |
| `a027ef4` | Compact 3-col setup |
| `a629d8c` | Embedding comparison diagram |
| `7e4347e` | **HyDE embedding pre-filter** |
| `460d1b3` | Token/cost tracking per candidate |
| `9a738dc` | Touch target fix |
| `ddfa83c` | Table text wrapping |
| `c1ba706` | Custom user menu (remove Clerk branding) |
| `5c1d176` | Full mobile responsive |
| `fa19682`-`0e7c92a` | Fix double-scoring bugs |
| `4030bfe` | Structured ideal candidate per judge |
| `20d7bb7`-`356853d` | Pill builder for ideal candidate |
| `ad722d0` | Fix stale closure bug (judge/cost/tokens) |
| `c7391f7`-`fe77781` | History page redesign |
| `d5790e6` | Embedding similarity display |
| `fc074a2`-`466567b` | Judge naming + sentence preview |
| `ee6460d`-`f00d302` | **Stripe integration** |
| `94808af`-`4ca125e` | Auth page styling |

**Systems thinking:** Phase 8 is about optimization and monetization. The HyDE pre-filter and top-K selection are cost optimization features that make the free tier viable (3 postings/month at ~$0.04 each = $0.12 total cost to the platform).

The double-scoring bug (commits `fa19682`-`0e7c92a`) is worth noting: a stale closure in the scoring context caused candidates to be scored twice. This is a classic React hooks pitfall — the fix was ensuring the SSE handler had fresh references.

**Stripe moved to backend** within 4 minutes of initial integration (`ee6460d` → `f00d302`). Realized immediately that webhook verification needs server-side secrets.

## Related
- [[Development Timeline]] — Visual timeline
- [[Decision Log]] — Why each decision was made

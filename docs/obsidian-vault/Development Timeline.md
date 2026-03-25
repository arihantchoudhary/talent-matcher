# Development Timeline

100+ commits in ~21 hours. March 21, 5:49 PM → March 22, 3:00 PM.

## Phase Map

| Phase | Time | Duration | Focus |
|-------|------|----------|-------|
| [[Build Phases#Phase 1|1. Scaffold]] | 5:49-6:06 PM | 17 min | Next.js + roles + CLAUDE.md |
| [[Build Phases#Phase 2|2. Foundation]] | 6:06-9:47 PM | 3.5 hr | Auth, landing, dashboard, hardcoded data |
| [[Build Phases#Phase 3|3. AI Scoring]] | 9:47-10:58 PM | 1.2 hr | GPT integration, LinkedIn enrichment, sessions |
| [[Build Phases#Phase 4|4. Advanced Features]] | 10:58-12:54 AM | 2 hr | Stable matching, name fixes, backend migration |
| [[Build Phases#Phase 5|5. Analytics & UX]] | 12:54-3:23 AM | 2.5 hr | Rubric editor, stats, export, responsive |
| [[Build Phases#Phase 6|6. Rubric Perspectives]] | 3:23-4:15 AM | 52 min | Judge presets, animated UI, design system |
| [[Build Phases#Phase 7|7. Design Polish]] | 4:15-6:29 AM | 2.2 hr | Landing page, scroll animations, design audit |
| [[Build Phases#Phase 8|8. Production Ready]] | 6:29 AM-3:00 PM | 8.5 hr | HyDE, cost tracking, Stripe, mobile, auth styling |

## Commit Density

```
5 PM  ██
6 PM  ████████
7 PM  ████
8 PM  ████████
9 PM  ██████████
10 PM ████████████
11 PM ████████████████
12 AM ██████████████████████
1 AM  ████████████████████████████
2 AM  ██████████
3 AM  ████████████████████████████████
4 AM  ██████████████████████████████████████████
5 AM  ████████████████████████████████
6 AM  ████████████████████
7 AM  ████████████
8 AM  ████████
9 AM  ████
1 PM  ████████
3 PM  ████
```

Peak productivity: 3-5 AM (design polish and advanced features).

## Key Milestones

| Time | Milestone | Significance |
|------|-----------|-------------|
| 5:49 PM | First commit | Project created |
| 6:43 PM | Clerk auth working | Users can sign in |
| 8:11 PM | Dashboard with real candidates | 93 candidates visible |
| 10:14 PM | **GPT scoring live** | Core product works |
| 10:18 PM | LinkedIn enrichment | Scoring quality jumps |
| 11:19 PM | **Gale-Shapley shipped** | Multi-role matching |
| 12:33 AM | Backend migration | Scoring moves to App Runner |
| 1:27 AM | Rubric editor | Recruiter control over scoring |
| 3:28 AM | **Judge presets** | Product differentiation |
| 4:15 AM | Design audit begins | Visual polish pass |
| 5:13 AM | **HyDE pre-filter** | Cost optimization |
| 8:54 AM | **Stripe integration** | Monetization |
| 3:00 PM | Final commit | Production-ready |

## Patterns in the Timeline

### Build → Fix → Polish Rhythm
Each major feature followed the same pattern:
1. **Build** — Get it working (1-3 commits)
2. **Fix** — Handle edge cases, bugs (1-2 commits)
3. **Polish** — Make it look right (1-2 commits)

### Deepening Iterations
The scoring engine went through 4 major iterations:
1. **v1** — Direct GPT call per candidate (commit `a11d091`)
2. **v2** — + LinkedIn enrichment (commit `32842d6`)
3. **v3** — + Configurable rubric + evidence (commits `526d6a5`-`65a5ddf`)
4. **v4** — + HyDE pre-filter + cost tracking (commits `7e4347e`-`460d1b3`)

### Night Shift Design
Most design work happened 3-5 AM — after all features were functional. This is intentional: design polish on a working product, not wireframing before code.

## Related
- [[Build Phases]] — Detailed breakdown of each phase
- [[Decision Log]] — Why decisions were made when they were

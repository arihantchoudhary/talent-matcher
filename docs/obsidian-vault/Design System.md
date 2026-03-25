# Design System

**Read this out loud in 4 points:**

1. **Black and white editorial aesthetic, inspired by the New York Times, not a SaaS dashboard.** Recruiting is high-stakes — the UI should feel authoritative, not playful. B&W forces information hierarchy through typography and spacing rather than color coding. Color is reserved for semantic meaning only (green = strong point, red = gap).

2. **Two fonts: Newsreader (serif, italic) for headings, Inter (sans-serif) for body.** The serif/sans contrast creates visual hierarchy without relying on size differences. Newsreader headings give editorial gravity. Inter body text provides digital clarity. This combo looks nothing like typical AI product design.

3. **Every "AI product" visual cliché was identified and removed.** Purple gradients → pure B&W. Left-border accent cards → clean border-only. Symmetric 3-card grids → asymmetric layouts. "Powered by AI" badges → nothing (let the scoring speak). + bullet points in pricing → em dashes. The goal: look handcrafted, not template-generated.

4. **Animations are functional, not decorative, with full reduced-motion support.** Scroll-triggered reveals (CSS `animation-timeline: view()`) guide the eye on the landing page. Judge selection animates weight bars to show *what changed*. Stagger animations (60ms per child) create visual rhythm. All animations respect `prefers-reduced-motion`.

---

## If they probe deeper

**"Why no color?"** — Every AI product uses purple/blue gradients. Going pure B&W is a differentiator. It also signals seriousness about the underlying technology — "we don't need visual tricks to impress you, the product speaks for itself."

**"What's the reduced-motion implementation?"** — A CSS media query that sets `animation-duration: 0.01ms` and `transition-duration: 0.01ms` for all elements. Users with vestibular disorders or motion sensitivity get a static experience with no loss of functionality.

**"How did you identify AI template patterns?"** — By looking at what every AI-generated landing page has in common: left-border cards, purple accents, symmetric grids, "magic wand" iconography. Each was explicitly targeted and replaced with an alternative that doesn't trigger the "this was made by AI" feeling.

## See also
- [[Design Audit Trail]] — Specific findings and fixes
- [[Mobile Responsiveness]] — Responsive patterns

# Mobile Responsiveness

**Read this out loud in 4 points:**

1. **Every screen works from 320px phone to 2560px ultrawide.** The sidebar becomes a horizontal scrollable nav on mobile. 3-column grids stack to single column. The results table gets horizontal scroll with a sticky first column. Judge cards go from 5-across to a 2-column grid.

2. **Mobile-last, not mobile-first.** Recruiters primarily use desktop for candidate evaluation. Mobile is for quick checks ("did my scoring finish?"). Desktop layout is designed first, then gracefully stacked for mobile. This matches actual usage patterns.

3. **All interactive elements meet 44px minimum touch targets (WCAG 2.5.5).** Buttons, links, slider thumbs, histogram bars — everything was audited. The smallest button went from 36px to 44px. This prevents frustrating tap errors on phones and tablets.

4. **Device type (mobile vs desktop) is tracked per session for analytics.** `window.innerWidth < 768 ? "mobile" : "desktop"` is stored in session metadata. This reveals usage patterns — are people scoring on desktop and reviewing on mobile?

---

## If they probe deeper

**"What are the breakpoints?"** — <640px (phone, single column), 640-768px (large phone, 2-column), 768-1024px (tablet, sidebar appears), 1024px+ (desktop, full layout).

**"How does the nav change on mobile?"** — The sidebar (vertical, fixed left) transforms into a top horizontal bar with scroll-snap. All 5 navigation links remain accessible, just rearranged horizontally.

**"What about the scoring pipeline view on mobile?"** — The 4-step pipeline stepper stacks vertically instead of horizontally. The live log shows fewer entries (20 instead of 40) to save screen space.

## See also
- [[Design System]] — Visual design choices
- [[Design Audit Trail]] — Touch target findings

# Design Audit Trail

Systematic visual polish pass. Each finding is a specific design issue identified and fixed.

## Methodology

After the core product was functional, ran a design audit looking for:
1. **Inconsistency** — Different heading sizes, spacing, colors across pages
2. **AI template patterns** — Visual clichés that scream "made with AI"
3. **Accessibility** — Touch targets, contrast, motion sensitivity
4. **Information hierarchy** — Can users scan and find what matters?

## Findings

### FINDING-001: Inconsistent H3 in Capabilities Section
**Issue:** H3 headings in the landing page capabilities grid were different sizes.
**Fix:** Standardized to `text-lg font-semibold`.
**Commit:** `82c96b5`

### FINDING-002: CTA Heading Size Mismatch
**Issue:** The call-to-action section's H2 was smaller than other H2s on medium+ screens.
**Fix:** Matched CTA heading to the same responsive size scale.
**Commit:** `398edbb`

### FINDING-003: Below-Fold Text Contrast
**Issue:** Body text below the hero had insufficient contrast (neutral-400 on white).
**Fix:** Bumped to neutral-600 minimum for readability.
**Commit:** `c97555d`

### FINDING-004: Touch Targets Below 44px
**Issue:** Several buttons and links had click/touch areas under the 44px WCAG minimum.
**Fix:** Added padding to bring all interactive elements to ≥44px.
**Commit:** `2f94b09`

### FINDING-005: AI Slop — Left-Border Cards
**Issue:** Feature cards had a colored left border — a dead giveaway of AI-generated templates.
**Fix:** Removed left borders, used clean card styling.
**Commit:** `fb9bdbd`

### FINDING-009: Tiny Bullets in Pricing
**Issue:** Pricing feature lists used `+` bullets that were hard to read at body text size.
**Fix:** Replaced with em dashes for readable inline lists.
**Commit:** `137d144`

### FINDING-011: Nav Button Touch Target
**Issue:** "Get Started" nav button was 36px tall.
**Fix:** Bumped to 44px minimum.
**Commit:** `9a738dc`

## Design Breaking Patterns

Beyond individual findings, a separate pass broke template-level patterns:

| AI Template Pattern | What We Did |
|-------------------|-------------|
| Symmetric 3-card grid | Asymmetric layout with varied card sizes |
| Identical section rhythm | Alternating section spacing |
| Uniform card styling | Mix of bordered, borderless, elevated cards |
| Stock hero pattern | Product preview screenshot in hero |

**Commit:** `a867302`

## Push for A Grades

Final pass targeting specific grade improvements:

- Touch targets → A grade (all ≥44px)
- Hover states → A grade (every clickable element has hover feedback)
- Motion accessibility → A grade (prefers-reduced-motion respected)
- Layout asymmetry → A grade (no template-feeling grids)
- Checkmarks → A grade (consistent check style in feature lists)

**Commit:** `46ddfc7`

## Related
- [[Design System]] — Visual design principles
- [[Mobile Responsiveness]] — Touch target context
- [[Development Timeline]] — When design audit happened

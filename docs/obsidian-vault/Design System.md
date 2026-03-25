# Design System

B&W editorial aesthetic inspired by print design. Deliberate rejection of "AI product" visual tropes.

## Design Philosophy

**Look like the New York Times, not a SaaS dashboard.**

Why:
1. Recruiting is a serious, high-stakes decision. The UI should feel authoritative, not playful.
2. AI products default to purple gradients and "magic" metaphors. This invites skepticism. A clean editorial look says "here are the facts."
3. B&W forces information hierarchy through typography and spacing, not color coding.

## Typography

| Element | Font | Weight | Style |
|---------|------|--------|-------|
| H1 | Newsreader | 500 | Serif, italic |
| H2 | Newsreader | 500 | Serif, italic |
| Body | Inter | 400 | Sans-serif |
| Labels | Inter | 500 | Sans-serif |
| Monospace | System | 400 | Code blocks |

**Newsreader** for headings = editorial gravity.
**Inter** for body = digital clarity.

The serif/sans-serif contrast creates visual hierarchy without relying on size differences alone.

## Color Palette

```
Black:     #0a0a0a (neutral-950)  — Primary text, buttons, badges
Dark:      #171717 (neutral-900)  — Headings, borders
Mid-dark:  #404040 (neutral-700)  — Secondary text
Mid:       #737373 (neutral-500)  — Muted text, dividers
Light:     #e5e5e5 (neutral-200)  — Borders, backgrounds
Lighter:   #f5f5f5 (neutral-100)  — Card backgrounds
White:     #ffffff                 — Page background

Accent (minimal):
Green:     Semantic only — highlights, positive signals
Red:       Semantic only — gaps, errors
```

**No blue. No purple. No gradients.** Color is reserved for semantic meaning.

## Component Patterns

### Cards
```css
border border-neutral-200 bg-white p-6 rounded-xl
/* hover: */ border-neutral-300 shadow-sm transition-all
```

### Buttons
```css
/* Primary */
bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm
hover:bg-neutral-800 transition-colors

/* Secondary */
border border-neutral-300 bg-white px-3 py-1.5 rounded-lg text-xs
hover:bg-neutral-50 transition-colors
```

### Score Badges
```
Top Tier (≥70):  bg-neutral-900 text-white
Good Fit (50-69): bg-neutral-200 text-neutral-800
Moderate (30-49): bg-neutral-100 text-neutral-600
Low Fit (<30):    bg-neutral-50 text-neutral-400
```

## Animations

### Scroll-Triggered (CSS `animation-timeline: view()`)
```css
.section {
  animation: fadeSlideIn 0.6s ease-out both;
  animation-timeline: view();
  animation-range: entry 0% entry 30%;
}
```

### Stagger Animations
```css
.grid > * {
  animation: staggerFade 0.4s ease-out both;
  animation-delay: calc(var(--index) * 60ms);
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Anti-Patterns Avoided

| AI Product Cliché | What We Did Instead |
|-------------------|---------------------|
| Purple/blue gradient backgrounds | Pure white/black |
| "Magic wand" icons | No icons for AI features |
| Left-border accent cards | Clean border-only cards |
| "Powered by AI" badges | Let the scoring speak |
| Animated particle backgrounds | Static, typographic hero |
| + bullet points in pricing | Em dashes for readability |

→ See [[Design Audit Trail]] for specific findings and fixes.

## Related
- [[Design Audit Trail]] — Iterative polish decisions
- [[Mobile Responsiveness]] — Breakpoint patterns
- [[Authentication]] — Auth page custom styling

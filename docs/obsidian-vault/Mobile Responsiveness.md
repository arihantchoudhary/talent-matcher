# Mobile Responsiveness

Full responsive design — every screen works from 320px to 2560px.

## Breakpoint Strategy

| Breakpoint | Target | Key Changes |
|-----------|--------|-------------|
| < 640px | Phone | Single column, stacked layout |
| 640-768px | Large phone / small tablet | 2-column grids |
| 768-1024px | Tablet | Sidebar appears |
| 1024px+ | Desktop | Full 3-column layouts |

## Navigation

### Desktop (≥768px)
```
┌────────────┬────────────────────────────────┐
│  Sidebar   │                                │
│            │         Content                │
│  Upload    │                                │
│  Rankings  │                                │
│  Match     │                                │
│  Roles     │                                │
│  Settings  │                                │
│            │                                │
└────────────┴────────────────────────────────┘
```

### Mobile (<768px)
```
┌────────────────────────────────┐
│  Upload | Rankings | Match | ⋯ │  ← Horizontal scrollable nav
├────────────────────────────────┤
│                                │
│           Content              │
│        (full width)            │
│                                │
└────────────────────────────────┘
```

The sidebar transforms into a top horizontal nav bar with scroll-snap for overflow.

## Key Responsive Patterns

### Upload Page Setup
```
Desktop: 3-column grid (Role | CSV | JD)
Mobile:  Stacked single column
```

### Judge Cards
```
Desktop: 5 cards in a row
Tablet:  2 columns, 3 rows
Mobile:  2 columns, 3 rows (smaller cards)
```

### Results Table
```
Desktop: Full table with all columns
Mobile:  Horizontal scroll with sticky first column
```

### Score Distribution Chart
```
Desktop: Full-width histogram
Mobile:  Same, but narrower bars, smaller labels
```

## Touch Targets

All interactive elements meet the 44px minimum touch target:
- Buttons: min-height 44px
- Nav links: padding ensures 44px hit area
- Score filter bars: 44px clickable area
- Slider thumbs: 44px × 44px

## Device Tracking

The session records which device was used:
```typescript
const device = window.innerWidth < 768 ? "mobile" : "desktop";
// Stored in session metadata for analytics
```

## Related
- [[Design System]] — Visual design choices
- [[Design Audit Trail]] — Touch target findings

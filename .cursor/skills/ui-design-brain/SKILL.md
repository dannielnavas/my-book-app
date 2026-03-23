---
name: ui-design-brain
description: Generates production-grade web UI using documented component patterns and design-system conventions (not generic AI layouts). Use when building or designing web pages, dashboards, forms, navigation, modals, or any React/HTML/Tailwind UI; references 60 components with best practices from component.gallery–style guidance.
---

# UI Design Brain

Curated guidance for **60 UI component patterns** with best practices, layout rules, and aliases. **Before writing UI code**, consult this skill and read [components.md](components.md) for the full reference.

## When to Use

Apply when the user asks to build, design, or generate:

- Web pages, landing pages, marketing sites
- SaaS dashboards, admin panels, settings
- Forms, tables, navigation
- Modals, drawers, popovers, overlays
- Any React, HTML/CSS, or Tailwind UI

## Design Philosophy

Interfaces should feel **modern, minimal, and production-ready** — not templated.

### Core principles

1. **Restraint over decoration** — fewer elements, refined; white space is a feature.
2. **Typography carries hierarchy** — pair a distinctive display font with a clean body font; strong weight contrast between headings and labels.
3. **One strong color moment** — neutrals first (warm off-whites, near-blacks, muted mid-tones); one confident accent.
4. **Spacing is structure** — 8 px grid; tighter gaps group related content; generous gaps for hero sections.
5. **Accessibility** — WCAG AA contrast, visible focus, semantic HTML, keyboard navigation.
6. **No generic AI aesthetics** — avoid purple-on-white gradients, Inter/Roboto defaults, evenly-spaced card grids, cookie-cutter layouts.

### Quality bar

Aim for senior product designer / top SaaS bar: visual rhythm with intentional asymmetry; clear hover/focus/active; empty/loading/error states; responsive without breakpoint artifacts.

## Workflow

### Step 1 — Identify components

Map the request to components. Use [components.md](components.md) by name or alias.

| User intent | Components |
|-------------|------------|
| Navigation | Header, Navigation, Breadcrumbs, Tabs |
| Form | Form, Text input, Select, Checkbox, Radio, Button |
| Data display | Table, Card, List, Badge, Avatar |
| Feedback | Alert, Toast, Modal, Spinner, Progress bar, Empty state |
| Input | Text input, Textarea, Select, Combobox, Datepicker, File upload, Slider |
| Overlay | Modal, Drawer, Popover, Tooltip, Dropdown menu |

### Step 2 — Apply best practices

Per component, follow [components.md](components.md). Broad rules:

**Layout**

- Single-column forms for scan speed.
- Consistent vertical lanes in lists/tables.
- Fixed-width slots for icons/actions (even when empty).
- Cards: media → title → meta → action.

**Interaction**

- Buttons: verb-first labels ("Save changes"); one primary per section.
- Modals: X, Cancel, Escape; trap focus; restore focus on close.
- Toasts: 4–6 s auto-dismiss; manual dismiss; stack newest on top.
- Toggles: immediate effect; checkboxes in forms that require Save.

**Typography & spacing**

- Strict heading hierarchy (h1 → h2 → h3); one h1 per page.
- ≥44 px touch targets on mobile.
- Labels above inputs (vertical) or beside (horizontal).
- Placeholder = format hint only, never replaces label.

**States**

- Empty: illustration + headline + primary CTA.
- Loading: skeleton > spinner; show spinner after ~300 ms delay.
- Validation: inline on blur, not every keystroke.
- Disabled: distinct but readable.

### Step 3 — Design direction

Pick a preset or ask if unclear:

| Preset | Notes |
|--------|--------|
| **Modern SaaS** (default) | Neutral + one accent; 8 px grid; spacious |
| **Apple-level minimal** | Near-monochrome warm grays; large type; 150–250 ms ease-out micro-interactions |
| **Enterprise** | Dense; 4/8/12/16/24 px scale; keyboard-first forms |
| **Creative / portfolio** | Bold type, asymmetric layout, editorial feel |
| **Data dashboard** | Scannable rows; KPI → trend → detail |

### Step 4 — Generate code

Default stack unless the user specifies otherwise:

| Concern | Rule |
|---------|------|
| Stack | React + Tailwind CSS |
| Spacing | Tailwind on 8 px grid (`p-2`, `gap-4`, …) |
| Colors | CSS variables or Tailwind theme tokens |
| Typography | Utilities + expressive pairings (e.g. Google Fonts) |
| States | hover, focus, active, disabled on interactives |
| Responsive | Mobile-first; check ~375, 768, 1440 |
| A11y | Semantic HTML; ARIA when needed; focus management |

## Component quick reference

The 15 most common patterns; full 60-component list in [components.md](components.md).

| Component | Use | Key rule |
|-----------|-----|----------|
| Button | Actions | Verb-first; one primary per section |
| Card | Entity | Media → title → meta → action; shadow **or** border |
| Modal | Focus | Focus trap; X + Cancel + Escape |
| Navigation | Links | 5–7 items; clear active state |
| Table | Data | Sticky header; numbers right-aligned |
| Tabs | Panels | 2–7 tabs; indicator; accordion on small screens |
| Form | Input | Single column; labels; blur validation |
| Toast | Short feedback | 4–6 s; undo for destructive |
| Alert | Status | Semantic color + icon; ≤2 sentences |
| Drawer | Secondary panel | Right detail / left nav; 320–480 px desktop |
| Search input | Find | Cmd/Ctrl+K; debounce 200–300 ms |
| Empty state | No data | Illustration + headline + CTA |
| Skeleton | Loading | Match layout; shimmer |
| Badge | Status | 1–2 words; limited palette |
| Dropdown menu | Actions | 7±2 items; destructive last, red |

## Anti-patterns

Avoid:

- Rainbow badges with no semantics
- Modal inside modal (use page or drawer)
- Disabled submit with no explanation
- Spinner for predictable layouts (use skeleton)
- "Click here" links
- Hamburger on desktop when space allows visible nav
- Auto-advancing carousels
- Placeholder-only fields (always visible labels)
- Equal-weight buttons (establish hierarchy)
- Body text below 14 px (prefer 16 px)

## Additional resources

- Full component reference: [components.md](components.md)

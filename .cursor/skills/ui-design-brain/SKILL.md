---
name: ui-design-brain
description: Generates modern minimalist, sell-ready UI for Angular, Astro, or React Native (Expo) using documented component patterns and design-system conventions—not generic AI layouts. Use when building interfaces, screens, marketing pages, dashboards, or native apps that must look polished enough to ship, demo, or sell; references 60 components in components.md.
---

# UI Design Brain

Curated guidance for **60 UI component patterns** (see [components.md](components.md)) plus **stack-specific rules** for **Angular**, **Astro**, and **React Native + Expo**. **Before writing UI code**, consult this skill and the component reference.

## When to Use

Apply when designing or implementing:

- **Web:** Angular apps, Astro sites (landing, docs, marketing), dashboards, forms, navigation, overlays
- **Native:** Expo / React Native screens, tabs, stacks, modals, lists, settings
- Any work where the UI must feel **minimal, modern, and ready to sell or present** (investor demos, App Store screenshots, client handoff)

## Sell-ready & presentation quality

Interfaces should look like **shipping software**, not prototypes.

- **Visual polish:** consistent radii, borders, and shadows (or flat borders only—pick one system); no mixed elevation styles on one screen
- **Confidence:** one clear primary action per section; no competing CTAs
- **Screenshots & demos:** legible type at a glance; enough contrast for recording and projectors; avoid tiny labels on hero cards
- **Trust:** aligned baselines, even spacing, no “almost aligned” rows
- **Empty & edge cases:** every list and async view gets empty, loading, and error—never a blank screen
- **Motion:** subtle only (150–300 ms); native/Web consistent with platform expectations—no gratuitous animation

## Design philosophy

**Modern minimal** — calm, intentional, product-grade—not decorative.

### Core principles

1. **Restraint over decoration** — fewer elements, refined; white space (or native breathing room) is a feature
2. **Typography carries hierarchy** — distinctive display + clean body on web; on native, use platform-appropriate scale tokens and weight contrast
3. **One strong color moment** — neutrals first; one confident accent for actions and key states
4. **Spacing is structure** — 8 px grid on web; on native, map to a small fixed scale (4/8/12/16/24) via theme or StyleSheet tokens
5. **Accessibility** — WCAG-style contrast on web; sufficient touch targets and labels on native (`accessibilityLabel`, `accessibilityRole`)
6. **No generic AI aesthetics** — no purple gradients, no default Inter/Roboto as the only personality, no uniform card grids with no hierarchy

### Quality bar

Senior product designer / premium SaaS or App Store–quality: clear hierarchy, obvious affordances, polished states, responsive or adaptive layouts without awkward breakpoints.

## Workflow

### Step 1 — Identify components

Map the request to patterns in [components.md](components.md) by name or alias.

| User intent | Components |
|-------------|------------|
| Navigation | Header, Navigation, Breadcrumbs, Tabs |
| Form | Form, Text input, Select, Checkbox, Radio, Button |
| Data display | Table, Card, List, Badge, Avatar |
| Feedback | Alert, Toast, Modal, Spinner, Progress bar, Empty state |
| Input | Text input, Textarea, Select, Combobox, Datepicker, File upload, Slider |
| Overlay | Modal, Drawer, Popover, Tooltip, Dropdown menu |

### Step 2 — Apply best practices

Follow [components.md](components.md) per component. Broad rules:

**Layout**

- Single-column forms where possible; consistent vertical lanes in lists/tables
- Fixed-width slots for icons/actions (even when empty)
- Cards: media → title → meta → action

**Interaction**

- Buttons: verb-first labels; one primary per section
- Modals: close affordance + cancel path + Escape (web) / predictable back dismiss (native)
- Toasts/snackbars: short copy; stack consistently
- Toggles: immediate effect; checkboxes when a Save action applies

**Typography & spacing**

- One main title per screen (web: one `h1` per route where applicable)
- Touch targets ≥44 pt on native; ≥44 px on touch web
- Labels visible; placeholder ≠ label

**States**

- Empty: illustration or icon + headline + primary CTA
- Loading: skeleton when layout is known; spinner after ~300 ms if not
- Validation: inline on blur (web); clear errors before submit (native)

### Step 3 — Design direction

| Preset | Notes |
|--------|--------|
| **Modern SaaS** (default) | Neutral + one accent; spacious; minimal chrome |
| **Apple-level minimal** | Near-monochrome warm grays; large type; soft motion |
| **Enterprise** | Dense but orderly; keyboard-first web; clear data tables |
| **Creative / portfolio** | Expressive type and layout; still minimal ornament |
| **Data dashboard** | KPI → trend → detail; scannable tables |

### Step 4 — Match the stack

Detect from the project or user: **Angular**, **Astro**, or **Expo (React Native)**. Apply the matching rules; default styling approach should stay **minimal and token-driven** (CSS variables, theme objects, or design tokens)—not one-off hex everywhere.

#### Angular

- Prefer **standalone components** and idiomatic template syntax; keep templates readable and shallow
- Style with **component styles** + global tokens (CSS variables or Tailwind if the project uses it); avoid inline style sprawl
- Use **Angular Material** or the project’s UI kit consistently—don’t mix three button styles
- **a11y:** native button/link elements, `aria-*` where Material doesn’t cover it, focus management for dialogs
- Routing: lazy-loaded feature UI should still use the same spacing/type scale as shell layout

#### Astro

- Prefer **content-first pages**: minimal client JS; islands only where interactivity is needed
- **Scoped CSS** or Tailwind consistent with the rest of the site; reuse layout shells for marketing vs app sections
- SEO and performance are part of “sell-ready”: meaningful headings, `alt` text, fast LCP
- Clear visual hierarchy above the fold for landing and pricing pages

#### React Native (Expo)

- Use **Expo Router** patterns if present (tabs, stacks, modals); align headers with screen purpose—minimal titles, clear back
- **Safe areas:** respect notches and home indicators (`SafeAreaView` / `react-native-safe-area-context`)
- **Navigation:** native stack/modal transitions; avoid web-only patterns (hover); use **Pressable** with pressed opacity or scale for feedback
- Lists: `FlatList` / `SectionList` with stable keys; empty `ListEmptyComponent`; pull-to-refresh when data is remote
- **Haptics:** light impact for success actions if the app already uses `expo-haptics`—optional, not gimmicky
- Icons: one family (e.g. `@expo/vector-icons` or Lucide) for consistency
- Prefer **StyleSheet** or the project’s solution (NativeWind, Tamagui, etc.)—match existing patterns

#### Web shared (Angular & Astro)

| Concern | Rule |
|---------|------|
| Spacing | 8 px grid; utilities or tokens |
| Color | CSS variables or theme; one accent |
| Typography | Defined scale; webfonts loaded with restraint |
| States | `:hover`, `:focus-visible`, `:active`, `disabled` |
| Responsive | Mobile-first; check ~375, 768, 1280+ |

#### Native shared (Expo)

| Concern | Rule |
|---------|------|
| Spacing | Consistent scale in theme/StyleSheet |
| Color | Light/dark if app supports both; test contrast |
| Typography | `Text` variants; limit font families |
| States | pressed, disabled, loading on buttons and rows |
| Platform | Test iOS + Android; respect platform nav patterns |

## Component quick reference

Full list in [components.md](components.md).

| Component | Use | Key rule |
|-----------|-----|----------|
| Button | Actions | Verb-first; one primary per section |
| Card | Entity | Media → title → meta → action; shadow **or** border |
| Modal | Focus | Dismiss + focus sanity (web); fullScreen vs sheet on native when appropriate |
| Navigation | Links / routes | Limited items; clear active state |
| Table | Data | Sticky header (web); readable rows on native (cards or table) |
| Tabs | Panels | Clear selected state; avoid tab overload |
| Form | Input | Single column; labels; validation |
| Toast | Short feedback | Brief; consistent placement |
| Alert | Status | Semantic color + icon; short copy |
| Drawer | Secondary panel | Web sheet/drawer; native can use slide-over or screen |
| Search input | Find | Debounced; clear affordance |
| Empty state | No data | Positive copy + CTA |
| Skeleton | Loading | Match final layout |
| Badge | Status | 1–2 words; semantic colors |
| Dropdown menu | Actions | Destructive last |

## Anti-patterns

Avoid:

- Rainbow badges with no semantics
- Nested modals for long flows (use page or drawer / new screen)
- Disabled primary with no explanation
- Spinner for predictable layouts (use skeleton)
- Vague links (“click here”)
- Placeholder-only fields
- Equal-weight buttons
- Body text smaller than ~14 px on web; illegible captions on native

## Additional resources

- Full component reference: [components.md](components.md)

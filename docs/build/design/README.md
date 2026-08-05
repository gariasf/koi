# Handoff: Koi — the full app surface

## Read in this order

1. **`spec-amendments.md`** — the authoritative amendment set. Where the source spec disagrees with
   it, this wins. Start here; it is short and it is what changed.
2. **This README** — tokens, screens, interactions, state, the fixture.
3. **`Koi Palette` + `Koi Control Language`** — build these two sheets' components first; every
   screen is assembled from them.
4. **`spec/koi-core-spec.md`** — product truth: the thesis, the nine constitutional articles, the
   domain model, the invariants. **Predates the design pass** — read §1 above alongside it.
5. **`decisions.md`** — the running log: every question answered, every arithmetic correction, with
   derivations. §B holds the fixture ledger; §H holds the answers.
6. **`spec/wireframes.md`** — the structural pass these sheets were drawn from, with § references
   the sheets cite.

## Overview

Koi is an iOS-first (React Native / Expo, Android planned) **car-cost ledger**. This bundle is the
complete visual design for its app surface: 14 sheets covering the shell, four tabs, capture, record
pages, reminders, the insurance vault, onboarding, plus a palette/token sheet, a control-library
sheet and two annexes.

The product's thesis: log a fill in seconds, never be lied to about a derived number, and never be
nagged. Three constitutional articles drive most of the design:

- **Home is never a dashboard** and never grows charts.
- **Every derived number shows its basis** — the interval, the inputs, what was included.
- **Missing data is stated in a sentence, never styled as an error.** Nothing is red except a
  destructive confirmation or a hard validation error.

## About the design files

The `.dc.html` files in this bundle are **design references authored in HTML** — spec sheets showing
intended look, copy and behaviour. They are **not production code to copy**. Each file renders as a
documentation plate (steel-blue "Industry" chrome, square corners, registration marks) containing
**iPhone frames** that hold the actual product design. The chrome is documentation only; it never
appears in the app. Only what is *inside* the phone frames is the product.

The task is to **recreate the in-frame designs in React Native**, using the existing `@koi/mobile`
patterns and component set. Where this design contradicts the current code, this design is the
reference — §"Known contradictions" below lists the specific ones.

## Fidelity

**High-fidelity.** Final colours, type scale, spacing, radii, copy and motion timings. Every hex is
listed in §Design tokens and every string in the frames is final copy. Two caveats:

1. **Icons are Lucide** (`lucide.dev`), thin-stroke, `stroke-width: 1.75`. The sheets inline the SVG
   paths directly; use `lucide-react-native` in the app.
2. **Charts are drawn as stat tables, deliberately.** The chart engine is not installed. Spec §D4's
   own escape hatch — "a chart that cannot earn its headline and sentence is a stat table instead" —
   makes the table form shippable now, and the target mark grammar is documented on sheet 02 §08 for
   when a canvas arrives. Gaining marks later is not an IA change.

## Design tokens

Replace `src/ui/theme.ts`'s single palette with a resolved light/dark pair. Nothing here is
optional: dark mode is co-primary and is **authored, not inverted**.

```ts
export const palette = {
  light: {
    paper: '#FBF9F5',  card: '#FFFFFF',  sheet: '#FFFFFF',  hairline: '#E6E1D8',
    ink:   '#1C1A17',  inkSoft: '#5B564E',  inkFaint: '#787166',
    domain:     { fuel: '#43823B', service: '#9C731A', expense: '#337FB8', contract: '#8A4879' },
    domainWash: { fuel: '#E7F0E5', service: '#F5EBD8', expense: '#E3EDF6', contract: '#F3E9F1', ink: '#EFEDE7' },
    domainText: { fuel: '#35692F', service: '#7E5C12', expense: '#24608F', contract: '#6E3960', ink: '#5B564E' },
    attention: '#9C5A16',  critical: '#A32D22',  positive: '#1F6F63',
  },
  dark: {
    paper: '#14120F',  card: '#211E19',  sheet: '#282420',  hairline: '#2E2A24',
    ink:   '#F4F0E8',  inkSoft: '#B8B0A4',  inkFaint: '#8F877A',
    domain:     { fuel: '#4E9139', service: '#BB8826', expense: '#4E92CE', contract: '#A05C96' },
    domainWash: { fuel: '#1E2A1B', service: '#2E2417', expense: '#1C2731', contract: '#2A1F27', ink: '#262219' },
    domainText: { fuel: '#62A64C', service: '#D2A03C', expense: '#78B0DE', contract: '#C489BA', ink: '#B8B0A4' },
    attention: '#E8934A',  critical: '#E86458',  positive: '#4FA795',
  },
} as const;

// Controls. Emphasis is INK — the accent means fuel money and nothing else.
export const control = {
  light: { primaryBg: '#1C1A17', primaryFg: '#FBF9F5', primaryPress: '#3B3733',
           secondaryBg: '#FFFFFF', secondaryPress: '#F2EFE8', ghostPress: '#EEF3EC', focusRing: '#43823B' },
  dark:  { primaryBg: '#F4F0E8', primaryFg: '#14120F', primaryPress: '#CFC8BC',
           secondaryBg: '#211E19', secondaryPress: '#2B2721', ghostPress: '#1E2A1B', focusRing: '#4E9139' },
} as const;

export const radius = { field: 8, button: 8, well: 10, card: 15, sheet: 26, fab: 16, chip: 999 } as const;
export const fab = { size: 52, radius: 16, shadow: '0 6px 18px rgba(28,26,23,0.18)' } as const;  // neutral. never a glow.
export const motion = { fade: 150, spring: 'capture-success-only', reduceMotion: 'fade' } as const;
```

**Two fixes that ride with this:** `app.json` declares `userInterfaceStyle: automatic` while
`_layout.tsx` pins `StatusBar style="dark"` — dark content on a dark ground. And `#F6EFE3` in
`sync/provider.tsx` is off-palette; delete it.

### The colour law (spec §D3)

- **Four domain hues only.** Fuel is also the app's single accent. Mixed-kind money (any total) is
  **ink**, never a hue.
- **Emphasis is ink.** Primary buttons and the FAB are ink-filled. The one exception is tinted
  interactive *type* — back links, `Discard`, toast `Undo`, picker checkmarks — which stays accent
  because it reads as tappable without competing for weight.
- **Wells are `domainWash` + `domainText`**: a tinted 40×40 box, radius 10, holding a thin-stroke
  glyph. Never a saturated block, never emoji.
- **Semantics are reserved, never a fifth series.** `positive` is a teal, deliberately *not* the
  fuel hue, so the app keeps exactly one green.
- **Nothing turns red** but a destructive confirmation or a hard validation error. Overdue, over-cap
  and sync failure all wear `attention`.

### Type

Three voices. System font (SF / Roboto) for display and text; **IBM Plex Mono, bundled**, for the
data voice — every number, amount, date, unit and micro-label, always `tabular-nums`, es-ES locale
(`1.234,56 €`, `43.465 km`). Do **not** use Menlo: it is Apple-only and falls back to a
proportional face on Android, where numbers then jitter.

Scale: display 28/600 · title 19/600 · body 15/400 · soft 14/400 · faint 13/400 · data 15 mono ·
micro 11/600 tracked 0.09em uppercase. **Micro-labels are transformed in the style layer, never
typed uppercase** — the accessibility label must read "Where it went", not "WHERE IT WENT".

Every two-column construct reflows to one column at the largest dynamic-type sizes. The fact-row
label column must **not** be a fixed width (the current 118pt cap truncates where reflow is needed).

## Screens

Each sheet documents its screens with a § reference back to `wireframes.md`, a colour-role note, and
captions explaining every non-obvious decision. Read the sheet alongside this list.

| Sheet | Screens | Notes for implementation |
|---|---|---|
| `Koi Palette` | — | Tokens + live AA validation of all 20 semantic pairs, both themes, plus colour-blind analysis. |
| `Koi Control Language` | — | Rows, 8 icon wells, 3 chip species, 4 button variants, toasts, the 3 layer species, stat table, gauge, confirmations, chart grammar. **Build these first**; every screen is assembled from them. |
| `Koi Shell` | tab bar, depth ladder, zero-car | 4 tabs + detached `+` + floating Settings. Route map included. |
| `Koi Garage` | Garage, car page ×2, car form | Two ownership shapes — `PLAN` and `OWNERSHIP` groups never both appear. |
| `Koi Home` | 4 states | Strict precedence; exactly one state renders. |
| `Koi Settings` | Settings, Sync, erase | §12.5 recovery-code entry is marked **PROPOSED / NOT BUILT**. |
| `Koi Capture` | chooser, fuel, entry, trip, odometer, saved moment | The app's only spring lives here. |
| `Koi Accent` | — | Why emphasis is ink; radius and FAB rationale. |
| `Koi History` | feed, swipe, 2 empties | The plan-charge row is what makes July reconcile. |
| `Koi Insights` | 4 lenses | Time is **pages**, not trailing windows. |
| `Koi Record Pages` | fuel ×2, trip, odometer, note, milestone | The computed panel and its basis line. |
| `Koi Reminders` | list, detail, vault ×2 | Two absence states, drawn together. |
| `Koi Onboarding` | 3 beats | All skippable. No account, ever, before the first fill. |
| `Koi Degraded States` | annex A | Every enumerated degraded state. None styled as an error. |
| `Koi Icons` | annex B | The well treatment and the glyph set. |
| `Koi Decisions` | sheet 14 | The decision sheet as it was put to the owner. Kept for the reasoning; **all 18 are now answered** — see §H of `decisions.md`. |
| `Koi Resolved States` | sheet 15 | The five answers that needed pixels: the missed-fill toggle, the `Other` row, the disputed-data line, the queued undo, ownership across a swap. |

## Interactions & behaviour

**Navigation (spec §D1).** Push to go, sheet to do, fit to pick — and **never more than one tall
sheet layer**. Max depth anywhere: `root → pushes → one task sheet → one fitted pick`.

- A pushed page **keeps the tab bar**; that is what distinguishes it from a sheet. It pops by path
  mutation only — never `dismiss()` inside a pushed page (it eventually rebinds to a sheet and kills
  Back).
- Each tab owns a stack; leaving resets the *stack* but **preserves screen state** (filter chips, car
  scope, lens, page size).
- A record page, and the reminder detail, are reachable from 3 and 2 tabs respectively — register
  them as **shared destinations** in each tab's stack, not as one route owned by one tab.
- Capture's chooser is a *fitted* sheet that **dismisses itself, then** opens the task sheet — a
  sequence, not a stack.
- A dirty form pins its sheet: swipe-to-close disabled, "Discard this fill? / Keep editing". The
  dirty guard **wins over a notification deep-link's modal teardown**.

**Motion (spec §D7).** 150 ms fades everywhere. **Exactly one spring in the whole app** — the
fuel-capture saved moment, which fires on every fuel capture, first or thousandth. It is for the
record landing, not the user's behaviour. Reduce-motion gets fades only.

**Never:** a streak, a badge, confetti, a progress ring for encouragement, a pulsing dot, a count-up
on a number, a chart on Home, an exclamation mark.

**Toasts.** One at a time, **app-level** (currently per-screen across three mounts — this is why a
car delete has to smuggle its message through a route param; build a real toast host). Success 3 s ·
undo 6 s behind a draining hairline · error persists. Undo and Retry are the only actions allowed.

**Targets.** ≥44 pt everywhere including ghost buttons. Rows are real buttons. Decorative glyphs
hidden from the screen reader. A chart exposes its **headline + sentence** as its accessible summary.

## State

```
scheme            'light' | 'dark'         — from OS, both authored
cars              live + archived, ordered most-recently-active first
scope             'all' | carId            — NOT RENDERED AT ALL when only one car exists
historyFilters    Set<kind>                — 'All' is a chip, mutually exclusive with the rest
insightsLens      'cost' | 'fuel' | 'distance' | 'ownership'
insightsPage      { size: 'month'|'year'|'all', anchor: Date }   — pages, never trailing windows
homeState         derived, strict precedence — see Koi Home §00
reviewQueue       open flags; blocks Home's 'All clear'
toast             one, app-level, with a queue of undo closures
```

**Derivation rules that must not be reimplemented per screen:** the odometer is **derived from the
trail, never stored**; economy measures full-tank → full-tank and refuses when the chain breaks;
projections carry `≈` and run from the **last reading**, not from today.

## Known contradictions with current `@koi/mobile`

1. **The car page renders a full readings list with an inline add form** — a second copy of the
   ledger. This exact defect was found and fixed once before; it has regressed. The car page shows
   **three** recent rows and a link to History. Nothing more.
2. **Car rows/cards are painted with the fuel green.** The photo is identity, never data; spending
   the app's one green on a car breaks the colour law.
3. **Fuel type is written as free text.** It is an enum, entered by chip.
4. **No Settings surface exists** (the word appears in `app/` only in comments).
5. **Swipeable rows and the sheet dirty guard are unimplemented** — both gesture libraries are
   installed and imported nowhere.
6. **The odometer validation error does not name the conflicting record.** It must, and offer to
   open it.

## The fixture — one reconciled ledger

Every number across all 14 sheets traces to this. Today is **28 July 2026**.

- **Golf GTI** · VW · 2019 · petrol · 1234-ABC · 50 L · 245 hp · **91.240 km** (read 12 Jul) ·
  Mapfre subscription 289,00 €/month · 1.500 km/mo cap with pooling, anchored to the 23rd ·
  insurance renews 16 Aug 2026 · ITV was due 16 Jul (12 days over)
- **Ibiza** · Seat · 2014 · 5678-DEF · 142.600 km · owned outright, bought 9.200,00 € · no plan ·
  tank and power **not on file** (deliberately — the fixture does not give them)
- **Ibiza 1.9 TDI** · archived 2020, records kept
- **July 2026, both cars: 487,90 € · 412 km · 72,54 L · 3 fills · 0,77 €/km**

Derived anchors: rate 412 ÷ 28 = **14,714 km/day** · odometer projection **≈92.388 km · 28 Sep**
(78 days past the 12 Jul reading) · oil reminder **93.000 km → ≈November**.

`decisions.md` carries the full ledger table and the derivation of every one of these. **Read it
before changing any number** — seven arithmetic contradictions were found and corrected during this
work, and each correction is recorded with its reasoning.

## Open questions — all closed

`wireframes.md` §16 listed 18 open owner questions. **All 18 are answered**, recorded in §H of
`decisions.md` with the reasoning for each. Two further contradictions surfaced while drawing and are
also decided. Nothing in this bundle is a recommendation awaiting a ruling — implement it as designed.

Three decisions carry implementation prerequisites worth planning for:

1. **#8 · the queued undo needs the app-level toast host.** Per-screen toasts cannot hold an undo
   queue across a navigation. Today a second delete inside six seconds *silently makes the first
   permanent* — a data-loss bug, not a copy problem. The fix separates the toast (a view) from the
   closure (state): toasts supersede visually, closures accumulate and each expires on its own 6 s.
2. **#15 · Ownership follows the plan's lineage, not the physical car.** This needs a plan-lineage
   model distinct from `carID`. On a subscription, "what does this car cost me?" means the
   arrangement, not the vehicle currently parked outside.
3. **#13 · `missedPrevious` needs a write path.** It shaped economy intervals but no user could set
   it. Now a switch under `Full tank`, worded as a fact — *A fill was missed before this one* — and
   rendered only when it can be true (not on a car's first fill, not when `fullTank` is off).

**N1 · the cap chip.** The Garage chip and the car page's gauge must use **one denominator**: when
pooling is active, both read the pooled budget (`268/1.760 km`). The bare cap survives only where it
is defined — the gauge's own line, *1.500 cap + 260 carried over from June*. An earlier draft synced
only the over/under *state* while leaving the chip's numbers bare; that manages the contradiction
instead of removing it, and was overridden.

## Assets

- **Icons:** Lucide, stroke-width 1.75. Use `lucide-react-native`.
- **Fonts:** IBM Plex Mono (SIL OFL) must be bundled. Display/text use the system font.
- **Photography:** none. Car photos are user-supplied; the empty state is a warm placeholder block,
  never a grey box. Images are downscaled and metadata-stripped at intake.

## Files

All `.dc.html` files are self-contained except for two shared references: `support.js` (the runtime
that renders them) and `_ds/industry-…/` (the documentation chrome). Both are included. Open any
sheet directly in a browser.

# Spec amendments — from the design pass (5 Aug 2026)

This file is the **authoritative amendment set** against `koi-core-spec.md` and `spec-delta.md` after
the visual-design pass. Both source documents predate it and still describe superseded rules, so
where they disagree with this file, **this file wins**.

Each entry names the section, what it said, what it says now, and why. Nothing here is a
recommendation awaiting a ruling — all were answered by the owner and are logged with reasoning in
`decisions.md` §H.

---

## A · Token corrections (§D3)

### A1 · `positive` was the fuel hue

```diff
- positive: '#43823B'          // === accent === domain.fuel
+ positive: '#1F6F63'          // light — a teal, 59° from fuel
+ positive: '#4FA795'          // dark
```

§D3 reserves semantic colours and forbids using them as "series 4", but `positive`,
`accent` and `domain.fuel` were the **same hex** — a positive state and fuel money were literally
one pixel. Teal keeps "one green in the app" true. `positive` is now also the held hue for a future
income surface (§16 #9), so it must not be spent elsewhere.

### A2 · `inkFaint` failed AA

```diff
- inkFaint: '#8C857A'          // 3,47:1 on paper — fails AA
+ inkFaint: '#787166'          // 4,59:1 on paper
```

§H4 names the exact surface this broke: dimmed archived rows over faint metas.

### A3 · Three token groups did not exist and are now required

```ts
domainWash  // the well fill — a tinted box, not a saturated block
domainText  // the only step a domain hue may carry type at
control     // primary/secondary/ghost surfaces — emphasis is INK, not accent
radius      // { field 8, button 8, well 10, card 15, sheet 26, fab 16, chip 999 }
```

Full values in the handoff README. `sheet` is added to the surface set because task sheets and
fitted pickers sit *over* a card-bearing parent; in light it equals `card`, in dark it must not.

### A4 · The dark scheme is authored, not derived

`palette.dark` is a full sibling of `palette.light` — a warm near-black ground (`#14120F`) in the
light paper's hue family, its own ink ramp, its own semantics. §D3 already forbade an inversion pass;
there was simply no dark half to point at. There is now.

---

## B · Rules amended by the drawing

### B1 · Emphasis is ink (§D3, new)

A primary action is the **darkest** object on the surface, not the greenest. The accent means *fuel
money* and nothing else. One deliberate exception: tinted interactive **type** — back links,
`Discard`, toast `Undo`, picker checkmarks, `What gets sent ›` — stays accent, because type reads as
tappable without competing for weight. This inverts correctly in dark, where ink *is* the near-white.

### B2 · Wells are washes (§D3, amended)

An icon well is `domainWash` + a thin-stroke `domainText` glyph at radius 10. **Never** a saturated
fill, never emoji. The saturated `domain` step is for bars, gauge fills and detail chrome — graphical
objects held to 3:1 — and is **forbidden from carrying type**.

### B3 · Plan charges are ledger rows (§16 #1, answered yes)

A plan's monthly charge renders in History as a non-editable `contract` row, filterable, counted in
the month whisper, opening a glance sheet rather than a swipe. Without it a month's whisper and its
Cost headline give **different answers to one question** with no copy to explain the gap.

### B4 · One cap denominator (§5.3, amended — was ambiguous)

When pooling is active, the Garage chip and the car page's gauge **both** use the pooled budget. The
bare cap survives only where it is *defined*: the gauge's own line, *1.500 cap + 260 carried over
from June*. §5.3 previously allowed the chip to show the bare cap, which lets two surfaces reach
opposite verdicts about the same car — `1.600/1.500` "over" beside `1.600/1.760` "under".

### B5 · `ALSO COMING` obeys its own bound (§2.2, corrected)

The band lists only reminders inside the 28-day floor — the same 28 days Home's state machine uses.
§2.2's frame drew items 2 and 8 months out inside it, which made *All clear*'s "next few weeks"
meaningless. When nothing else is inside 28 days the band does not render.

### B6 · Alert lines are future tense (§C1, corrected)

A featured reminder names **what will fire next** — *"Next alert 9 August, 7 days before."* — not its
whole 60/30/7 rule, whose earlier alerts may be in the past. The full rule lives on the reminder's
detail page, where an `Anchor` row makes it checkable, and that page states plainly when all alerts
have already fired.

### B7 · A third renewal outcome (§C8, added)

Insurance renewal offers **Renewed · Switched insurer · It lapsed**. With only the first two, a
driver whose cover lapsed could record it *only as a fake renewal* — corrupting the premium trend and
re-arming a reminder for a policy that no longer exists. A ledger must be able to record the bad
outcome.

### B8 · Ownership follows the plan's lineage (§16 #15, answered)

On a subscription, the Ownership lens scopes to the **plan**, not the physical car: title becomes
*Since {plan start}* with a car count, and a `THE PLAN'S CARS` group replaces the ownership facts.
Needs a plan-lineage model distinct from `carID`.

### B9 · `missedPrevious` gets a write path (§16 #13, answered)

A switch below `Full tank`, worded as a fact — *A fill was missed before this one* — stating its cost
the moment it is on. Rendered only when it can be true: hidden on a car's first fill and when
`fullTank` is off. Previously the flag shaped economy intervals with no way for a user to set it.

### B10 · Undo closures queue (§16 #8, answered)

The toast is a **view**; the undo closure is **state**. Toasts supersede one another visually while
closures accumulate, each expiring on its own 6 s. Copy collapses to *2 records deleted.* with one
Undo restoring both. Today a second delete inside six seconds *silently makes the first permanent* —
a data-loss bug. Requires the app-level toast host.

### B11 · Disputed data is disclosed on Insights (§16 #16, answered)

Any lens page containing a flagged reading carries one quiet **ink** line under the headline: *Some
readings in this period need a decision.* + `Review notes ›`. Not attention, not a badge on the bars,
not a suppressed chart — the figures are still the best available, so the line is a receipt. Ownership
is exempt (no period).

### B12 · `Other` caps the bar list (§16 #5, answered)

Cutoff at five named kinds; a sixth row aggregates the rest and carries its count — *Other · 2*. Its
bar is **hairline grey, not a domain hue** (mixed-kind money), and it sorts last regardless of size:
it is a container, not a category.

### B13 · The distance invariants (§16 #4, answered)

Home's month pulse takes the **strict** reading — never invents distance for a period that has not
finished. A completed Insights page takes the **bracketing** one. §C-level work remains: reconcile
inv.21 and inv.23 so this is a stated rule rather than a coincidence of two implementations.

---

## C · The data voice (§D3/§H4, amended)

The mono face must be **bundled** — IBM Plex Mono is the recommendation. `Menlo` is Apple-only and
falls back to a proportional face on Android, breaking the one promise the data voice exists to keep:
numbers never jitter. Android is a co-equal target.

**Never `toLocaleString('es-ES')` for a Koi figure.** Intl applies `minimumGroupingDigits: 2`, so
four-digit values silently lose their separator — `1148`, not `1.148`. Koi groups every four-digit
quantity.

**Micro-labels are transformed in the style layer**, never typed uppercase, or the screen reader has
nothing to strip.

---

## D · Corrections to the §0.6 fixture

The fixture did not reconcile. July 2026 was stated three different ways across the wireframes. The
authored ledger is now:

**487,90 € · 412 km · 72,54 L · 3 fills · 0,77 €/km** (both live cars, 1–28 Jul)

with the Golf's odometer at **91.240 km** on 12 Jul and a derived rate of **412 ÷ 28 = 14,714
km/day**. Downstream anchors: odometer projection **≈92.388 km · 28 Sep** (78 days past the *last
reading*, not past today), oil reminder **93.000 km → ≈November** (1.760 ÷ 14,714 = 120 days),
insurance renewing **16 Aug 2026** — so "in 19 days" on 28 Jul, and ITV **12 days over**.

Seven arithmetic contradictions were found and corrected; each is recorded with its derivation in
`decisions.md` §B. **Read that section before changing any number** — the figures are load-bearing
across sheets 05, 09, 10, 11 and 15.

---

## E · Contradictions in `@koi/mobile` this design corrects

1. The car page renders a full readings list with an inline add form — a second copy of the ledger.
   **This exact defect was found and fixed once before and has regressed.** Three recent rows and a
   link to History; nothing more.
2. Car rows are painted with the fuel green. The photo is identity, never data.
3. Fuel type is written as free text. It is an enum, entered by chip.
4. No Settings surface exists.
5. Swipeable rows and the sheet dirty guard are unimplemented; both gesture libraries are installed
   and imported nowhere.
6. The odometer validation error does not name the conflicting record. It must, and offer to open it.
7. `app.json` declares `userInterfaceStyle: automatic` while `_layout.tsx` pins
   `StatusBar style="dark"` — dark content on a dark ground.
8. `#F6EFE3` in `sync/provider.tsx` is off-palette. Delete it.

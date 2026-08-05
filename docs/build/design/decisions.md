# Koi — design batch 1 · decisions log

**Date** 2026-07-29 · **Covers** sheets 01–08 · **Fixture** wireframes §0.6, today 28 Jul 2026

Three kinds of entry, kept apart on purpose:

- **A — Open owner questions (§16).** Where a screen could not be drawn without an answer, I took
  **the wireframes' own stated recommendation**, drew that, and logged it here. No third options
  were invented. All eighteen stay open; nine of them now have a drawing attached.
- **B — Arithmetic corrections.** Places where the wireframes' numbers could not all be true at
  once. Stated, not smuggled.
- **C — Findings.** Things the drawing surfaced that no document says yet, and that need an owner
  call before the rebuild.

---

## A · Open questions (§16) — taken by recommendation, still open

| # | Question | What I drew | Sheet |
|---|---|---|---|
| 1 | Do plan charges become ledger rows in History? | **Not drawn either way.** Batch 1 has no History frame that would show one. The Insights Cost card counts the July charge in its `Plan` bar (289,00 €), which is what inv.13 requires; whether the same charge also appears as a row is untouched and still open. Flagged inline on sheet 03. | 03 |
| 3 | `By week` bucketing | **Day-of-month blocks** (1–7, 8–14, 15–21, 22–28, 29–end). Drawn in the chart-grammar pair and labelled as the recommendation. | 02 |
| 5 | Top-5 truncation in *Where it went* | Not reached — the fixture has four kinds, so no truncation occurs. The `Other (N kinds)` row in ink is the recommendation and remains undrawn. | — |
| 6 | `Erase everything` → `Erase this device` | **Shipped as recommended.** Both dialogs drawn, keyed on *has this device ever synced*, sync turned off first and said so. | 06 |
| 7 | The privacy card carries three states | **Shipped as recommended.** All three drawn, plus the always-true line that survives every switch. | 06 |
| 8 | Undo when two records are deleted quickly | **Queued closures**, collapsing copy `2 records deleted.` with one Undo. Noted on the sheet as a recommendation, not a settled call. | 02 |
| 9 | Income's hue collision | **Kept off the capture chooser** — five tiles, no income. The palette sheet notes that `positive` is now a teal nobody else uses, so an income surface could take it without disturbing the four; that is a cost estimate, not a decision. | 01, 07 |
| 10 | Default Insights page size | **Month**, landing on today's partial page, marked `· to date`. | 03 |
| 11 | Lens picker title | **No title.** Drawn as four bare rows. "Lens" never becomes user-facing vocabulary. | 02 |
| 12 | Garage ordering | **Most-recently-active first, archived always last.** Golf GTI above Ibiza. Logged as a taste call. | 04 |
| 13 | `missedPrevious` has no capture control | **Not drawn.** The recommended quiet toggle under `Full tank` would have been the sixth chip on the fuel sheet; I left the sheet at the wireframes' own element list and left this open. The *consequence* is drawn — the missed-previous row and the missed-previous saved-moment variant both exist. | 02, 07 |
| 14 | Trip start-km prefill on backdated trips | **Prefilled**, because the drawn trip starts 2 July with readings that predate it and the card is showing the healthy case. The recommendation (prefill only when the start date is today) is **not** contradicted by the frame — it is simply not the case being shown. Still open. | 07 |
| 17 | No sync badge anywhere in the shell | **Accepted and drawn as accepted** — the failure sentence lives on the Sync page and nowhere else. Called out on sheet 06 as a recorded consequence. | 06 |
| 18 | `Vault` → `Insurance & papers` | **Shipped as recommended.** The Care group's row reads *Insurance & papers*; "vault" appears only in this log. | 04 |

**Not reached by batch 1:** #2 (Fuel lens headline period), #4 (inv.21 vs inv.23), #15 (ownership
under a swap lineage), #16 (a flagged reading inside an Insights page). All four belong to the
Insights lenses, which are batch 2.

---

## B · Arithmetic corrections

Seven places where the wireframes' numbers could not all be true at once. Every one is drawn
corrected and stated on its sheet.

**1 · The cap gauge.** `1.240 / 1.760 km` on day 6 of a 31-day cycle is 207 km/day, which projects
to ≈6.400 km — not the `≈1.410` the card claims, and it contradicts Home's own July pulse of
412 km, since 23–28 July is a subset of July. **Corrected to 268 km** (44,7 km/day → ≈1.385).

**2 · "Insurance in 16 days".** From 28 July that is 13 August, but the reminder hero names
16 August. **Corrected to "in 19 days"** everywhere, with the policy's valid-until pinned to
16 Aug 2026.

**3 · Two insurance rows in the Care group.** §6.2's frame draws *Insurance* and *Documents*
separately; §10 then rules that two rows to one page is a nav smell. §10 is the later decision, so
the drawn Care group carries **one** row.

**4 · `ALSO COMING` reached outside its own bound.** §2.2 says the band lists what falls inside
28 days, then draws items 2 and 8 months out. **Taken: the stated rule.** The band renders only
when something else is inside 28 days, and does not render otherwise.

**5 · The featured reminder named alerts that had already fired.** On 28 July, with the renewal on
16 August, the 60- and 30-day alerts are in the past — printing all three implies three
notifications are coming. **Corrected to "Next alert 9 August, 7 days before."**

**6 · Last fill must lead with the car.** §2.7's conditional fires whenever a second car exists,
and the fixture has two. Every Home frame reads `Golf GTI · 12 July · Repsol Tarragona`.

**7 · July did not reconcile across three surfaces.** Home's pulse (318,60 €), History's July
whisper (318,60 €) and Insights' Cost headline (249,43 €) were three different answers to one
question — the exact bug class the time-pages work exists to kill. Resolved by authoring one July
ledger and patching every sheet to it.

### The authored July 2026 ledger — all live cars, 1–28 Jul

| Date | Record | Odometer | Amount |
|---|---|---|---|
| 28 Jun | Odometer · manual *(the anchor, outside July)* | 90.828 | — |
| 2 Jul | Fuel · Repsol Reus · full | 90.862 | 38,45 € |
| 2–4 Jul | Trip · Salou · 232 km | 90.862 → 91.094 | — |
| 8 Jul | Service · Oil & filter | 91.108 | 96,50 € |
| 12 Jul | Fuel · Repsol Tarragona · full · 26,10 L | 91.240 | 35,75 € |
| 23 Jul | Plan charge · Mapfre | — | 289,00 € |
| 24 Jul | Fuel · Cepsa Salou · no odometer | — | 24,00 € |
| 26 Jul | Expense · Parking | — | 4,20 € |

Every derived number on every sheet comes from this table:

- **Monotonic:** 90.828 ≤ 90.862 ≤ 91.094 ≤ 91.108 ≤ 91.240 ✓
- **July distance** = 91.240 − 90.828 = **412 km** (newest reading inside July, minus the last
  reading at or before its start — Home's own km rule)
- **July money** = 38,45 + 96,50 + 35,75 + 289,00 + 24,00 + 4,20 = **487,90 €**
- **€/km** = 487,90 ÷ 412 = 1,1842 → **1,18 €/km**
- **Cost lens bars** = Plan 289,00 + Fuel 98,20 + Services 96,50 + Expenses 4,20 = **487,90 €**,
  identical to the headline, to Home's pulse, and to History's whisper
- **Fuel** = 3 fills, 98,20 €, of which **2 are measured** (the 24 July fill has no odometer)
- **The 12 July fill's economy** = 26,10 L over 378 km (91.240 − 90.862, full→full) =
  **6,9 L/100km**; €/L = 35,75 ÷ 26,10 = 1,3697 → displayed **1,370**
- **Distance pace** = 412 ÷ 28 tracked days = **14,7 km/day**

**One number that looks wrong and is not.** The fuel sheet's odometer well says
`+132 km since the last reading` while the same fill measures economy over **378 km**. Both are
right: the well's delta is *since the last reading of any kind* (the 8 July service at 91.108); the
economy interval is *since the last full tank* (the 2 July fill at 90.862). A well that reported
the economy interval would be lying about how far the car has gone since it was last looked at.

---


### July fuel — the one anchor every figure derives from

The 2 July Repsol Reus fill is the only free variable in July's fuel numbers, and it is pinned
twice in the drawn sheets — `7,2 L/100km` over `402 km` (History §3.1, and Insights' own record
list). Litres are a pump value with two decimals, so the anchor is **28,94 L** exactly
(28,94 ÷ 402 × 100 = 7,199 → 7,2). Everything else is derived, never back-solved from a price:

| Figure | Derivation | Value |
|---|---|---|
| 2 Jul litres | 7,2 ÷ 100 × 402, to pump precision | 28,94 L |
| 2 Jul price | 38,45 ÷ 28,94 | 1,329 €/L (cheapest) |
| July litres | 28,94 + 26,10 + 17,50 | 72,54 L |
| July average price | 98,20 ÷ 72,54 | 1,354 €/L |
| Per fill | 72,54 ÷ 3 · 98,20 ÷ 3 | 24,18 L · 32,73 € |
| Headline economy | (28,94 + 26,10) ÷ (402 + 378) × 100 | 7,1 L/100km |

**All three July fills recorded litres, so all three are in the litres total.** What the 24 July
Cepsa fill lacks is an *odometer* — that costs the economy interval, not the litres. Litres bought
in July belong to July; only the measurement defers. `Measured fills 2 of 3` is about odometers
and is correct as drawn. This distinction cost three verifier rounds: conflating "no odometer"
with "no litres" silently dropped 17,50 L from the total.


### The odometer projection — derived, never typed

Three sheets draw the same July Odometer card, and all three had drifted apart because the
projection was written as prose with a hand-typed day count. It has exactly two inputs, both
already stated on the card:

- **last reading** 91.240 km on 12 Jul (not *today* — a projection runs from the last real datum)
- **rate** 412 ÷ 28 = 14,714 km/day

The horizon is **two months past today** (28 Jul → 28 Sep), which is 78 days past the 12 July
reading — not 62, which is the today-to-horizon span and the error that produced three
disagreeing numbers in one sentence. So: 91.240 + (14,714 × 78) = **≈92.388 km · 28 Sep**,
consistent in `Koi Insights` and `Koi Control Language`.

The row is labelled **Anchor reading**, never "First reading" — the label is what makes the
delta checkable, and Control Language §08 already required it.


### The oil reminder's target — derived so "≈November" is true

The distance-based reminder exists to prove Koi predicts honestly, so its own numbers have to
survive the check. At the Golf's rate of 412 ÷ 28 = 14,714 km/day from its 12 July reading of
91.240 km, a **95.000 km** target lands 256 days out — **24 March 2027**, not November, and it
would have sorted *after* the Ibiza's 22 Mar 2027 ITV.

Retargeted to **93.000 km**: 1.760 km ÷ 14,714 = 120 days from 12 July = **9 November 2026**.
"≈November" is now literally what the sheet's own rate produces, and the LATER group's order
stands. A round service target either way.

The row is always phrased in *time*, never as frozen remaining-km: `3.760 km to go` is true and
useless; *around November* is what a person plans around — and the ≈ says the date moves when
the pace does.

## C · Findings that need an owner call

**1 · The cap chip and the cap gauge can disagree about over/under.** §5.3 makes the chip read the
**bare** cap (`268/1.500 km`) and the gauge the **pooled** budget (`268/1.760 km`) — deliberate,
and fine while both are under. At 1.600 km the chip would say "100 km over" while the gauge says
under budget, which is the disagreement §C4 forbids. **Drawn resolution:** the chip's over/under
*state* follows the pooled budget, and when it flips it names the *pooled* overage. §5.3's text is
ambiguous and this resolves it one way — it needs your yes.

**2 · `positive` was the fuel hue.** `theme.ts:27` makes them the same `#43823B`, so a positive
state and fuel money are literally the same pixel, against §D3's reservation of semantic colours.
**Changed to a teal `#1F6F63`** — 59° away, and deliberately not a green, so "one green in the
app" survives.

**3 · `inkFaint #8C857A` fails AA** on the light paper (3,47:1) in the role §H4 flags as worst —
dimmed archived rows over faint metas. **Changed to `#787166`** (4,59:1). Both ratios are quoted
against the paper ground `#FBF9F5`, which is where metas actually sit; against the card they are
3,65:1 and 4,82:1, and the fix holds either way. Sheet 01 computes every ratio live from the
hexes — these two are the only hardcoded numbers in the batch, so treat the sheet as the source
of truth if they ever disagree again.

**4 · `attention` sits 11° from `service`.** Both light hexes are locked, so I left them and
separated the *dark* pair by value instead. What actually carries the pair everywhere is shape:
§D4's worst mark is a hollow dot against a filled one.

**5 · Menlo cannot be the data voice.** It is Apple-only; on Android it falls back to the
proportional default and the one promise the voice exists to keep — numbers never jitter — breaks
silently on the platform the project calls co-equal. **Recommendation: IBM Plex Mono, bundled.**
Sheets 02–08 are set in it, so you are reading the proposal rather than a description of it.

**6 · A third surface token, `sheet`.** Task sheets and fitted picks sit *over* a card-bearing
parent. In light it can equal `card`; in dark it must not, or the layer disappears. Added to the
token set.

**7 · The car page's "recent" list has been reintroduced as a full ledger.** `car/[id].tsx`
renders every reading with an inline add form — a shipped-and-fixed defect (Tester R's *duplicated
history inside car sheet*), whose 2.0 fix **was** the one-ledger rule. Sheet 04 draws exactly three
rows and `Full history ›`.

**8 · Two more code contradictions the palette sheet unblocks.** `app.json` declares
`userInterfaceStyle: automatic` while `_layout.tsx` pins `StatusBar style="dark"` — dark content
on a dark ground. And `#F6EFE3` in `sync/provider.tsx` is off-palette and should just go.

---

## D · What batch 1 deliberately did not draw

History · Insights' four lenses · record pages · reminders · the review queue's two pages · the
vault · onboarding · import. All of §17's second half, unchanged and unprejudiced by this batch.

Charts are drawn in their **stat-table-first** form per your call, with the target mark grammar
paired beside each so the staging is visible and gaining marks later is not an IA change.


---

## G · Accent, controls and shape (batch 1b · 2026-08-03)

Owner approved all recommendations on `Koi Accent.dc.html` (sheet 08).

### G1 · Route 3 — the accent stops being the button colour

§D3 fixes `accent === domain.fuel` — one green in the app. Batch 1 also used that green
for every primary button, FAB, back link and ✓, so one pixel meant both *fuel money* and
*press this*; because a button is a solid block, "press this" won.

**Rule after:** emphasis is ink; the accent means fuel. One deliberate exception —
tinted interactive *type* (back links, `Discard`, toast `Undo`/`Retry`,
`What gets sent ›`, picker ✓) stays accent, because it reads as tappable without
competing for weight.

No spec amendment needed: this is a reading of §D3, not a change to it. No hex moved.

**Free win:** the primary button went from 4,10:1 (paper on `#43823B`) to 15,29:1
(paper on ink) — the most-pressed control in the app, adequate → AAA.

### G2 · Shape — 8px, and why

Not taste. Square fights native iOS sheets, keyboards and nav bars — the platform's own
controls are round-rects, so a square button beside a system sheet reads as unstyled.
11px is a consumer app that wants to feel friendly; this product is a quiet ledger.
**8px on a 44px button gives the same corner-to-size ratio as the 10px well on a 40px
box,** so buttons and icon wells became one family. The Industry chrome documenting these
sheets stays square-cornered — chrome and product are allowed to disagree.

### G3 · FAB — ink squircle, 52px, neutral shadow

Ink because `+` creates *any* record; a green FAB promises a fuel fill and opens a
six-tile chooser, five tiles of which are not fuel. 52px because 58 was sized to compete
with a coloured shadow it no longer has. Neutral shadow because a coloured one is a glow
and §D7 has none. Rejected: outlined (illegible over a dense ledger — exactly when it is
needed) and 46px (meets the 44pt floor with nothing spare).

### G4 · Knock-ons — five rulings

| Element | Ruling | Why |
| --- | --- | --- |
| Option chips (`Petrol`, `Full tank`) | **→ ink** | The only place accent filled a shape for a non-fuel reason — and on the *fuel* sheet it put a green `Petrol` chip beside a green fuel well meaning two different things. Selected is now ink hairline + a real check glyph. |
| Selected radio ring | **→ ink** | Same species as a selected chip. |
| Filled keypad fields | **→ ink hairline** | Green wash there meant "you typed this" while green also meant fuel and commit. |
| Picker ✓ · back links · toast actions | **stay accent** | Tinted type or a bare glyph on a hairline row — the platform's own "tappable" signal, no visual weight. |
| Filter chips | **already ink** | Were ink-filled from the start; they are the model the option chips now follow. |

### G5 · New token groups on sheet 01

`domainWash` (4 hues + ink + attention, both themes) — wells and selected chips share it.
A well is `domainWash` + `domainText`; the base domain hue is for **bars and gauges only**.
Plus `control` (primary/secondary/ghost/chip/focus, both themes), `radius` (8 named roles,
replacing eight unrelated ad-hoc values), and `fab`.

### G6 · Latent bug found and fixed during the roll-through

**54 icon wells were rendering an invisible glyph** — the tinted-well conversion changed
each well's background to a pale wash but left `color: #FBF9F5` on the glyph, i.e. paper
on paper. Every well is now `domainWash` + its matching `domainText`. Worth noting because
it was invisible in exactly the way that survives review: the icon was *there*, sized and
positioned correctly, and simply could not be seen.

### G7 · What the roll-through deliberately did NOT recolour

Fuel bars in charts, the best-fill fuel dots (`#43823B` filled vs `#9C5A16` hollow — the
shape carries the pair, per §D4), the Koi brand mark, the focus ring, and the `BEFORE`
comparison panels on sheets 01 and 08.


---

## H · The owner's answers (4 Aug 2026) — all eighteen now closed

**§01 · yes to all five drawn, load-bearing calls.** #1 plan charges are ledger rows · #2 the Fuel
headline is the page-scoped mean with inv.4's window beside it as "your usual" · #3 by-week is
day-of-month blocks · #12 garage is most-recently-active first · #14 trip start-km prefills.
Nothing is redrawn; sheets 09–11 stand as built.

**§02 · recommendations accepted on all six undrawn.**

| # | Answer |
|---|---|
| 4 | Home's pulse takes the strict reading (never invents distance for an unfinished period); completed Insights pages take the bracketing one. Reconcile inv.21/inv.23 in the spec so this is a rule, not a coincidence. **No frame needed — already how sheets 05 and 10 behave.** |
| 5 | `Other (N kinds)` row, ink, always last, cutoff at five. **Drawn, sheet 15.** |
| 8 | Undo closures queue; copy collapses to `2 records deleted.` with one Undo restoring both. **Drawn, sheet 15.** |
| 9 | Income stays off the capture chooser. `positive` (#1F6F63 / #4FA795) is reserved for it — a teal no other surface uses — so an income feature can take it later without disturbing the four domain hues. **No frame; the hue is now costed and held.** |
| 13 | A quiet toggle under `Full tank`, worded as a fact: *A fill was missed before this one*. **Drawn, sheet 15.** |
| 15 | Ownership follows the **plan's lineage**, not the physical car. **Drawn, sheet 15.** |

**§03 · decided on the owner's instruction.**

**N1 · the cap chip.** I did *not* ratify my own sketch. The version on sheet 04 kept the chip on the
bare cap and synced only its over/under *state* — which manages the contradiction instead of removing
it, and still shows a user `1.600/1.500` while calling it fine. **Decided instead: when pooling is
active, both surfaces use the pooled budget.** The chip reads `1.600/1.760 km`. One denominator, one
verdict, no reconciliation logic to get wrong. The bare cap survives only where it is *defined* — the
gauge's own line, `1.500 cap + 260 carried over from June`. Simpler than what I proposed, and it
kills the bug class rather than policing it.

**#16 · a flagged reading inside an Insights page.** One quiet ink line beneath the headline:
*Some readings in this period need a decision.* + `Review notes ›`. Not attention, not a badge on the
bars, not a suppressed chart — the figures are still the best available, so the line is a receipt,
not a warning. **Drawn, sheet 15.**

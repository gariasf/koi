# Wireframes — the app surface

**Build Session 7 (2026-07-28). Status: DESIGN. Nothing here is built.**

This is the wireframe pass BOARD bucket D asks for before more screen code gets written:
ASCII/block screens translating `koi-core-spec.md` §C (functional requirements by surface)
and §D (the UX pattern language) into concrete layouts, so layout and
information-architecture problems get caught on paper while they are still cheap.

Reads with: `koi-core-spec.md` §C + §D (product truth — never edited),
`docs/build/spec-delta.md` (every amendment the build has already made to §C),
`docs/build/BOARD.md` bucket D.

Three things this pass had to **resolve**, not just draw — §14 carries the decisions and
their reasoning; the wireframes already assume them:

| # | Question | Resolution |
|---|---|---|
| R1 | Where does the S-4 review queue live? (invented in Session 4, absent from §C) | It joins **Home's state selection**: `Needs you` fires on an overdue reminder **or** an open review item. Second, always-present door in Settings. §14.1 |
| R2 | Where do sync + account settings live? (Sessions 5–6 put them on the garage screen as an admitted stand-in) | §C8's **Settings sheet**, under a pushed **`Sync`** page. Privacy *card* copy stated for all three sync states — including the paused state a real user reaches every time they turn sync off; the release-gated privacy *page* untouched. §14.2 |
| R3 | Dark mode (§D3 co-primary, unbuilt) | Wireframes carry **color roles**, not palettes; the authored dark palette is **its own follow-up board item**, owed before the app surface ships. §14.3 |

§15 is the required comparison against what `@koi/mobile` already has — keep / rework /
scaffolding, file by file.

---

## 0 · How to read these

### 0.1 The frame

Every screen is a 40-column phone frame. `┌ ┐ └ ┘ │ ─ ├ ┤` are the device edge; a
`├────┤` mid-rule is a real on-screen divider only where it is labelled as one.
Frames are structure and hierarchy — never pixels, never final type sizes.

Two frames are drawn side by side where two states are best compared directly (the never-synced
and syncing sync states, the never-synced and has-ever-synced erase confirmations, the two fitted
pickers) — a third state is drawn separately, below the pair, wherever one exists. Sheets and
fitted pickers are drawn
indented and narrower, to show the parent still being there behind them. Some **pushed-page**
frames stop before the tab bar to save vertical room — the tab bar is always present on a pushed
page (§D1), and its absence in a frame never means anything.

```
┌──────────────────────────────────────────┐
│ Home                              (set)  │  ← nav row: large title + floating Settings
│                                          │
│ ─ body ─                                 │
│                                          │
│                                    (+)   │  ← detached capture button, floats over body
├──────────────────────────────────────────┤
│   ▪ Home    History   Insights   Garage  │  ← tab bar, active tab marked ▪
└──────────────────────────────────────────┘
```

### 0.2 Glyphs

| Glyph | Means |
|---|---|
| `▓` | icon well — a record's domain-coloured square with its type glyph (§C2) |
| `█` `░` | chart bar · **ghost bar** (faint, "there's more history this way", §D4) |
| `●` `○` | best value (filled dot) · worst value (hollow attention dot), §D4 |
| `·` | the product's own separator, as the spec writes it: `6,9 L/100km · 378 km` |
| `›` | pushes a page (`All ›`, `Full history ›`) |
| `…›` | opens a **task sheet** (`Swap window opens 12 September …›`) — distinct from a bare `›`, so a row that opens a sheet is never mistaken for one that pushes a page (§D1's push/sheet distinction, made drawable) |
| `▾` | opens a **fitted** picker (`Cost ▾`, the period label) |
| `‹` `›` | pager chevrons, one page per tap (§D2) |
| `≈` | estimate or projection — never decoration, always load-bearing (§D5) |
| `✓` | the saved-moment check (§C5) |
| `[ Label ]` | button · `[[ Label ]]` = the one accent-filled primary on that surface |
| `( pill )` | capsule chip — `(( pill ))` = selected (ink-filled for filters, accent-washed for options, §D7) |
| `(+)` `(set)` | the detached capture button · the floating Settings button |
| `⟨ … ⟩` | **conditional**: this block renders only under the stated condition |
| `»` | an interaction or behaviour note, always outside the frame |
| `{role}` | colour ROLE, not a colour — see 0.3 |

### 0.3 Colour roles (§D3), not palettes

> Colour answers "what kind of money." Ink is everything else. Red stays earned.

| Role | Worn by |
|---|---|
| `{fuel}` | fuel records + every fuel chart — the app accent green, one green in the app |
| `{service}` | service records + service bars (amber) |
| `{expense}` | expense records + expense bars (blue) |
| `{contract}` | insurance + plans (plum) |
| `{ink}` | everything that is not "what kind of money": distance, odometer, notes, milestones, **and mixed-kind money totals** (a monthly total is a total, not a category) |
| `{attention}` | over-cap, overdue, the worst-value dot, an open review item |
| `{critical}` | destructive actions and hard errors **only** |
| `{positive}` | reserved; never used as "series 4" |
| `{paper}` | warm off-white surface / warm near-black in dark |

Two rules the wireframes enforce everywhere: **a degraded or missing-data state is never
red** (§D5/§D7 — missing data is not an error), and **car accent colours are identity
only** (photos, decoration), never data.

### 0.4 State notation

Each surface lists its states as `STATE — trigger`. A frame is drawn for every state that
changes the layout, not merely the numbers. Every empty state teaches; no empty state
apologises (§D6).

### 0.5 What a wireframe deliberately does not decide

Type scale, exact spacing, corner radii, icon drawings, the two palettes' hex values,
motion curves beyond §D7's law (150 ms fades; exactly one spring, at capture success), and
chart rendering. Charts are drawn as their **grammar** — headline, sentence, mark
positions, labels — because §D4 says the headline and sentence come first and a chart that
cannot earn them becomes a stat table instead. The chart libraries are chosen on paper and
deliberately **not installed**; §5.7 marks which cards can ship as stat tables first.

### 0.6 The drawn garage, and how far to trust the numbers

One small fixture runs through the frames, so the screens can be read against each other:

- **Golf GTI** — VW, 2019, petrol, 50 L tank, plate 1234-ABC, on a **Mapfre subscription**
  (289,00 € a month, insurance and maintenance included, 1.500 km/month pooling cap anchored to
  the 23rd, so the cycle containing today — 28 July 2026 — is **23 Jul – 22 Aug**), current
  odometer 91.240 km, tracking began March 2025.
- **Ibiza** — Seat, 2014, **owned outright**, purchase price 9.200,00 €, current odometer
  142.600 km, tracking began March 2022.
- Plus one **archived** car, so the archived affordances have something to show.
- **Today, throughout the fixture, is 28 July 2026.**

**Numbers always reconcile inside one screen** — bars sum to their headline, a rate divides by
the window it claims, a per-fill average matches its litres and money. **Across screens they
reconcile only where a section is explicitly about two surfaces agreeing** (History's June
whisper and the Cost lens's June total are one such pair, on purpose — see §16 #1). Everywhere
else, treat a figure as an illustration of a format, not as a fact about the fixture.

All amounts, distances and dates are **es-ES** by design: `1.234,56 €`, `43.465 km`,
`6,9 L/100km`, `1,625 €/L` (§H3 — the primary human persona is Catalan, and es-ES formats are
the design default).

---

## 1 · The shell (§C, §D1)

> **Push to go, sheet to do, fit to pick — and never two tall layers.**

### 1.1 Four tabs, one detached +, one floating Settings

```
┌──────────────────────────────────────────┐
│ Insights                          (set)  │
│                                          │
│ Cost ▾                        ( Both ▾ ) │
│ ‹    July 2026 · to date ▾           ›   │
│                                          │
│  249,43 €                                │
│  Services is your biggest cost.          │
│                                          │
│  ...cards ride the page carousel...      │
│                                          │
│                                    (+)   │
├──────────────────────────────────────────┤
│   Home     History   ▪Insights   Garage  │
└──────────────────────────────────────────┘
```

- **Four tabs, never five.** `+` is not a tab: it is a detached button floating above the
  bar, present on every root, and it opens the capture chooser as a sheet (§C5). It is
  detached because creating is not a place you go — `+` creates, pencil edits, trash
  deletes, one icon per record type used identically everywhere (§D1).
- **`(set)` is a floating Settings button, top-right on every root** (§C), opening the
  Settings sheet (§12).
- **Each tab owns a stack.** Back always means back; the tab bar never disappears under a
  pushed page. Leaving a tab resets that tab's stack (§D1) — coming back to History lands
  on History, not on a record page from last Tuesday.
- **Places push. Tasks float, once. Pickers fit.** Maximum depth anywhere:
  `root → pushes → one task sheet → one fitted pick`. A sheet never presents a second tall
  surface; it continues by inline swap (the car form's ownership rows) or by pushing on its
  own internal stack (Settings does this).

### 1.2 The depth ladder, drawn

```
 root (tab)          push               task sheet         fitted pick
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│ History  │  ──►  │ ‹ Back   │  ──►  │  Fill-up │  ──►  │ Which    │
│ ▓ fill   │  tap  │  Fuel    │ pencil│  keypad  │  car? │  car?    │
│ ▓ fill   │  row  │  Computed│       │          │       │ ( A )( B)│
└──────────┘       └──────────┘       └──────────┘       └──────────┘
   tab bar            tab bar            no tab bar         parent visible
   visible            visible            (one tall layer)   underneath
```

» A pushed page never dismisses itself; it pops by path mutation only (Appendix 1's
hard-won bug: `dismiss()` inside a pushed page eventually rebinds to a sheet and kills
Back).
» A dirty form **pins its sheet** and asks: "Discard this fill? / Keep editing" (§C5).
» A notification tap tears down modals, lands on **Home**, then pushes the target page —
so Back from a deep-linked reminder goes to Home, never to nowhere (§D1, §C7).

### 1.3 Route map this implies

Current `@koi/mobile` is a flat `Stack` (`app/_layout.tsx`) with the garage at `app/index.tsx`.
The four-tab shell needs:

```
app/
  _layout.tsx                  Stack: (tabs) + the task sheets, presentation:'modal'
  (tabs)/
    _layout.tsx                Tabs: home · history · insights · garage
    home/index.tsx             §2
    history/index.tsx          §3
    insights/index.tsx         §4-5 (lens + page state lives here, not in the route)
    garage/index.tsx           §6.1
    garage/car/[id].tsx        §6.2   (pushed inside the Garage tab)
    garage/car/[id]/vault.tsx  §10    (pushed inside the Garage tab, off the car page)
    home/review/index.tsx      §2.8   (pushed inside the Home tab — R1)
    home/review/[id].tsx       §2.9
    home/reminders/index.tsx   §9.1   (pushed inside the Home tab, off "All ›")
    home/reminders/[id].tsx    §9.3   (also reachable from the car page's Care group)
    record/[kind]/[id].tsx     §8     — reachable from three tabs, see note
  capture/                     sheets: chooser · fuel · entry · trip · odometer
  car-form.tsx                 sheet
  reminder-form.tsx            sheet
  settings.tsx                 sheet with its OWN internal stack (§12)
  selftest.tsx                 stays where it is; dev-only, gated by EXPO_PUBLIC_KOI_SELFTEST
```

**The one real routing problem, named:** a record page is reachable from History, from a
Cost-lens record row, and from Home's Last-fill card. Under per-tab stacks it must push
**inside the tab you were in** (Back returns you to where you were, §D1) — so the record
page is one *destination* registered in every tab's stack, not one *route* owned by a tab.
Recommendation: one shared destination component, mounted per tab group (Appendix 1's "one
shared destination table, typed path arrays per tab"). Do not solve this by making records a
fifth tab or a modal.

**Two more destinations need the same treatment, named because §D1 lists them among the
surfaces that push and the map above had left them out:** the vault (§10) and the reminder
detail (§9.3) are both reachable from more than one place — the vault only from the Garage
tab's car page, so it is a normal single-tab push; the reminder detail from **both** Home's
`All ›` and the car page's `CARE` group (in Garage), so it needs the same shared-destination
treatment as the record page, not a route owned by either tab.

### 1.4 Zero cars — every tab converges

```
┌──────────────────────────────────────────┐
│ Home                              (set)  │
│                                          │
│                                          │
│              [ koi mark ]                │
│                                          │
│         Add your car to begin.           │
│                                          │
│            [[ Add a car ]]               │
│                                          │
│ ⟨ ▪ Review notes · 2                 › ⟩ │
│                                          │
│                                    (+)   │
├──────────────────────────────────────────┤
│   ▪ Home    History   Insights   Garage  │
└──────────────────────────────────────────┘
```

» Identical body on all four tabs (§C8), **with one exception**: Home keeps a quiet
`Review notes` row when the queue is non-empty, even with zero cars (D-057, §14.1 #7) — a
flag can outlive the car it was about, so "no cars" and "nothing to review" are independent
facts and the screen must not conflate them. History, Insights and Garage carry no such
exception; their empty bodies are identical.
» `(+)` stays on screen but its chooser is car-gated: tapping it with zero cars opens the
car form, not the fill-up keypad (**new** — §C is silent; the alternative, a disabled `+`,
is a dead control, and §D6 does not scold).

---

## 2 · Home (§C1) — "does anything need me?"

Article 2 is constitutional: **Home answers the question in three seconds, is never a
dashboard, and never grows charts.** Home has no time control at all — the month pulse is
this calendar month, full stop.

Shape: **exactly one of three states, then one card.**

### 2.1 State precedence (R1 folded in)

| Order | State | Trigger | Hero |
|---|---|---|---|
| 1 | `Needs you` | any reminder overdue | the overdue reminder ⟨+ decision card beneath, if flags are open⟩ |
| 2 | `Needs you` | no reminder overdue **and** ≥1 open review item | the **decision card** |
| 3 | `Coming up` | a reminder is due **within 28 days**, nothing overdue, no open flags | the featured next reminder |
| 4 | `All clear` | nothing overdue, nothing due within 28 days, **and zero open flags** | the brand mark |

**The 28-day floor is fixed, not derived from the user's alert configuration.** §9.1 gives the
reminders *list* its own Upcoming/Later split, keyed to each reminder's own alert window — but
a reminder with only a 1-day alert selected (legal, §9.2) would then sit in the list's `Later`
right up until the day before it is due, and a boundary borrowed from that split would let
`All clear` print "All quiet for the next few weeks" the day before an ITV. Home's own promise
needs its own floor, independent of what alerts the user happened to pick.

Why the review queue joins the state machine instead of getting a permanent row: with a
permanent row Home grows a fifth thing that is *usually* empty, which is exactly how a calm
surface becomes a dashboard. With it in the state machine, the calm owner who never has a
conflict never sees it, and — the part that matters — `All clear` cannot say
"Everything OK" while two devices disagree in a drawer. See §14.1.

Why the reminder outranks the flag when both are live: an overdue ITV has a date in the real
world; a data disagreement has none. It waits.

» **Resolving the last flag while Home is on screen** re-evaluates the state live (both
counts are reactive queries today). No animation beyond the §D7 150 ms fade — Home must not
perform relief.

### 2.2 `Needs you` — overdue reminder (+ open flags)

```
┌──────────────────────────────────────────┐
│ Home                              (set)  │
│                                          │
│  NEEDS YOU                               │
│  ┌────────────────────────────────────┐  │
│  │ ▓ ITV               (12 days over) │  │
│  │   Inspection · Golf GTI            │  │
│  │   Was due 16 July 2026             │  │
│  │                                    │  │
│  │   [ Mark done ]      [ Snooze +7 ] │  │
│  └────────────────────────────────────┘  │
│                                          │
│ ⟨ ▓ 2 things need a decision         › ⟩ │
│ ⟨   Nothing is fixed silently.         ⟩ │
│                                          │
│  ALSO COMING                             │
│  ▓ Insurance renewal      in 16 days  ›  │
│  ▓ Oil & filter           in 2 months ›  │
│                              ( All › )   │
│                                          │
│  ─────────────  JULY  ─────────────      │
│   412 km      318,60 €      0,77 €/km    │
│                                          │
│  LAST FILL                               │
│  ▓ 6,9 L/100km · 378 km      35,75 €  ›  │
│    12 July · Repsol Tarragona            │
│                                          │
│                                    (+)   │
├──────────────────────────────────────────┤
│   ▪ Home    History   Insights   Garage  │
└──────────────────────────────────────────┘
```

Anatomy:
- **Days-over capsule** `(12 days over)` wears `{attention}` — never `{critical}`. Being
  late is a fact, not an error (§D5/§D6).
- Hero icon well wears the reminder kind's domain hue: inspection/service `{service}`,
  insurance `{contract}`, mileage cap `{ink}` (distance is not money).
- `Mark done` and `Snooze +7` are **both undoable via toast** (§C1). Marking a *recurring*
  reminder done gives the same "next occurrence created" toast as everywhere else (§C1,
  inv.32) — one toast at a time, 6 s with a draining hairline because it carries Undo (§D7).
- The decision card is the **conditional** band, drawn `⟨ ⟩` above. One row, states its
  count, pushes the review queue. It never carries an action inline: a decision is not a
  swipe.
- `ALSO COMING` lists the rest of what falls inside the 28-day floor, `( All › )` pushes the
  full reminder list (§C7). Named differently from the reminders list's own `Later` band
  (§9.1) deliberately — the two use different boundaries (Home's fixed 28 days vs. the list's
  per-reminder alert window), so the same word on both surfaces would make a reminder change
  meaning by changing tabs.
- **Month pulse** is one strip, three numbers, no chart, ever (§2.6).
- **Last fill** card is the one card that always follows the state block (§2.7).

» Toast copy, marking a recurring reminder done: "Done. Next one created for 16 July 2027."
(**new**, in §C7's voice — the spec states the behaviour and that the toast exists, not its
string.)

### 2.3 `Needs you` — flags only, no overdue reminder

```
┌──────────────────────────────────────────┐
│ Home                              (set)  │
│                                          │
│  NEEDS YOU                               │
│  ┌────────────────────────────────────┐  │
│  │ ▓ 2 things need a decision         │  │
│  │                                    │  │
│  │   Two devices changed the same     │  │
│  │   reading, and one other note.     │  │
│  │   Nothing is fixed silently.       │  │
│  │                                    │  │
│  │   [[ Review ]]                     │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ALSO COMING                             │
│  ▓ Insurance renewal      in 16 days  ›  │
│                              ( All › )   │
│                                          │
│  ─────────────  JULY  ─────────────      │
│   412 km      318,60 €      0,77 €/km    │
│                                          │
│  LAST FILL                               │
│  ▓ 6,9 L/100km · 378 km      35,75 €  ›  │
│    12 July · Repsol Tarragona            │
│                                          │
│                                    (+)   │
├──────────────────────────────────────────┤
│   ▪ Home    History   Insights   Garage  │
└──────────────────────────────────────────┘
```

- Icon well `{attention}`. **No** `Snooze`, **no** `Mark done`: a flag is not a reminder and
  cannot be deferred to a date. The only honest action is to go look.
- **Count = 1** collapses to that item's own sentence, which is more use than a count:
  ```
  │ ▓ Two devices changed the same field │
  │   Golf GTI · odometer reading        │
  │   Nothing is fixed silently.         │
  │   [[ Review ]]                       │
  ```
  (Titles come from the existing `reviewKind()` table — `src/review/kinds.ts` already names
  all 9 sync kinds + 7 domain kinds; §15 keeps it.)
- Upcoming reminders still show, in `ALSO COMING`. Home does not hide the calendar because a
  conflict exists.

### 2.4 `Coming up`

```
┌──────────────────────────────────────────┐
│ Home                              (set)  │
│                                          │
│  COMING UP                               │
│  ┌────────────────────────────────────┐  │
│  │ ▓ Insurance renewal                │  │
│  │   Mapfre · Golf GTI                │  │
│  │   16 August 2026                   │  │
│  │                                    │  │
│  │   Alerts 30, 7 and 1 day before.   │  │
│  └────────────────────────────────────┘  │
│                              ( All › )   │
│                                          │
│  ALSO COMING                             │
│  ▓ Oil & filter           in 2 months ›  │
│  ▓ ITV                    in 8 months ›  │
│                                          │
│  ─────────────  JULY  ─────────────      │
│   412 km      318,60 €      0,77 €/km    │
│                                          │
│  LAST FILL                               │
│  ▓ 6,9 L/100km · 378 km      35,75 €  ›  │
│    12 July · Repsol Tarragona            │
│                                          │
│                                    (+)   │
├──────────────────────────────────────────┤
│   ▪ Home    History   Insights   Garage  │
└──────────────────────────────────────────┘
```

- The featured card carries **which alerts will fire** (§C1) — that is the honest bit: the
  user can see the schedule without opening the reminder.
- No actions on the hero. Nothing is due; offering `Mark done` here would invite marking
  something done that has not happened.
- A **km-based** reminder's hero line is phrased by predicted time at the user's real pace,
  never as frozen remaining-km (inv.33):
  `55.000 km · around November at your pace`.
- ⟨ If notifications are denied, the hero's alert line reads
  `Alerts are off. Turn on in iOS Settings ›` — one quiet row, once, no nagging (inv.34,
  §C7). ⟩

### 2.5 `All clear`

```
┌──────────────────────────────────────────┐
│ Home                              (set)  │
│                                          │
│                                          │
│              [ koi mark ]                │
│                                          │
│            Everything OK                 │
│    All quiet for the next few weeks.     │
│                                          │
│                                          │
│  ─────────────  JULY  ─────────────      │
│   412 km      318,60 €      0,77 €/km    │
│                                          │
│  LAST FILL                               │
│  ▓ 6,9 L/100km · 378 km      35,75 €  ›  │
│    12 July · Repsol Tarragona            │
│                                          │
│                                          │
│                                    (+)   │
├──────────────────────────────────────────┤
│   ▪ Home    History   Insights   Garage  │
└──────────────────────────────────────────┘
```

- Both strings verbatim from §C1. No confetti, no streak, no "great job" — the app never
  performs enthusiasm (constitutional refusal).
- `All clear` requires **zero open review items** as well as nothing due (R1). This is the
  single most load-bearing consequence of §14.1: this screen is Koi's promise, and it must
  not be able to lie.

### 2.6 The month pulse

```
│  ─────────────  JULY  ─────────────      │
│   412 km      318,60 €      0,77 €/km    │
```

| | |
|---|---|
| Scope | **this calendar month, all live cars** — Home carries no scope control at all (art. 8's sibling: Home is never scoped, only Insights and History are), so this is fixed, not inherited from whichever chip another tab was last left on |
| Numbers | km driven `{ink}` · money spent `{ink}` (mixed-kind money is a total, not a category) · €/km `{ink}` |
| Type | all three in the data voice: monospaced, tabular, locale-formatted (§D4/§D7) |
| km | the newest odometer reading **inside** the month, minus the last reading at or before the month's start. **No reading falls inside the current month yet** → the km slot shows no figure at all — this is the one reading of inv.21-vs-inv.23 that never invents distance for a period that has not finished, distinct from a completed Insights page (§16 #4), where the trail can bracket the whole window |
| Hidden | **€/km disappears entirely** until distance exists (§C1) — no km figure this month means no €/km either (inv.23) |
| Never | a chart, a sparkline, a delta-vs-last-month arrow, a progress ring. Article 2 |
| Empty | a fresh month with no records and no readings inside it: `— · 0,00 €` + "No readings this month." Money is genuinely `0,00 €` when nothing was logged (a real sum of zero records); distance is not a sum Koi has grounds to state, so it never reads `0 km` (inv.23 — the same rule the Hidden row states for €/km, applied consistently) |

» Tapping the pulse does nothing. It is a receipt, not a control. (Considered and rejected:
tapping it into Insights' current month page — it would make Home a dashboard entrance and
§C never gives the pulse an affordance.)

### 2.7 The Last fill card

```
 measured (full → full, both odometers)
│  ▓ 6,9 L/100km · 378 km      35,75 €  ›  │
│    12 July · Repsol Tarragona            │

 litres logged, but no odometer to measure with
│  ▓ 35,75 € · 22,00 L                  ›  │
│    12 July · Repsol Tarragona            │

 no litres at all (money-only fill)
│  ▓ 35,75 €                            ›  │
│    12 July · Repsol Tarragona            │

 partial fill
│  ▓ 35,75 € · 22,00 L · partial        ›  │
│    12 July · Repsol Tarragona            │

 no fills ever
│  LAST FILL                               │
│  No fills yet. Log one and Koi starts    │
│  measuring.                              │
```

- Icon well `{fuel}`; the amount is `{ink}` (it is money, and its *kind* is already told by
  the well).
- Economy is shown **with its interval, always** — "6,9 L/100km · 378 km". A bare economy
  number without its measurement interval is exactly what §D5 forbids.
- Row taps to the fill's record page (§8.2), pushed inside the Home tab.
- ⟨ multi-car: the card's second line leads with the car — `Golf GTI · 12 July · Repsol` ⟩

### 2.8 Review queue — the list (pushed from Home)

Already built and hardened (D-047, D-051); this pass **relocates** it and adds the two
things §C's shell implies. Layout below is what exists, redrawn in the real shell.

```
┌──────────────────────────────────────────┐
│ ‹ Home        Needs review               │
│                                          │
│  2 decisions waiting                     │
│  Nothing is fixed silently. You decide   │
│  what happens.                           │
│                                          │
│  ▓ Two devices changed the same field ›  │
│    odometer reading · Golf GTI           │
│                                          │
│  ▓ A reading arrived for a deleted car › │
│    reading · Ibiza · deleted             │
│                                          │
│  REVIEWED                                │
│  ▓ The value you saw was replaced     ›  │
│    odometer reading · Golf GTI           │
│                                          │
├──────────────────────────────────────────┤
│   ▪ Home    History   Insights   Garage  │
└──────────────────────────────────────────┘
```

- Pushed inside the **Home** tab (R1) → the tab bar stays, Back says `‹ Home`.
- Open items' wells `{attention}`; reviewed items' wells drop to hairline. Resolved items
  **stay visible** — a decision is part of the record, not a deletion (D-047).
- Empty state (reachable only via Settings, since Home hides the entrance when empty):
  `Nothing needs a decision.` + "When two devices disagree, or a change cannot be applied, it
  waits here." **Neither string here is Home's** — §C1 reserves "Everything OK" for Home's own
  All-clear state (§2.5) and "Needs you" for its overdue state (§2.1); under R1 this page is
  pushed *from* Home, so meeting "Everything OK" a second time in the same stack, meaning
  something else, is exactly the collision §15.3 #10 flags in the existing code. This queue
  gets its own words throughout.

### 2.9 Review queue — one item

Existing screen (`app/review/[id].tsx`) is close to right; the wireframe changes two things.

```
┌──────────────────────────────────────────┐
│ ‹ Needs review     Review                │
│                                          │
│  Two devices changed the same field      │
│  odometer reading · Golf GTI             │
│                                          │
│  Your other device wrote a different     │
│  value to this field at about the same   │
│  time. The later one is what you see.    │
│                                          │
│  WHAT KOI RECORDED                       │
│  Field           reading_km              │
│  Written by      iPhone · 12 Jul 18:04   │
│  Record version  4                       │
│                                          │
│  THE VALUE IT REPLACED                   │
│  reading_km      91.204 km               │
│                                          │
│  THE VALUE THAT ARRIVED                  │
│  reading_km      91.240 km               │
│                                          │
│  WHAT DO YOU WANT TO DO?                 │
│  [ Put the other value back ]            │
│  [ Open the record ]                     │
│  [[ Keep what is here ]]                 │
│                                          │
├──────────────────────────────────────────┤
│   ▪ Home    History   Insights   Garage  │
└──────────────────────────────────────────┘
```

Two changes this pass makes:

1. **Field names become field labels.** `reading_km` is a column name, not a word: it reads
   `Odometer`, `Date`, `Kilometres`. The raw column name stays available in the `WHAT KOI
   RECORDED` block (it is evidence), but the value rows use human labels. The server's own
   `message` text keeps being rendered **verbatim** — that text *is* the evidence (D-047).
2. **`late-child` gets its car picker.** `spec-delta.md` records the gap honestly: when the
   reading's own car is also deleted, Koi offers no one-tap re-enter, because re-entering
   under a deleted car would insert it tombstone-born and it would vanish a second time.
   Capture now exists, so the honest action does too:
   ```
   │  WHAT DO YOU WANT TO DO?                 │
   │  The car this reading belonged to is      │
   │  deleted, so it cannot go back where it   │
   │  was.                                     │
   │  [ Enter it under another car… ]  ──► fitted car picker (§7.6)
   │  [[ Mark reviewed ]]                      │
   ```
   Still never the word "restore" — a new record with a new id, and the screen says so
   (D-047's honesty rule, unchanged).

---

## 3 · History (§C2) — the ledger

Article 1 is constitutional: **one ledger with scoped lenses — never parallel copies of
history.** History is that ledger. The car page shows 3 rows and a link *because* this
screen exists (§6.2); Insights hands its record list to History once a page is wider than a
month (§D2).

**History never gets a time control.** An infinite scroll IS time navigation; one time
idiom lives where the charts live (§D2). No date jump, no month picker, no "2026 ▾".

### 3.1 The feed

```
┌──────────────────────────────────────────┐
│ History                           (set)  │
│                                          │
│ ((All)) (Fuel) (Service) (Expense) (No…  │  ← type chips, horizontal scroll, sticky
│ ( Both cars ▾ )                          │  ← car scope, multi-car only
├──────────────────────────────────────────┤
│  JULY 2026            3 fills · 318,60 € │  ← month header + whisper
│                                          │
│  ▓ Repsol Tarragona             35,75 €  │
│    6,9 L/100km · 378 km          12 Jul  │
│                                          │
│  ▓ Oil & filter                 96,50 €  │
│    Golf GTI · 90.980 km           8 Jul  │
│                                          │
│  ▓ 90.862 km                             │
│    manual · +212 km since 24 Jun  4 Jul  │
│                                          │
│  ▓ Salou                          232 km │
│    2 – 4 Jul · ≈20,40 € fuel      2 Jul  │
│                                          │
│  JUNE 2026            2 fills · 534,10 € │
│                                          │
│  ▓ Parking                       4,20 €  │
│    Interparking Tarragona        28 Jun  │
│                                          │
│  ▓ Insurance renewed                     │
│    Mapfre · 412,00 € · +14 € vs   17 Jun │
│    last year                             │
│                                          │
│              ( Show 6 archived records ) │
│                                          │
│                                    (+)   │
├──────────────────────────────────────────┤
│   Home    ▪History   Insights   Garage   │
└──────────────────────────────────────────┘
```

### 3.2 Row anatomy per record kind

Every row: **icon well `{domain}` · title · one-line meta · mono amount · date.** The well's
colour is the whole colour job — the amount stays `{ink}`, so a screen of rows reads as one
ledger rather than four palettes.

| Kind | Well | Title | Meta leads with | Amount |
|---|---|---|---|---|
| Fill — measured | `{fuel}` | station, else `Fill-up` | **economy + interval**: `6,9 L/100km · 378 km` | money |
| Fill — partial | `{fuel}` | station | `partial · 22,10 L` | money |
| Fill — no odometer | `{fuel}` | station | `42,10 L · no odometer` | money |
| Fill — missed previous | `{fuel}` | station | `42,10 L · a fill was missed before this one` | money |
| Fill — money only (import) | `{fuel}` | station, else `Fill-up` | date + car only — no litres claim | money |
| Expense | `{expense}` | the note (preset chip text floats to the front) | free-text remainder, else car | money |
| Service | `{service}` | the note | odometer if logged: `Golf GTI · 90.980 km` | money |
| Note | `{ink}` | first line of the note | car | **none** (inv.16) |
| Odometer reading | `{ink}` | `90.862 km` | `manual · +212 km since 24 Jun` / `imported` | none |
| Trip | `{ink}` | trip name | `2 – 4 Jul · ≈20,40 € fuel` | **km, not money** (inv.17) |
| Milestone | `{ink}` | `Insurance renewed` / `Joined Mapfre` / `Swapped car` / `Paid off` / `Sold` / `Tracking began` | the fact, in §D6 voice | none |

Three rules the table encodes:

- **inv.17** — a trip's trailing figure is `232 km`, never a euro amount. Its ≈costs live in
  the meta and on its record page, because they are a share of money already counted.
- **inv.16** — a note never carries an amount and never joins the month whisper.
- **inv.7, the fold rule** — a reading logged *with* a fill or a trip lives inside that
  record and **never gets its own ledger row** (it still joins the odometer trail at read
  time). A deliberate manual reading always keeps its row. So the `90.862 km` row above
  exists only because the user opened Capture → Odometer; the fill's own `91.240 km` shows
  on the fill's record page, not as a second row here. This is the single most common
  History bug class and it is a spec invariant, not a preference.

### 3.3 Month headers

```
│  JULY 2026            3 fills · 318,60 € │
```

- Leading count = **that month's fills**, the whisper's most useful count (§C2's own
  example, "2 fills · 141,38 €").
- Money = that month's total, mixed-kind, so `{ink}`.
- Trips contribute **nothing** to it (inv.17); notes contribute nothing (inv.16).
- ⟨ a month with records but no money: `4 records` alone — never `0,00 €`, which reads as
  "spent nothing" when the truth is "nothing here was money" (**new**) ⟩
- Headers are the scroll's only structure. They stick while their month is on screen.

### 3.4 Filters

```
│ ((All)) (Fuel) (Service) (Expense) (No…  │
│ ( Both cars ▾ )                          │
```

- Type chips are **filters** → selected = ink-filled (§D7). `All` is a chip, not a clear
  button, and it is mutually exclusive with the rest; the others are additive.
- The car scope chip is a **fitted picker** (`▾`), and on a single-car garage **it does not
  render at all** — article 8: one car, no selectors anywhere.
- Filter state (type chips + car scope) **survives tab switches and resets on cold launch** —
  it is device-local UI state, stored the same way the scope chip, lens and page size are
  (§15.4: `app_meta`, S-12 territory), not reset by §D1's tab-leave rule, which resets the
  *stack* (which page you're on), not screen state (what you last filtered to). A filter that
  vanished every time a user glanced at another tab would make the sacred ledger read as
  silently partial. ⟨ Arriving from a car page's `Full history ›` **pre-scopes** the car chip and
  the arrival is visible: the chip reads `( Golf GTI ▾ )` already selected (§6.2). ⟩

### 3.5 Swipe actions

```
│  ▓ Repsol Tarragona             35,75 €  │
│    6,9 L/100km · 378 km          12 Jul  │
                 ── swipe left ──►
│ …arragona        [ Edit ]  [ Delete ]    │
```

- `Edit` opens the **capture surface prefilled** (§C5/§C6: edits reuse the same surface and
  save quietly — ceremony only for creation).
- `Delete` is always confirmed, and always undoable from its toast, which holds the restore
  closure (inv.31). A fill's confirmation says what else it costs:
  `Delete this fill? It leaves History and your averages.` (§I use case 9)
- **Milestones cannot be swiped.** They are a read-only projection — "Milestones can't be
  edited." (§C6). Neither can a folded reading (it has no row).
- Row tap → record page, pushed inside the History tab, with the zoom transition from the row
  (§C6).

### 3.6 States

| State | Trigger | Screen |
|---|---|---|
| Feed | ≥1 record | 3.1 |
| Zero cars | no cars | §1.4 convergence |
| Empty ledger | cars exist, no records | teaches (below) |
| Filtered to nothing | filters exclude everything | offers `Clear filters` (below) |
| Archived hidden | any archived car has records | the `( Show N archived records )` footer, per inv.30 |
| Single car | one car | no car scope chip anywhere |

```
 empty ledger
│  Nothing logged yet.                     │
│  Every fill, service and note you add    │
│  lands here, newest first.               │
│                                          │
│            [[ Log a fill-up ]]           │

 filtered to nothing
│  No fuel records in this ledger.         │
│                                          │
│            ( Clear filters )             │
```

» Neither apologises, neither is styled as an error (§D5/§D6). The empty ledger offers the
one action that fixes it; the filtered state offers the one action that fixes *that* — and
they are different actions, which is why they are different states.

### 3.7 Two §G items this layout leaves room for

- **History search** (§G, "nice-to-have once ledgers get big"): the filter row is the natural
  home — a search field appears above the chips when it arrives. Nothing here forecloses it.
  Not drawn, not built.
- **History period jump** (§G, sketched: tap a Cost-lens bar → that month in History): needs
  History to accept an arrival anchor (scroll to a month) without growing a time *control*.
  The month headers already give it a target. Recommendation: keep the arrival anchor in mind
  when building the feed's list, and do not add a control for it.

---

## 4 · Insights (§C3) — the header, and time as pages (§D2)

> **Time is pages, not windows.** Pages are calendar-aligned and never overlap, so every
> quantity has exactly one period and one answer.

This is the part of the product that was designed to kill a bug class: seven overlapping
windows all ending "now" made one question yield four answers, and made "This month"
identical to "3 months" (§F). Everything below exists to keep one question → one answer.

### 4.1 One control row, then the pager

```
┌──────────────────────────────────────────┐
│ Insights                          (set)  │
│                                          │
│ Cost ▾                       ( Both ▾ )  │  ← lens (title menu) · car scope (trailing)
│ ‹      July 2026 · to date ▾         ›   │  ← page position · page size
├──────────────────────────────────────────┤
│  249,43 €                                │  ← headline: the page's own total
│  Services is your biggest cost.          │  ← one plain sentence
│                                          │
│  ...cards...                             │
│  ...records behind the numbers...        │
│                                    (+)   │
├──────────────────────────────────────────┤
│   Home     History   ▪Insights   Garage  │
└──────────────────────────────────────────┘
```

Panned back one page — `TODAY` appears, and the partial-page qualifier disappears because
June is a whole month:

```
│ Cost ▾                       ( Both ▾ )  │
│ ‹      June 2026 ▾          ›     TODAY  │
```

- **Title = the lens.** `Cost ▾` is the screen's title *and* its control (§C3). One row, not
  a tab bar: Insights tabs would repeat History's chips at a different meaning, which is the
  exact confusion Tester R reported ("Insights tabs ≠ History tabs — simplify", §E round 5).
- **Car scope rides trailing** and is absent entirely on a single-car garage (article 8).
- **Page size is a rare choice, page position is the frequent act** (§D2). So size hides
  behind the period label's `▾` and position is one chevron tap — or a swipe of the whole
  page.
- **`TODAY` appears only when panned** and jumps home. It is the "you are not on the current
  page" receipt, and its absence is meaningful.
- **`· to date`** marks the current partial page (§D5). A whole past month never says it.

### 4.2 The two fitted pickers

```
 tap the lens title                    tap the period label
┌──────────────────────────────────────┐  ┌──────────────────────────────────┐
│  Which lens?                         │  │  Month · by week              ✓  │
│                                      │  │  Year · by month                 │
│  Cost                             ✓  │  │  All time · by year              │
│  Fuel                                │  └──────────────────────────────────┘
│  Distance                            │
│  Ownership                           │      parent stays visible behind
└──────────────────────────────────────┘      tap applies and closes itself
```

- Both are **fitted** sheets: parent visible, tap applies and closes, **no Save button**
  (§D1).
- The page-size rows are **named with their resolution** (§C3) — "Month · by week" tells you
  what the bars will be before you commit. That is the whole reason grain is not a separate
  control.
- `Which lens?` copy is **Appendix 2's open question 3** — "lens" is new user-facing
  vocabulary. Alternatives on file: "What to look at?", or a plain list with no title. Owner
  call; wireframe shows the spec's own draft. See §16.

### 4.3 The carousel — the whole page moves

```
        page N-1              page N (on screen)         page N+1
   ┌──────────────┐        ┌──────────────────┐        ┌──────────────┐
   │  June 2026   │        │  July · to date  │        │   not        │
   │  534,10 €    │  ◄──── │  249,43 €        │ ────►  │   rendered   │
   │  [cards]     │  drag  │  [cards]         │  drag  │   (today is  │
   │  [records]   │        │  [records]       │        │   the edge)  │
   └──────────────┘        └──────────────────┘        └──────────────┘
      headline + cards + records move together, as one page
      native snap · edges rubber-band · pages that don't exist are never rendered
```

- **Everything on screen answers for the same period.** The headline, every card and the
  record list ride the same page — that is what makes the period unambiguous, and it is why
  the pager cannot be a control that merely re-filters cards in place.
- **Edges:** first record on the left, today on the right. Beyond them, pages are *not
  rendered*, so the platform's own rubber-band is the feedback. No disabled chevrons, no
  bounce animation of our own.
- **Chevrons drive the same carousel** — `‹` is one page, animated identically to a swipe, so
  the two controls cannot disagree.
- **Page-size changes keep your place** (§D2): July (month) → 2026 (year) → tapping back to
  Month lands on July again. `Year → Month` drills into *that year*, not into today.
- **Each card repeats its period** as a small receipt (`JULY`), because a user reading
  mid-scroll has the header off screen (§D2). This is the fix for the most repeated critique
  in the whole feedback ledger: "quantities but you don't know which period" (§E round 5).

### 4.4 The principled exceptions

| Exception | What the header does | Why (§D2) |
|---|---|---|
| **Ownership lens** | the pager **folds away** entirely — no chevrons, no period label, no TODAY | ownership is timeless; "since 2019" is not a page |
| **All time** | period label reads `All time · by year`; chevrons hidden | there is one page, so there is nothing to turn |
| **A plan's cap cycle** | the cap gauge card rides **above** the paged charts, carrying its own dates | a lease cycle anchors to the plan's start day-of-month (inv.24) — it is not a calendar page and must not pretend to be one |
| **History** | has no time control at all | infinite scroll IS time navigation; one idiom, and it lives here |

### 4.5 Chart grammar the cards must obey (§D4)

Every card in §5 is drawn against these. They are laws, not preferences:

- **Headline number + plain sentence first.** The chart is evidence, not decoration. *A chart
  that cannot earn a headline and a sentence is a stat table instead.*
- **No pies.** Constitutional. Cost structure is ranked horizontal bars + a closing sentence.
- **One data-series colour per chart.** Averages = dashed hairline; best = `●` filled; worst =
  `○` hollow, `{attention}`; projections = dashed tail + hollow endpoint, always `≈`, dated
  in the caption.
- **Max ~8 marks.** Labels only where they answer a question: the peak bar carries period +
  value; tap any bar to read it (the selection *replaces* the peak label, and clears on data
  change); line endpoints carry their values beside the dots; first/mid/last dates under the
  axis, collapsing to one label when every point shares a month.
- **Ghost bars** (`░`) past the window edges say "there's more history this way."
- **A trend line needs ≥3 points** to earn its space. Below that, the numbers carry it.
- **Buckets follow the page:** weeks in a month, months in a year, years across everything.
- Numbers wear the monospaced tabular voice everywhere; estimates are `≈`; units are locale
  formatted (`1.234,56 €`, `43.465 km`).

### 4.6 Implementation notes (not this session's work)

- **The carousel.** Appendix 1's iOS recipe is a paged container over
  `[previous, current, next]` **tagged by their interval start date**, where settling mutates
  the anchor inside a no-animation transaction so the re-center is invisible. The React
  Native equivalent is the same three-page window: a horizontally paged list of exactly three
  interval-keyed pages, re-keyed on settle, with the inner vertical scroll separated by axis
  (a horizontal pan owns the page, a vertical pan owns the scroll). Missing edge pages are
  not rendered — the platform's rubber-band comes free.
- **Charts are not installed.** Skia + Victory Native XL are re-confirmed on paper (D-048)
  and arrive with the chart work. Per §D4's own escape hatch, several cards are honest as
  **stat tables first** (§5.7) — which means Insights can ship its information architecture,
  its pager and its honesty rules *before* a single canvas exists, and gain marks later
  without an IA change.
- **The default page size is Month** (Appendix 2 open question 2) — it lands on today's
  partial page, Withings-style, and is sometimes sparse. Year is the alternative on file.
  Owner sign-off owed; see §16.

---

## 5 · Insights — the four lenses

### 5.1 Cost lens — a month page

```
┌──────────────────────────────────────────┐
│ Insights                          (set)  │
│ Cost ▾                       ( Both ▾ )  │
│ ‹      June 2026 ▾          ›     TODAY  │
├──────────────────────────────────────────┤
│                                          │
│  534,10 €                                │
│  Your plan is your biggest cost.         │
│                                          │
│  WHERE IT WENT                     JUNE  │
│  Plan      ████████████████    289,00 €  │
│  Services  ████████            142,50 €  │
│  Fuel      █████                98,40 €  │
│  Expenses  ▌                     4,20 €  │
│                                          │
│  Your plan was more than half of June.   │
│                                          │
│  BY WEEK                           JUNE  │
│                                          │
│              wk 25 · 289,00 €            │
│   ░    ██   ██████   ████████   █   ░    │
│   1 Jun        15 Jun        29 Jun      │
│                                          │
│  CUMULATIVE                        JUNE  │
│                                          │
│                            ● 534,10 €    │
│                     ..--''               │
│         ..--''''                         │
│   ● 0 €                                  │
│   1 Jun                       30 Jun     │
│                                          │
│  THE RECORDS BEHIND THE NUMBERS    JUNE  │
│  ▓ Mapfre                      289,00 €  │
│    Plan · monthly charge         17 Jun  │
│  ▓ Oil & filter                142,50 €  │
│    Golf GTI · 90.980 km           8 Jun  │
│  ▓ Repsol Tarragona             68,40 €  │
│    6,9 L/100km · 378 km          12 Jun  │
│  ▓ BP Reus                      30,00 €  │
│    partial · 18,20 L             25 Jun  │
│  ▓ Parking                       4,20 €  │
│    Interparking Tarragona        28 Jun  │
│                                    (+)   │
├──────────────────────────────────────────┤
│   Home     History   ▪Insights   Garage  │
└──────────────────────────────────────────┘
```

**Card by card.**

| Card | Grammar |
|---|---|
| headline | the page's own **total**, `{ink}` (mixed-kind money is a total, not a category) + one sentence naming the biggest cost |
| `WHERE IT WENT` | **ranked horizontal bars, top 5**, each in its own `{domain}` hue + a closing sentence. Never a pie — constitutional. Rows name the plan **type** ("Plan", "Subscription", "Finance"), never the provider brand, and same-kind plans merge (inv.18) |
| `BY WEEK` | vertical bars in `{ink}`; **peak labelled with period + value**; tap any bar to read it (selection replaces the peak label, clears on data change); `░` ghost bars at both edges where more history exists |
| `CUMULATIVE` | line, **zero baseline**, endpoint values beside the dots |
| records | up to **6** ledger rows, **amount-descending** (the card is evidence for "where it went"; recency would duplicate History's own ordering), tap → record page. `( N more in History › )` appears **only past 6** — June's own page has exactly 5 (they sum to the 534,10 € headline, §0.6), so the frame above shows all of them and carries no link; a busier month would truncate and the link would appear |

**Page-size variations.**

- **Year page:** `BY WEEK` becomes `BY MONTH`, `CUMULATIVE` spans the year, and the record
  list is **not shown** — wider pages hand the list to History (§D2). Headline stays the
  page total: `3.204,80 € in 2026`.
- **All time page:** the headline stops being a total and becomes a **stable rate** —
  `142,60 €/month · 0,31 €/km` — because a lifetime total answers a different question badly.
  Under 8 weeks of data it is `≈`-marked and says so: `Early days, based on 5 weeks.` (§D5).
  Chevrons hide; there is one page.

**Degraded and withheld states.**

| Condition | What the page shows |
|---|---|
| page has no records | headline `0,00 €` is a lie by omission; instead: `Nothing logged in June.` + one sentence + no cards. **New**; §C is silent, and §D5's "sums that would lie are withheld" is the governing rule |
| money but no distance in the page | no `€/km` anywhere on the page — not a dash, absent (inv.23) |
| a note-kind entry in the page | contributes nothing to any bar or total (inv.16) |
| a trip in the page | contributes nothing (inv.17); it appears in the Distance lens, not here |
| plan money | derived from the one billing series (inv.13); the **deposit never appears as a monthly charge** (inv.14) |
| a purchase price in the page | it is a **fact, not a charge** — never a bar, never in the total (inv.15). It lives on the Ownership lens |
| fewer than ~3 bars | `BY WEEK` still earns its space (bars are not a trend line) but drops the peak label when there is only one bar — a label pointing at the only mark answers nothing |

### 5.2 Fuel lens — a month page, one car

```
┌──────────────────────────────────────────┐
│ Insights                          (set)  │
│ Fuel ▾                    ( Golf GTI ▾)  │
│ ‹      July 2026 · to date ▾         ›   │
├──────────────────────────────────────────┤
│                                          │
│  6,9 L/100km                             │
│  Steady, over your last 5 measured fills.│
│                                          │
│  PER FILL                          JULY  │
│                                          │
│   7,4  ○                                 │
│   - - - - - - - - - - - - - - - - - - -  │  ← dashed average hairline, 6,85
│              ●                           │
│   6,4                                    │
│   1 Jul        12 Jul        24 Jul      │
│                                          │
│  PRICE PAID                        JULY  │
│  1,624 €/L average                       │
│        ..--''--..--''                    │
│  Cheapest: Repsol Tarragona · 1,589 €/L  │
│                                          │
│  THE NUMBERS                       JULY  │
│  Average         6,9 L/100km             │
│  Best · worst    6,4 · 7,4               │
│  Last            6,9 · 12 Jul            │
│  Cadence         11 days · 378 km        │
│  Per fill        28,4 L · 46,15 €        │
│                                          │
│  July · 3 fills · 85,2 L · 138,45 €      │
│  3 fills, all full. Economy is reliable. │
│                                    (+)   │
├──────────────────────────────────────────┤
│   Home     History   ▪Insights   Garage  │
└──────────────────────────────────────────┘
```

**Card by card.**

| Card | Grammar |
|---|---|
| headline | average `L/100km` = mean of the **last ≤5 measured values**, needs **≥2**; the trend word compares older half vs newer half with a ±5% dead band → `steady` (inv.4). One `{fuel}` series |
| `PER FILL` | line, **≥3 measured fills** to earn its space (§D4); dashed average hairline; best = `●` filled `{fuel}`; worst = `○` hollow `{attention}` |
| `PRICE PAID` | average €/L + sparkline at **≥3 points**; names the cheapest station |
| `THE NUMBERS` | a **vertical** stat table — verticals beat horizontal pills (§E round 3, Tester M) |
| footer | `period · fills · litres · money`, then the **chain-integrity line** |

**The chain-integrity line is not optional.** It is the sentence that makes every average
above it trustworthy (§D5):

```
  3 fills, all full. Economy is reliable.
  18 of 21 full. Averages shown as ≈.
```

**All-cars scope shows tiles, never a blended average** (inv.5 — blending economy across cars
is physically meaningless and is a constitutional refusal):

```
│ Fuel ▾                       ( Both ▾ )  │
│ ‹      July 2026 · to date ▾         ›   │
├──────────────────────────────────────────┤
│  ┌──────────────────┐┌─────────────────┐ │
│  │ Golf GTI         ││ Ibiza           │ │
│  │ 6,9 L/100km      ││ ≈5,4 L/100km    │ │
│  │ steady · 3 fills ││ 2 of 4 full     │ │
│  └──────────────────┘└─────────────────┘ │
│  Tap a car to see its fills.             │
```

**Every degraded case, and what it says.** This is the lens where honesty is hardest, so the
table is exhaustive:

| Condition | Screen | Rule |
|---|---|---|
| 0 fills in the page | `No fills in July.` + the sparse teaching card if the car has never measured | §D5 |
| 1 measured value ever | `Two full tanks to go` + progress dots `● ● ○ ○` — teaches, never apologises | §C3 |
| 1 measured value in *this page*, more before it | headline shows the running average with its own basis line; the page's single value is a dot, not a line | inv.4 needs ≥2 |
| < 3 measured fills in the page | `PER FILL` card is **replaced by** `THE NUMBERS` moved up; a 2-point "trend" is refused | §D4 |
| partial fills present | their litres accumulate into the enclosing full→full interval; they are **not** dots on `PER FILL` | inv.2 |
| a full fill with no odometer | same: litres accumulate, no dot of its own | inv.2 |
| `missedPrevious` on a fill | that interval yields **no number** — a visible gap in the line, and the footer says `A fill was missed. That interval isn't measured.` Never an interpolated dot | inv.3 |
| any fill without litres | the footer's **litres total disappears entirely** (not zero, not ≈) — a sum that would lie is withheld | §D5 |
| money-only fills (imports) | they count in money and in the fill count, never in litres, economy, or the `PRICE PAID` €/L average — the same litres-withholding rule §D5 states for the footer applies to every card computed from litres (a money-only fill carries none to average) | §F, §D5 |
| all fills money-only | no litres anywhere means no €/L either — the headline becomes the money fact the data supports (e.g. `138,45 € on fuel · 3 fills`), `PRICE PAID` does not render, and economy says `Not measured yet. A full tank with an odometer starts the chain.` The chain line still carries the truth (`0 of 3 full`) | §D5 |
| car is electric / hybrid-plug | the lens is fuel; EV charging economics are explicitly later (§G). An electric car shows `Koi doesn't compute charging economy yet.` and its money still appears in the Cost lens | §G |
| < 2 odometer readings in the window | no interval to measure against → economy withheld, dash + sentence | inv.23 |
| rate below its minimum span | `€/day` needs ≥7 days, economy needs ≥2 pairs; below that the figure is absent, not `≈` | §D5 |

### 5.3 Distance lens — a capped car

The cap gauge is **pinned above the paged charts** and carries its own dates, because a lease
cycle is not a calendar page (§D2 exception, inv.24). Everything below the rule pages; the
gauge does not.

```
┌──────────────────────────────────────────┐
│ Insights                          (set)  │
│ Distance ▾                ( Golf GTI ▾)  │
│ ‹      July 2026 · to date ▾         ›   │
├──────────────────────────────────────────┤
│  CAP CYCLE · 23 Jul – 22 Aug              │  ← pinned, not paged
│  1.240 / 1.760 km                        │
│  ██████████████░░░░░░░░░░░░░             │
│  1.500 cap + 260 carried over from June. │
│  At your pace, ≈1.410 km by 22 August.   │
│  Under the cap.                          │
├──────────────────────────────────────────┤
│  412 km                                  │
│  14,7 km/day over 28 tracked days.       │
│                                          │
│  BY WEEK                           JULY  │
│        wk 29 · 168 km                    │
│   ░   ██   ████   ██████   ███   ░       │
│   1 Jul        15 Jul        29 Jul      │
│                                          │
│  TRIPS                             JULY  │
│  ▓ Salou                          232 km │
│  ▓ Andorra                         96 km │
│  ▓ Airport run                     84 km │
│  3 trips · 412 km together · ≈36,25 €    │
│                                          │
│  ODOMETER                          JULY  │
│                        ● 91.240          │
│                  ..--''  - - - ○ ≈92.400 │
│      ..--''''                         km │
│  ● 90.828                                │
│  1 Jul          31 Jul       ≈30 Sep     │
│  ≈ projected to 30 September.            │
│                                    (+)   │
├──────────────────────────────────────────┤
│   Home     History   ▪Insights   Garage  │
└──────────────────────────────────────────┘
```

| Element | Rule |
|---|---|
| cap gauge | fills `{ink}` under the cap; **over-cap fills `{attention}`, the overage is counted in text, and the pace line stays present tense** (inv.26). Never hidden, never red. **Denominator is the pooled budget (cap + carry-over), not the bare cap** — a pooling plan with 260 km banked is not over until it passes 1.760 km, and a gauge drawn against the bare 1.500 would flag `{attention}` on a car that is still under budget |
| carry-over footer | pooling plans budget against cap + banked km from **completed** cycles; the pool never credits untracked months before tracking began (inv.25). States both halves of the budget (`1.500 cap + 260 carried over`), because the gauge's own denominator depends on it — the **Garage chip stays on the bare cap** (§6.1/§C4's own example), so the chip and the gauge deliberately show different numbers for the same car; what must agree between them is only the over/under-cap *state*, never the raw figure |
| cycle dates | anchored to the plan's start day-of-month, clamped on short months (inv.24) — the card states its own window so it can never be mistaken for the page. The window is always the cycle **containing today**, never a closed one — a card showing a cycle that already ended, with a pace sentence projecting into a date already past, is exactly the honesty failure §D5 exists to prevent |
| headline | km in page + km/day over **tracked** days — days elapsed **inside the page**, never more than the page's own elapsed days, and never past today on a `to date` page (§D2: a rate divides by the window it claims) |
| `BY WEEK` | `{ink}` bars — distance is not money |
| `TRIPS` | top 3 by km + `N trips · X km together · ≈Y €`, and the sum of the three top trips' km never exceeds the page's own headline km (§0.6: numbers reconcile inside one screen — a trip's km is a subset of the period's distance). The `≈` is load-bearing: it is a share of money already counted (inv.17) |
| `ODOMETER` | line + dashed `≈` projection **two months past today**, never past the last reading (inv.22), with a hollow endpoint and a dated caption, in full locale format (`92.400 km`, never an abbreviated `92k`) |

**Over-cap, drawn** — a separate illustrative snapshot later in the same cycle, and it must say
the same thing the garage chip says (§6.1, "garage and car page tell one truth") about the
over/under state, even though the chip's own number stays the bare cap:

```
│  CAP CYCLE · 23 Jul – 22 Aug             │
│  1.840 / 1.760 km                        │
│  ██████████████████████████████████████  │  {attention}
│  1.500 cap + 260 carried over from June. │
│  80 km over your pooled budget.          │
│  At your pace, ≈2.020 km by 22 August.   │
```

**Interpolation, and what it means on screen** (inv.21): buckets interpolate the trail
linearly between readings, so a years-wide gap **spreads across the months it covers**
instead of spiking in the month the next reading lands, and buckets telescope exactly to
`last − first`. Consequence for the wireframe: a sparse trail draws *low, even* bars across
the gap, and the axis labels are real dates, not "the month we found out". A user with two
readings a year apart sees twelve small bars, not one tall one — that is correct and needs no
caption.

**Degraded states.**

| Condition | Screen |
|---|---|
| < 2 readings in the window | no figure at all — `Not enough readings to measure July.` + what would fix it (inv.23: distance is never invented) |
| no cap on the plan | the gauge card does not render; the lens starts at the headline |
| no trips in the page | the `TRIPS` card does not render (an empty top-3 answers nothing) |
| trail is stale (last reading months ago) | the projection **still anchors two months past today** and says so; it never projects into the past (inv.22). The headline's `km/day` uses tracked days, so a stale trail lowers it honestly |
| cap cycle spans two pages | the gauge is unaffected — it is pinned and carries its own dates. This is the whole point of the exception |
| **all-cars scope** (§I use case 7: "distance aggregate") | headline and `BY WEEK` bars aggregate across every live car — a shared trail chart is not drawn (trails do not blend, unlike km and money). Each capped car keeps its **own** pinned gauge, in cycle order, stacked above the paged region; more than two collapses to the first two expanded + `( N more cars on caps › )`. `TRIPS` lists top 3 by km across all cars, each row carrying its car's name in the meta |

### 5.4 Ownership lens — the pager folds away

```
┌──────────────────────────────────────────┐
│ Insights                          (set)  │
│ Ownership ▾                 ( Ibiza ▾ )  │  ← no pager row at all
├──────────────────────────────────────────┤
│                                          │
│  Since 2014                              │
│  Ibiza · owned outright                  │
│                                          │
│  FACTS                                   │
│  Purchase price          9.200,00 €      │  ← fact row, not a charge
│                                          │
│  WHAT THIS CAR COSTS                     │
│  since tracking began                    │
│                                          │
│  Fuel                    2.145,80 €      │
│  Services                  890,30 €      │
│  Expenses                   156,40 €     │
│  Plan charges                    —       │
│  ────────────────────────────────        │
│  All-in so far            3.192,50 €     │
│                                          │
│  2,00 € a day · 0,10 €/km, purchase      │
│  aside.                                  │
│                                          │
│  MILESTONES                              │
│  ● Bought                          2014  │
│  │                                       │
│  ● Tracking began                 Mar 22 │
│  │                                       │
│  ● Latest service                  3 Jun │
│  │                                       │
│  ● Today                      142.600 km │
│                                    (+)   │
├──────────────────────────────────────────┤
│   Home     History   ▪Insights   Garage  │
└──────────────────────────────────────────┘
```

**Chose the Ibiza for this frame, not the Golf GTI.** §0.6 fixes the Golf GTI as the
subscription car, and this section's own per-plan-kind table (below) is unambiguous — a
subscription gets **no** purchase-price row and totals `Logged so far`. Drawing an owned car's
Ownership page needed an owned car; the Ibiza is §0.6's other fixture and needed no invented
numbers to become one. **The `FACTS` group holds purchase price on its own, outside the summed
block** — so the rows above `All-in so far` sum exactly to it (2.145,80 + 890,30 + 156,40 =
3.192,50), and the exclusion is visible at the total itself, not only in the rates sentence
below it (§0.6: "a total whose parts are not all on screen is a black box", inv.15).

- **Always single car**, and the car chip therefore stays in the header and becomes
  **required** rather than optional. Arriving on Ownership from an all-cars scope, the chip
  re-labels to the resolved car (the last-scoped car, else the only unarchived one, else the
  newest), the lens names it in the sub-headline (`Ibiza · owned outright`), and one receipt
  line under the header says so — `Ownership is per car. Showing Ibiza.` — appearing **only**
  on that arrival. Leaving Ownership restores the previous scope. Considered and rejected:
  auto-switching the global scope (it would silently change what History and Cost show when
  you leave), and blocking the lens behind a picker (a lens that refuses to render is a dead
  end). **New** — §C says "always single-car" without saying how the header gets there.
- **Purchase price is a fact row, never a charge** (inv.15), and the rates sentence therefore
  ends `purchase aside.` — the total row does not include it either.
- **The deposit is capital** and never appears in a per-month rate (inv.14).
- **A per-month rate divides by the window it claims** (inv.19) — no trailing-12 denominator
  under another label.

**Per plan kind.**

| Kind | Ledger card | Total row | Notes |
|---|---|---|---|
| Owned | purchase price fact row; no plan charges | `All-in so far` | |
| Finance | purchase price fact row + plan charges (deposit at signup, then monthly at each cycle start, stopping at min(end, paid-off, today) — inv.13) | `All-in so far` | ⟨ past its end date with no payoff: the one-time nudge lives on the **car page**, not here (inv.29) ⟩ |
| Lease | **no** purchase-price row (inv.15) | `Logged so far` | plan charges are the running truth |
| Subscription | **no** purchase-price row | `Logged so far` | rows name the **type**, not the brand (inv.18) |
| Sold | adds `Sold for  − 12.400,00 €` | **`Net cost`** | §I use case 10 |
| Swap lineage | plan charges span the lineage; `MILESTONES` carries a `Swapped car` dot (inv.28) | unchanged | the lens follows the plan, not one car body |
| Archived car | renders fully — an archived car keeps its whole story (inv.30); the headline adds `· archived 2020` | unchanged | |
| Almost no data | ledger card shows only the rows that exist; the rates sentence is **absent** below its minimum span, and `Early days, based on 3 weeks.` replaces it | | §D5 |

### 5.5 Where each lens hands off

- Cost month page → **its own record list** → record page → Back returns to that page, and
  `TODAY` jumps home (§I use case 4, end to end).
- Cost year/all page → **History** (`N more in History ›`, pre-scoped to the car if scoped).
- Fuel all-cars tile → tap → the same lens, scoped to that car (page position preserved).
- Distance `TRIPS` row → the trip's record page (§8.5).
- Ownership `MILESTONES` dot → the milestone glance sheet (§8.6), which states it cannot be
  edited.

### 5.6 What Insights never does

No pies (constitutional). No tabbed sub-navigation inside a lens (§E round 5's refusal). No
overlapping windows — ever, under any label. No blended economy across cars (inv.5). No
per-trip economy or average speed (constitutional refusals: a 13-hour trip showing "57 km/h"
is parked-time fiction). No chart on Home, ever (article 2). **Income is the one refusal that
is no longer one** — D-008/D-014 superseded the refusals-table income row, so income tracking is
IN scope (BOARD bucket E); it simply has no surface yet, and §16 #9 says why it stays off the
capture chooser for the shell build.

### 5.7 Which cards can ship as stat tables first

Charts are deliberately not installed. §D4's own rule — *if a chart can't earn its headline
and sentence, it's a stat table instead* — makes a staged build honest rather than a
compromise:

| Card | Table-first form | Loses |
|---|---|---|
| Cost `WHERE IT WENT` | **already a table** — ranked rows with `{domain}` bars; the bar is one view's width, drawable without a chart library | nothing |
| Cost `BY WEEK` / Distance `BY WEEK` | rows: `wk 24 · 142,50 €` | at-a-glance shape, ghost bars |
| Cost `CUMULATIVE` | `Start 0 € → End 534,10 €` two-row table | the curve's shape |
| Fuel `PER FILL` | `THE NUMBERS` already carries average/best/worst/last | the per-fill shape |
| Fuel `PRICE PAID` | average + cheapest station as two rows | the sparkline |
| Distance `ODOMETER` | first/last reading + `≈` projection as three rows | the curve and its dashed tail |
| Ownership | **no charts at all** — it is a ledger card + a dot list | nothing |

**Consequence worth stating plainly:** the Ownership lens and the Cost lens's ranked bars are
buildable *today* with zero chart work, and Ownership is the lens Tester M asked for by name
("I want ownership KPIs — purchase price, €/day, €/km", §E round 3). If the next session
wants a real lens on screen before the chart work, that is the one to build.

---

## 6 · Garage, the car page, and the car form (§C4)

Article 8: **one car, no selectors anywhere. Several, effortless scoping.** Every chip and
picker below is conditional on a second car existing.

### 6.1 Garage

```
┌──────────────────────────────────────────┐
│ Garage                            (set)  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ ▒▒▒▒▒▒▒▒▒▒▒▒ photo ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │  │
│  │ Golf GTI                        ●  │  │
│  │ VW Golf GTI · 2019 · 1234-ABC      │  │
│  │ (Mapfre) (1.240/1.500 km)          │  │
│  │ (Insurance in 16 days)             │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ ▒▒▒▒▒▒▒▒▒▒▒▒ photo ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │  │
│  │ Ibiza                              │  │
│  │ Seat Ibiza · 2014 · 5678-DEF       │  │
│  │ (Owned)                            │  │
│  └────────────────────────────────────┘  │
│                                          │
│              [ Add a car ]               │
│                                          │
│  ARCHIVED                                │
│  ▓ Ibiza 1.9 TDI                      ›  │
│    Archived 2020 · records kept          │
│                          ( Restore )     │
│                                    (+)   │
├──────────────────────────────────────────┤
│   Home     History   Insights  ▪Garage   │
└──────────────────────────────────────────┘
```

| Element | Rule |
|---|---|
| photo | car accent colours and photos are **identity only**, never data (§D3). A photoless car gets a warm placeholder block, not a grey box |
| name + `●` | the attention dot appears when this car has something overdue or over-cap. `{attention}` |
| identity line | make · model · year · plate, in the text voice |
| status chips | `( provider )` `{contract}` · `( 1.240/1.500 km )` cap · `( Insurance in N days )`. Facts, not warnings (§D6) |
| **over-cap chip** | wears `{attention}` and reads `( 180 km over )` — **garage and car page tell one truth** (§C4, inv.26). The Distance lens gauge says the same thing in the same colour (§5.3) |
| archived section | dimmed rows, `Archived 2020 · records kept`, `( Restore )`. Archive shelves; delete purges; the two are **never** conflated (inv.30) |
| zero cars | §1.4 convergence |
| single car | still a card, not a promoted dashboard — the garage is a list of one |

» Card tap pushes the car page inside the Garage tab.
» Archived rows are **not** cards: dimming a photo card reads as broken. A row reads as
shelved. (**new** — §C says "dimmed rows", which this takes literally.)

### 6.2 Car page (pushed)

Exactly what §C4 lists, in its order, with the one-ledger rule at the bottom.

```
┌──────────────────────────────────────────┐
│ ‹ Garage        Golf GTI        (pencil) │
│  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒ photo ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  │
│  ( 1234-ABC )                            │
│  VW Golf GTI · 2019 · petrol             │
│  245 hp · 50 L tank                      │
│                                          │
│  ODOMETER                                │
│  91.240 km                           …›  │
│  Read 12 July · derived from your trail  │
│                                          │
│  PLAN                                    │
│  Mapfre · 289,00 € a month               │
│  Insurance and maintenance included.     │
│                                          │
│  1.240 / 1.760 km  · 23 Jul – 22 Aug     │
│  ██████████████░░░░░░░░░░░░░             │
│  1.500 cap + 260 carried over from June. │
│  At your pace, ≈1.410 km by 22 August.   │
│  Under the cap.                          │
│                                          │
│  Swap window opens 12 September      …›  │
│                                          │
│  CARE                                    │
│  ▓ Insurance · Mapfre                 ›  │
│  ▓ Reminders · 3                      ›  │
│  ▓ Documents · 2                      ›  │
│  ▓ Add a reminder                    …›  │
│                                          │
│  RECENT                                  │
│  ▓ Repsol Tarragona          35,75 €  ›  │
│    6,9 L/100km · 378 km       12 Jul     │
│  ▓ Oil & filter              96,50 €  ›  │
│    90.980 km                   8 Jul     │
│  ▓ 90.862 km                          ›  │
│    manual                      4 Jul     │
│                                          │
│            ( Full history › )            │
├──────────────────────────────────────────┤
│   Home     History   Insights  ▪Garage   │
└──────────────────────────────────────────┘
```

**Exactly 3 recent rows, then `Full history ›`.** Not 5, not "a few", not scrollable. This is
article 1 with a number on it, and it is the structural fix for a real defect Tester R found
in the old app — "duplicated history inside car sheet" (§E round 1). `Full history ›` jumps to
the **History tab pre-scoped to this car** (§3.4), which is why History's car chip shows as
already selected on arrival. It is a cross-tab jump, deliberately: there is one ledger, and it
lives on its own tab.

**No `OWNERSHIP` group on this frame — correctly.** §0.6 fixes the Golf GTI as the subscription
fixture, and the rule two rows below is exact: purchase price is absent for subscription/lease
(inv.15). The `PLAN` group (Mapfre, the cap gauge, the swap row) and the `OWNERSHIP` group never
both appear — an owned or financed car's page shows the reverse: no `PLAN` group, and
`OWNERSHIP` in its place with the purchase-price fact row §6.5's form collects.

| Group | Content | Rule |
|---|---|---|
| header | photo, plate chip, specs; `(pencil)` opens the **car form** sheet prefilled | `+` creates, pencil edits (§D1) |
| `ODOMETER` | current km, **derived from the trail, never stored** (S-3 / inv.6). Tap → the odometer sheet (§7.6) — the same surface Capture → Odometer opens, prefilled with this car |
| `PLAN` | subscription/lease: monthly, included cover as **quiet facts**, cap gauge + pace sentence, carry-over footer. Owned: the group collapses to nothing (an "Owned outright" card states the obvious) |
| swap | a row that opens a **fitted sheet** (§6.3) |
| ⟨ payoff nudge ⟩ | §6.4 — once, ever |
| `CARE` | insurance → the vault (§10); reminders → the reminder list scoped to this car; documents → papers; add reminder → the builder sheet |
| `OWNERSHIP` | owned/finance only: purchase price etc. **Absent for lease and subscription** (inv.15) |
| `RECENT` | 3 rows + the link. Row anatomy identical to History's (§3.2) — one row design, used everywhere |

**What is NOT on this page:** a readings list, an inline add-reading form, and a delete-car
button in the body. The first two are a second copy of the ledger; the third belongs in the
car form's foot with Archive and Restore, where §C4 puts it, because destructive lifecycle
actions belong together and behind an edit intent. (This is the biggest single divergence from
what `@koi/mobile` has today — §15.2.)

### 6.3 Swap — a fitted sheet that refuses honestly

```
        ┌──────────────────────────────────┐
        │  Swap window                     │
        │                                  │
        │  12 September – 12 October 2026   │
        │  every 12 months                  │
        │                                  │
        │  Koi can't perform the swap and   │
        │  doesn't pretend to.              │
        │                                  │
        │  Your records stay with the plan. │
        │  The new car joins the same       │
        │  history; nothing is retyped.     │
        │                                  │
        │  [ Remind me on 12 September ]    │
        └──────────────────────────────────┘
```

- Verbatim refusal from §C4. §D6: refusals are stated in-product **without apology**.
- Swap appends the new car to the plan's lineage; date-based reminders carry over,
  mileage-target reminders retire with the old car (inv.28). The sheet says the first half in
  plain words and the reminder builder handles the second.

### 6.4 The finance payoff nudge — once, ever

```
│  All 48 payments logged. Paid off?       │
│  [ Mark paid off ]        [ Not yet ]    │
```

- Appears **one time** when a finance plan passes its end date without a payoff (inv.29).
- `Mark paid off` → ownership flips to owned, **every record stays**, billing stops, and a
  milestone lands in History (§I use case 6).
- `Not yet` is **persisted and respected** — the nudge never returns. The car form can flip it
  any time. §D6: "'Not now' is honored quietly."
- Not a modal, not a badge, not a red dot. A card on the car page, in the text voice.

### 6.5 Car form — one sheet, add and edit

```
┌──────────────────────────────────────────┐
│ ( Cancel )     Add a car        ( Save ) │
├──────────────────────────────────────────┤
│  Three fields. Everything else can wait. │
│                                          │
│  ▒▒▒▒▒▒                                  │
│  ▒▒▒▒▒▒  ( Add a photo )                 │
│  ▒▒▒▒▒▒                                  │
│                                          │
│  MAKE                MODEL               │
│  [ VW            ]   [ Golf GTI      ]   │
│                                          │
│  FUEL                                    │
│  ((Petrol)) (Diesel) (Electric) (Hy…     │
│                                          │
│  ─────────  everything else  ─────────   │
│                                          │
│  NAME                                    │
│  [ Golf GTI                          ]   │
│  ODOMETER NOW                            │
│  [ 91.240              ] km              │
│  YEAR        PLATE         TANK   POWER  │
│  [ 2019 ]    [1234-ABC]    [50]   [245]  │
│                                          │
│  HOW YOU HAVE IT                         │
│  ( ) Owned outright                      │
│  (•) Financed                            │
│      Lender    [ Bank              ]     │
│      Monthly   [ 289,00        ] €       │
│      Ends      [ 12 / 2026         ]     │
│      ( Mark paid off )                   │
│      Marks it owned, keeps every record, │
│      stops billing. The car page also    │
│      asks once, on its own (§6.4).       │
│  ( ) On a plan                           │
│                                          │
│  Switching keeps every record.           │
│  Nothing to retype.                      │
│                                          │
│  PURCHASE PRICE                          │
│  [ 18.500,00           ] €               │
│  ( Mark as sold )                        │
│                                          │
│  ─────────────────────────────────────   │
│  ( Archive this car )                    │
│  ( Remove this car )                     │
└──────────────────────────────────────────┘
```

| Rule | Detail |
|---|---|
| one sheet, add **and** edit | the same surface; add shows the three-field promise up top, edit opens with everything visible |
| photo | a well at the head of the form, tap → take a photo / choose one / remove; §6.1's warm placeholder is the empty state; downscaled and metadata-stripped at intake, exactly as §10 states for papers (H6) |
| ownership = three radio rows, **unfolding inline** | a sheet never presents a second tall surface (§D1) — so the plan fields expand in place, they do not push |
| `Switching keeps every record. Nothing to retype.` | verbatim §C4. It sits under the radio group, where the fear is |
| purchase price | **hidden entirely for subscriptions** (inv.15). Sits below the radio group because it is a fact about the car, not about which ownership row is selected — Owned and Financed both show it |
| `Mark paid off` | a real control inside the Financed row's unfold, not only a sentence pointing at the car page's own once-only nudge (§6.4). Same consequence either door: ownership flips to owned, every record stays, billing stops, a milestone lands. §I use case 6: "the car form can flip it any time" |
| `Mark as sold` | reveals a `SOLD FOR` amount + sale date beneath purchase price. Available for owned/financed cars (the ones with a purchase price to close against) and creates the `Sold` milestone; §I use case 10: "Set sold price → Ownership ledger closes with 'Sold for −X' and a Net cost total" |
| `On a plan` unfolds | provider, monthly, deposit, cap + period, pooling toggle, dates, included covers, swap interval |
| foot | `Archive` / `Restore` / `Remove`. Remove is `{critical}` and typed-confirmed: "This deletes the car and its records… There is no undo." |
| hard validation | empty make/model; year outside 1950…next; tank outside 10–200 L; power outside 20–2000 hp — **hard stops** (§B2 table) |
| odometer validation | this field is the acquisition **baseline** (`initialOdometerKm`), not a new reading — a new reading is only ever minted by the odometer sheet (§7.6). Monotonicity both directions, and the error **names the conflicting record** and offers to open it (inv.9) |
| dirty guard | the sheet pins: "Discard changes? / Keep editing" (§D1) |

**Delete vs archive, drawn as the two different things they are** (inv.30):

```
  ( Archive this car )              ( Remove this car )
   → kept, restorable                → typed confirmation
   → out of tallies and reminders     → "This deletes the car, its
   → hidden from the all-cars feed       records, reminders and
   → one tap brings its records back     documents. There is no undo."
   → a scoped view always shows them   → [ type: Golf GTI ]
```

» Delete requires the car's **name** understood, not a generic "DELETE" (§I use case 9: "demands
its name understood"). The existing build types the word `delete`; this changes it to the
car's name — §15.2.

---

## 7 · Capture (§C5) — the pen

Article 6 is constitutional: **smart defaults, derive what you can, always lighter than the
competition. A fuel fill logs in under ten seconds.** Everything in this section is measured
against that stopwatch.

### 7.1 The chooser

```
        ┌──────────────────────────────────┐
        │  What are you logging?           │
        │                                  │
        │  ┌────────────────────────────┐  │
        │  │ ▓  Fill-up                 │  │  {fuel}
        │  │    Total, litres, odometer.│  │
        │  └────────────────────────────┘  │
        │                                  │
        │  ┌─────────┐┌─────────┐          │
        │  │▓ Expense││▓ Service│          │  {expense} {service}
        │  └─────────┘└─────────┘          │
        │  ┌─────────┐┌─────────┐          │
        │  │ Odometer││ Trip    │          │  {ink} {ink}
        │  └─────────┘└─────────┘          │
        │  ┌─────────┐                     │
        │  │ Note    │                     │  {ink}
        │  └─────────┘                     │
        └──────────────────────────────────┘
```

- **Fill-up is a hero tile**, the rest a grid — the fill is the 10-second surface and the one
  the calm owner reaches for (§C5).
- **Money tiles wear their domain hue.** Odometer, Trip and Note do not: they are not money
  (§D3).
- This is a **fitted** sheet: parent visible, tap **dismisses it and opens** the real capture
  sheet. That ordering matters — fitted-pick-then-task-sheet keeps exactly one tall layer on
  screen, so it does not violate "never two tall layers" (§D1).
- ⟨ zero cars: `+` skips the chooser and opens the car form (§1.4) ⟩

### 7.2 Fuel capture — the keypad surface

```
┌──────────────────────────────────────────┐
│ ( Discard )      Fill-up         ( Save )│
├──────────────────────────────────────────┤
│  ⟨ ( Golf GTI ▾ ) ⟩                      │
│                                          │
│    TOTAL        LITRES         €/L       │
│  ((68,40 €))  (( 42,10 ))    ( 1,625 )   │
│                              computed    │
│  Enter any two. The third is computed.   │
│                                          │
│  ODOMETER                                │
│  [ 91.240                    ]  km       │
│  +378 km since the last reading.         │
│                                          │
│  (Full tank ✓)  ( Repsol ▾ )  (12 Jul ▾) │
│                                          │
├──────────────────────────────────────────┤
│      1          2          3             │
│      4          5          6             │
│      7          8          9             │
│      ,          0          ⌫             │
└──────────────────────────────────────────┘
```

| Element | Rule |
|---|---|
| three pills | `Total` / `Litres` / `€/L`. The **derived one is visibly marked** (`computed` label + a lighter fill) — it is not a normal field wearing the same clothes (§C5, article 4) |
| the sentence | `Enter any two. The third is computed.` verbatim (§D6 reference string) |
| odometer well | with its **delta hint**: `+378 km since the last reading.` |
| `Full tank` | **default ON** — the common case, and the one that measures |
| station | a menu: recents first, `New station`, `none` |
| date pill | backdatable, **never future** (§C5) |
| keypad | **custom, in-sheet**, with a **locale decimal key** (`,` for es-ES) — the system keyboard cannot be trusted to offer the right separator, and money parsing is a 1000× corruption class (inv.20, §F) |
| `Save` | disabled until **total + litres** exist (entered or computed) |
| car picker | first row, **only when a second car exists** (article 8) |

**The derived-pill state machine** (§C is silent past "enter any two"; this is the honest
reading, **new**):

| Entered | Screen |
|---|---|
| nothing | three empty pills, none marked, `Save` disabled |
| one value | nothing is computable yet; no pill is marked `computed`; `Save` disabled |
| two values | the third computes live and is marked `computed` |
| user edits the `computed` pill | it becomes entered; the **least-recently-edited** of the other two becomes the new `computed` one and recomputes. The rule is "your last two edits win" — predictable, and it never silently discards the number the user just typed |
| user clears a pill | its neighbour that was `computed` stays computed if two values remain; otherwise all marks drop |

Never: rounding a user's typed value to make the third come out even; recomputing a value the
user typed. Every derived value is labelled and no user record is rewritten behind their back
(article 5, and the "silent data mutation" refusal).

**The odometer well's states:**

```
 first reading ever for this car
│  [ 91.240                    ]  km        │
│  Koi will measure from here.              │

 monotonicity break — HARD stop, names the conflict
│  [ 90.100                    ]  km        │
│  A reading on 14 July says 90.828 km.     │
│  ( Open that record )                     │

 soft: a jump over 5.000 km
│  [ 97.400                    ]  km        │
│  +6.160 km since the last reading.        │
│  Does that look right?                    │
│  [ Save anyway ]      [ Go back ]         │

 left empty, full tank on
│  [                           ]  km        │
│  Without an odometer this fill still      │
│  counts. Its litres join the next         │
│  measured interval.                       │

 editing this fill's own reading — its own value never blocks a correction
│  [ 91.180                    ]  km        │
│  Editing a saved reading. Correcting it   │
│  down or up is always allowed here.       │
```

The last one is inv.10: editing a fill's odometer **excludes both the fill's own reading and
its legacy folded twin from validation**, so correcting a mistyped value downward is possible —
without it, saving a fill and then noticing the digit is wrong would be permanently blocked by
the monotonicity check naming the record's own prior value as "the conflict". Every capture
surface reuses this well for edits (§7.3: "edits reuse the same surface prefilled"), so this
exclusion applies wherever the well appears, not only here.

The empty-well one is the honest half of inv.2 and it is the single easiest thing to get wrong:
a full fill with no odometer **saves fine**, contributes its litres to the enclosing full→full
interval, and produces no economy number of its own. The sheet says so at entry rather than
letting the user discover it in a chart.

### 7.3 The saved moment — the app's only spring

```
        ┌──────────────────────────────────┐
        │                                  │
        │                ✓                 │
        │      Saved. Economy computed.    │
        │                                  │
        │           6,9 L/100km            │
        │           over 378 km            │
        │                                  │
        └──────────────────────────────────┘
```

- Auto-dismisses in ~2 s. **Exactly one spring in the app** (§D7), and this is it.
  Reduce-motion gets a fade.
- **Variants**, because the moment must never claim a number it does not have:

| Case | Copy |
|---|---|
| measured | `Saved. Economy computed.` + the number + `over 378 km` |
| first fill / chain not started | `Saved.` + `Two full tanks measure your first number.` |
| partial fill | `Saved.` + `Economy resumes at the next full tank.` |
| full, no odometer | `Saved.` + `Add the odometer to measure this interval.` — the same sentence §8.2's degraded panel uses, since the interval is not lost: the record page offers `( Add the odometer )` on this exact fill |
| missed previous | `Saved.` + `That interval isn't measured.` |
| **an edit** | **no ceremony at all** — saves quietly, sheet closes (§C5: ceremony only for creation) |

- Not a badge, not a streak, not a "nice work". The app never performs enthusiasm
  (constitutional refusal). The spring is for the *record landing*, not for the user's
  behaviour.

### 7.4 Other types — the form sheet

```
┌──────────────────────────────────────────┐
│ ( Discard )      Expense         ( Save )│
├──────────────────────────────────────────┤
│  ⟨ ( Golf GTI ▾ ) ⟩                      │
│                                          │
│  AMOUNT                                  │
│  [ 4,20                      ]  €        │
│                                          │
│  NOTE                                    │
│  [ Parking                           ]   │
│  (Parking) (Toll) (Tax) (Insurance) (…   │
│                                          │
│  DATE                                    │
│  ( 28 July ▾ )                           │
└──────────────────────────────────────────┘
```

- **Preset chips, recents floating first.** Expense: Parking · Toll · Tax · Insurance · Car
  wash · Accessories. Service: Oil & filter · Tyres · Brakes · Inspection · Battery · Wipers.
- A chip **fills the note field and leaves it editable**. There is **no stored category
  taxonomy** — that is a constitutional refusal, and the chips exist because verbose free-text
  notes ruined the ranked cost rows (§F: "free text becomes taxonomy by usage").
- **Service adds an `ODOMETER` field** (§C5). Expense does not.
- Note capture: no amount at all — a note never joins money totals (inv.16), so the field is
  absent rather than optional.

### 7.5 Trip sheet — with its live derivation card

```
┌──────────────────────────────────────────┐
│ ( Discard )        Trip          ( Save )│
├──────────────────────────────────────────┤
│  ⟨ ( Golf GTI ▾ ) ⟩                      │
│                                          │
│  NAME                                    │
│  [ Salou                             ]   │
│  (Salou) (Andorra) (Airport run)         │
│                                          │
│  FROM                  TO                │
│  ( 2 July ▾ )          ( 4 July ▾ )      │
│                                          │
│  START KM              END KM            │
│  [ 90.862      ]       [ 91.094      ]   │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 232 km · ≈20,40 € fuel ·           │  │
│  │ ≈58,00 € all-in — at your averages.│  │
│  │                                    │  │
│  │ Readings are checked against your  │  │
│  │ ledger.                            │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

- `START KM` is **prefilled with the car's current km** (§C5). The user usually only types the
  end.
- The derivation card is **live** — it recomputes as the odometers change, and it is the
  screen's honesty: both figures carry `≈`, both name their basis ("at your averages"), and
  the second line says the readings are validated against the trail.
- Derived km exists only when both are known and `end ≥ start`; `0` means unknown and never
  joins the trail (inv.8) — an unknown end shows the card without a km figure rather than
  showing `0 km`.
- **What the trip sheet refuses:** GPS, background tracking, a timer, per-trip fuel economy,
  average speed. All constitutional refusals — "a trip is a ledger record (two odometer
  readings + a name), not surveillance", and a 13-hour trip showing "57 km/h" is parked-time
  fiction.
- The double-count disclaimer (`Already part of your totals. This is that drive's share.`)
  lives on the trip's **record page** (§8.5), where the number is being read as a total. On the
  capture sheet, `at your averages` is the honest label.

### 7.6 Odometer, Note, and the car picker

```
 odometer sheet — also what the car page's odometer card opens
┌──────────────────────────────────────────┐
│ ( Discard )     Odometer         ( Save )│
├──────────────────────────────────────────┤
│  ⟨ ( Golf GTI ▾ ) ⟩                      │
│  [ 91.240                    ]  km       │
│  +378 km since 12 July.                  │
│  ( 28 July ▾ )                           │
└──────────────────────────────────────────┘

 note sheet
┌──────────────────────────────────────────┐
│ ( Discard )       Note           ( Save )│
├──────────────────────────────────────────┤
│  ⟨ ( Golf GTI ▾ ) ⟩                      │
│  [ Rattle from the near-side front       │
│    wheel over 80 km/h.                ]  │
│  ( 28 July ▾ )                           │
└──────────────────────────────────────────┘

 the car picker — a fitted sheet, reused everywhere
        ┌──────────────────────────────────┐
        │  Which car?                      │
        │  Golf GTI                     ✓  │
        │  Ibiza                           │
        └──────────────────────────────────┘
```

- **One odometer surface, two doors** (Capture → Odometer, and the car page's odometer card).
  The same sheet, prefilled differently. A second implementation of the same task is how the
  two drift apart.
- A **deliberate** manual reading keeps its own ledger row; a reading logged inside a fill or
  trip does not (inv.7). That is the whole difference between this sheet and the fill's
  odometer well, and it is invisible to the user by design.
- The car picker is the **fitted pick** at the bottom of the depth ladder (§1.2) — it applies
  on tap, closes itself, has no Save button, and **does not exist at all on a single-car
  garage** (article 8). §2.9's `late-child` re-enter uses this same picker.

### 7.7 Guards on every capture sheet

| Guard | Behaviour |
|---|---|
| **dirty guard** | the sheet **pins** and asks: `Discard this fill? / Keep editing` (§C5/§D1). Swipe-to-close is disabled while dirty |
| **soft validation** | warn + `Save anyway` / `Go back`: odometer jump > 5.000 km · litres > tank × 1,15 · €/L outside 0,60…3,50 |
| **hard validation** | blocks and **names the conflict**: monotonicity either direction (inv.9) · odometer outside 0…9.999.999 · litres ≤ 0 · amount ≤ 0 |
| **the edit exclusion** | on an edit, the record's own reading and any folded twin are excluded from the monotonicity check (inv.10), so correcting a mistyped odometer value is always possible — the hard stop above applies to *new* readings only |
| **never** | silently fixing anything afterwards (article 5). A soft-confirmed value is saved as typed, not adjusted |
| **money parsing** | locale-safe: `1.234,56` = `1,234.56` = 1234,56, and grouping-only `20.000` is 20000, never 20,0 (inv.20) |
| **hard error styling** | the message is `{critical}` **text**; the surface never turns red (§D7) |

» Validation runs client-side with the **same pure functions the server runs on upload**
(`@koi/domain`) — the architecture's "flag, never fix" posture means the server would accept
and flag a bad write, so refusing it here is what keeps the user's own device honest without
repairing anything silently. This is already true in the build for odometer readings
(`checkOdometerReading`), and every new capture surface inherits it.

---

## 8 · Record pages (§C6)

Article 1: everything recorded is **visible, inspectable, editable, deletable, exportable**.
Article 4: **show the math.** These pages are where both articles are cashed in.

### 8.1 The shape, and which kinds get a Computed panel

```
 icon + title + date  →  fact rows  →  ⟨ COMPUTED ⟩  →  ⟨ reliability footer ⟩  →  delete
```

| Kind | Computed panel | Contains |
|---|---|---|
| Fuel | **always** | economy or the honest reason there is none, the basis line, the verdict, the chain footer |
| Trip | **always** | derived km + both `≈` costs + the double-count disclaimer |
| Odometer | **always** | delta since the previous **trail** reading, and the source |
| Service / Expense | only when an odometer is attached | the delta alone |
| Note | never | there is nothing to derive (and no amount — inv.16) |
| Milestone | n/a | opens as a **glance sheet**, not a page (§8.6) |

**Refused, deliberately:** a "part of June's 534,10 €" line on any record page. That turns a
record into a lens and gives one figure two homes, which is the exact ambiguity §D2 exists to
prevent. (**new** — the temptation is real and it should be written down as refused.)

» `(pencil)` opens the capture surface prefilled and saves **quietly** (§C5). Delete is a
destructive footer row — `{critical}` text, 44 pt, hard to hit by accident — always confirmed,
always undoable from its toast (inv.31).

### 8.2 Fuel — the flagship

```
┌──────────────────────────────────────────┐
│ ‹ History                       (pencil) │
│                                          │
│  ▓ Repsol Tarragona                      │
│  12 July 2026 · Golf GTI                 │
│                                          │
│  35,75 €                                 │
│                                          │
│  Litres                    22,00 L       │
│  Price                    1,625 €/L      │
│  Odometer                 91.240 km      │
│  Full tank                      yes      │
│                                          │
│  COMPUTED                                │
│  6,9 L/100km                             │
│  26,10 L over 378 km · since the         │
│  12 Jun fill                             │
│  About your usual 6,85.                  │
│  Includes this fill and 1 partial        │
│  before it.                              │
│                                          │
│  4 full fills in a row.                  │
│  Economy is reliable.                    │
│                                          │
│  ( Delete this fill )                    │
├──────────────────────────────────────────┤
│   Home    ▪History   Insights   Garage   │
└──────────────────────────────────────────┘
```

Four things in the Computed panel, in this order, each with a job:

1. **the number**, in the display + data voice;
2. **the basis** — `26,10 L over 378 km · since the 12 Jun fill`, in §C6's own shape. The litres
   figure is the **interval's**, not this fill's, which is why a fact row can honestly read
   `22,00 L` while the basis reads `26,10 L`;
3. **the composition line** when the interval is not just this fill —
   `Includes this fill and 1 partial before it.` (**new**; without it the two litre figures
   look like a bug, and article 4 is the reason to spend the line);
4. **the verdict**, in words: `About your usual 6,85.` / `Better than your usual 6,85.` /
   `More than your usual 6,85.` — thresholds reuse inv.4's **±5% dead band** so the record page
   and the fuel lens can never disagree about what "usual" means. First measured value gets
   `Your first measured tank.` and no comparison.

**Degraded panels. Same layout, same weight, never red** — missing data is not an error
(§D5/§D7):

```
 partial fill
│  COMPUTED                                │
│  Not measured                            │
│  This fill is partial. Economy resumes   │
│  at the next full tank.                  │
│  Its 22,00 L count towards the next      │
│  measured interval.                      │

 a fill was missed before this one
│  COMPUTED                                │
│  Not measured                            │
│  A fill was missed before this one.      │
│  Koi doesn't guess an interval it can't  │
│  see.                                    │

 full tank, no odometer
│  COMPUTED                                │
│  Not measured                            │
│  Add the odometer to measure this        │
│  interval.                               │
│  ( Add the odometer )                    │

 chain has not started yet
│  COMPUTED                                │
│  Not measured yet                        │
│  Two full tanks with odometers measure   │
│  your first number.                      │
│  ● ○                                     │

 money-only fill (import)
│  COMPUTED                                │
│  Not measured                            │
│  This fill came in without litres, so    │
│  it counts as money only.                │
```

- The first three sentences are **§C6 verbatim**. The last two are **new** and are needed: the
  domain returns no number for a chain start or a `deltaKm ≤ 0`, and the importer deliberately
  keeps money-only fills (§B3), so both states will occur on real data (§F: "real imported data
  is hostile").
- The reliability footer always tells the truth about the chain: `4 full fills in a row.
  Economy is reliable.` / `18 of 21 full. Averages shown as ≈.`

**Delete confirmation, and the third thing it must say:**

```
        ┌──────────────────────────────────┐
        │  Delete this fill?               │
        │                                  │
        │  It leaves History and your       │
        │  averages, and the next fill's    │
        │  interval is measured again.       │
        │                                  │
        │  [ Keep it ]        [ Delete ]    │
        └──────────────────────────────────┘
```

§I use case 9 requires the first two clauses. The third is **new** and it matters: deleting a
fill silently re-measures the *following* fill's interval, so a number on a record the user
never touched changes. Saying so is the difference between a derivation and a silent mutation
(article 5).

» **Editing** the full/partial flag or the odometer reshapes neighbouring intervals the same
way. Decision: **no toast** — the panel and the footer update in place, and the change was the
user's own act. A toast here would imply Koi did something behind their back.

### 8.3 Expense, service, note

```
┌──────────────────────────────────────────┐
│ ‹ History                       (pencil) │
│  ▓ Oil & filter                          │
│  8 July 2026 · Golf GTI                  │
│                                          │
│  96,50 €                                 │
│                                          │
│  Note        Oil & filter, Talleres Puig │
│  Odometer               90.980 km        │
│                                          │
│  COMPUTED                                │
│  +118 km since the 4 July reading.       │
│                                          │
│  ( Delete this service )                 │
└──────────────────────────────────────────┘
```

- The amount is the **headline** for money kinds — the ledger row the user tapped led with that
  number, and the page should confirm it, not bury it in a table.
- A note record has no amount and says so where a reader would look for one:
  `Note · not counted in totals` (inv.16 made visible rather than merely obeyed).

### 8.4 Odometer

```
│  ▓ 90.862 km                             │
│  4 July 2026 · Golf GTI                  │
│                                          │
│  Source                     manual       │
│                                          │
│  COMPUTED                                │
│  +212 km since the 24 June reading.      │
│  21,2 km/day over that stretch.          │
```

- `Source` is `manual` or `imported` (§C6). A reading **folded** into a fill or a trip has no
  page of its own and no ledger row — it is inspected on the fill's page (inv.7). Stating the
  rule: **the odometer record page exists for `manual` and `imported` sources only.**
- The delta's neighbour is the previous **trail** reading, matching capture's
  `+378 km since the last reading.` — anything else makes two surfaces disagree about "the last
  reading".

### 8.5 Trip

```
│  ▓ Salou                                 │
│  2 – 4 July 2026 · Golf GTI              │
│                                          │
│  232 km                                  │
│                                          │
│  Start                    90.862 km      │
│  End                      91.094 km      │
│  Note              Weekend with the kids │
│                                          │
│  COMPUTED                                │
│  ≈20,40 € fuel · ≈58,00 € all-in         │
│  At your lifetime 0,088 €/km fuel and    │
│  0,25 €/km running rate.                 │
│                                          │
│  Already part of your totals. This is    │
│  that drive's share.                     │
│                                          │
│  ( Delete this trip )                    │
```

- The headline is **km**, not money — a trip is a distance record (inv.17).
- The disclaimer is **§C6/§B2-17 verbatim** and it is the whole reason the page exists.
- ⟨ no end reading (`endKm = 0`, legal per §B1): `232 km` becomes `No distance yet`, the ≈costs
  are absent entirely, and the page says `Add the end reading to measure this drive.` — never
  `0 km` (inv.8) ⟩
- §B1's `Trip.note` gets a fact row here **and a field in the trip sheet** (§7.5): a persisted
  field with no door is unreachable data, and the importer writes into it.

### 8.6 Milestones — a glance sheet, not a page

```
        ┌──────────────────────────────────┐
        │  ▓ Insurance renewed             │
        │  17 June 2026                    │
        │                                  │
        │  Mapfre · 412,00 €               │
        │  +14 € vs last year              │
        │                                  │
        │  Milestones can't be edited.     │
        │                                  │
        │  Open the policy ›               │
        └──────────────────────────────────┘
```

- A **fitted** sheet (§D1's "fits pick" class), because there is nothing to do here — no edit,
  no delete, no swipe in History either.
- `Milestones can't be edited.` verbatim (§C6). §D6: refusals are stated without apology.
- One trailing row where a real record stands behind the milestone (`Open the policy ›`,
  `Open the car ›`), none otherwise. **Refused:** jumping from a fitted sheet to another tab —
  it would leave the user in a stack they did not build.
- **The milestone set, fixed at eight** (§B1 names three, §I implies more; enumerating them is
  a wireframe obligation because History must render every one): `Tracking began` · `Bought` ·
  `Joined a plan` · `Swapped car` · `Insurance renewed` (variant: `Switched insurer`) ·
  `Paid off` · `Sold` · `Archived`. **Not** a milestone: an import — that is an app event, and
  §B3 already gives it its own import moment.

### 8.7 An open flag on a record

The review queue's `open-record` action needs somewhere to land, and §C6 never says where a
flag shows on the record it is about:

```
│  ▓ 91.240 km                             │
│  12 July 2026 · Golf GTI                 │
│                                          │
│  ▪ This reading needs a look ›           │   {attention} glyph, ink text
│                                          │
│  Source                     manual       │
```

One quiet row above the fact rows. No banner, no red, no count. Without it, "Open the record"
opens a page that shows nothing wrong — and inv.12's "flagged for user review, never
auto-fixed" loses its anchor in the ledger.

---

## 9 · Reminders (§C7)

### 9.1 The list

```
┌──────────────────────────────────────────┐
│ ‹ Home        Reminders             (+)  │
│                                          │
│  UPCOMING                                │
│  ▓ ITV                    12 days over › │
│    Inspection · Golf GTI                 │
│  ▓ Insurance renewal      in 16 days  ›  │
│    Mapfre · Golf GTI                     │
│  ▓ 1.240/1.500 km this cycle          ›  │
│    Cap · Golf GTI                        │
│                                          │
│  LATER                                   │
│  ▓ Oil & filter           in 2 months ›  │
│    Service · Golf GTI                    │
│  ▓ 100.000 km          around November › │
│    Service · Golf GTI                    │
│                                          │
│  DONE · 14                          ⌄    │
│                                          │
└──────────────────────────────────────────┘
```

| Rule | Detail |
|---|---|
| three sections | `Upcoming` / `Later` / `Done` (§C7) |
| the boundary | **`Upcoming` = the reminder's own earliest advance-alert window is open** (today ≥ due − max(advanceAlertDays)); `Later` = the window has not opened. It invents no number and reuses the user's own alert configuration (**new**; §C7 never defines it). This is the list's *own* boundary, independent of Home's — a reminder with only a 1-day alert selected legitimately sits in this list's `Later` until the day before it is due, which is exactly why Home's `All clear` (§2.1) uses a fixed 28-day floor of its own rather than this window: a boundary that can shrink to one day must never decide whether Home is allowed to say "quiet" |
| km rules | phrased by predicted time at the user's real pace — `around November` — **never** as frozen remaining-km (inv.33) |
| overdue | `12 days over` in `{attention}`. Km-triggered overshoot reads `1.240 km over` — stating a passed fact is not a prediction, so inv.33 does not apply |
| **cap reminders** | synthesized live from the plan, never stored, follow swaps automatically, quiet for 7 days after any odometer update (inv.27). They are **read-only**: no Done, no Snooze, no Delete, **no detail page** — the row pushes the **car page**, where the gauge lives. A read-only detail could only restate the gauge, and two surfaces telling one truth is what §C4 already warns against |
| caps never drive Home | a cap never becomes Home's `Needs you` hero and never sets the state: `mileageCap` never notifies by design, and §I use case 3 insists "nothing flashes". Over-cap surfaces in the Garage chip and the car page gauge (inv.26) |
| `Done` | collapsed behind its count, expanding to the last 12 months, then `Show older` — otherwise it becomes a graveyard |
| no car-scope chip | rows carry the car name. History's chip exists because History is a tab-level ledger; a list that is usually under ten rows does not need a control |
| where it lives | pushed from Home's `All ›` and from the car page's Care group |

### 9.2 The builder — the contract is a sentence

```
┌──────────────────────────────────────────┐
│ ( Cancel )     New reminder      ( Save )│
├──────────────────────────────────────────┤
│  KIND                                    │
│  ((Inspection)) (Service) (Insurance)    │
│                                          │
│  TITLE                                   │
│  [ ITV                               ]   │
│                                          │
│  ⟨ CAR    ( Golf GTI ▾ ) ⟩               │
│                                          │
│  DUE                                     │
│  ( 14 March 2027 ▾ )                     │
│  ( 55.000 km )                           │
│  Whichever comes first.                  │
│                                          │
│  REPEAT                                  │
│  (never) ((every year)) (every 6 months) │
│  (every 2 years) (every 10.000 km)       │
│  (year or 10.000 km) (custom…)           │
│                                          │
│  ALERTS                                  │
│  (90) ((60)) ((30)) (14) ((7)) (1)       │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ ITV, every year, alerts 60, 30 and │  │
│  │ 7 days before.                     │  │
│  │                                    │  │
│  │ 55.000 km lands around November    │  │
│  │ at your pace.                      │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

- **The live plain-words card is the point of the screen.** Every control above it edits one
  clause of a sentence the user can read back. §C7's own example string is drawn verbatim.
- The `CAR` row is conditional like every other car picker in this document — it renders
  **only when a second unarchived car exists** (article 8); with one car the reminder takes it
  implicitly and the row does not appear at all.
- The pace line appears only for km rules and is the same phrasing inv.33 requires everywhere.
- **Zero alerts selected is legal** (§B1 allows it) and the card says so plainly:
  `ITV, every year, no alerts.` A date-only reminder the user checks in-app is consistent with
  inv.34's "the schedule still lives in the app".
- `custom…` unfolds **inline** to `every N months` / `every N km` — a sheet never presents
  another tall surface (§D1).
- A km target **behind** the current odometer is a **soft** confirm, not a hard stop
  (**new** — §B2's table is silent, and a deliberately-behind target is how a user schedules a
  catch-up).

### 9.3 The detail

```
┌──────────────────────────────────────────┐
│ ‹ Reminders          ITV        (pencil) │
│                                          │
│  ▓ ITV                                   │
│  Inspection · Golf GTI                   │
│                                          │
│  55.000 km or 14 Mar — whichever         │
│  comes first                             │
│  Around November at your pace.           │
│                                          │
│  RULE                                    │
│  Repeats            every year           │
│  Anchor             every year from      │
│                     14 March             │
│  Alerts             60, 30 and 7 days    │
│                     before               │
│                                          │
│  [ Done ]   [ Snooze +7 ]   ( Delete )   │
│                                          │
│  Done creates the next one from the      │
│  rule.                                   │
└──────────────────────────────────────────┘
```

- The due card and `Done creates the next one from the rule.` are §C7 verbatim.
- **The `Anchor` row is new and it earns its space**: inv.32 promises that a lapsed yearly
  catches up from the *original* anchor and that a 31st anchor never decays. Without a row
  stating the anchor, neither promise is verifiable by the user — and article 4 says show the
  math.
- `Snooze` is **+7 days, one option, no picker** (§C1's own value). A fitted snooze menu would
  spend the depth budget on the least-used action.
- Done → toast: `Done. Next one created for 14 March 2027.` Undoable (§C1/§D7).
- **Refused:** a per-reminder occurrence history. Linking a resolved occurrence to the one it
  created needs a column, and architecture is LOCKED. The Done toast names the next date and
  the `Done` section carries completed occurrences — that is the whole record.

### 9.4 The notification pre-prompt — after the first reminder, not before

```
        ┌──────────────────────────────────┐
        │  Want Koi to tell you?           │
        │                                  │
        │  Koi can post an alert on this    │
        │  device before something is due.  │
        │  It never leaves the phone.       │
        │                                  │
        │  [ Not now ]     [[ Turn on ]]    │
        └──────────────────────────────────┘
```

- Requested **only after the user creates their first reminder** (inv.34), behind this
  explanatory pre-prompt, and `Not now` is **honored quietly** — the schedule still lives in the
  app.
- **Ordering constraint, not a nicety:** the builder is a tall sheet and §D1 forbids a sheet
  presenting another. So the sequence is `Save → sheet dismisses → toast → this fitted
  pre-prompt on the list`.

### 9.5 Notifications settings (§C7's second half, reached from Settings)

```
┌──────────────────────────────────────────┐
│ ‹ Settings      Notifications            │
│                                          │
│  DELIVERY                                │
│  ( Right away )  (( Morning digest ))    │
│  One note at 9:00 with the day's alerts. │
│                                          │
│  WHAT TO SEND                            │
│  Reminders                          [on] │
│  Milestone anniversaries           [off] │
│                                          │
│  YOUR NEXT ALERT                         │
│  ┌────────────────────────────────────┐  │
│  │ 17 August, 9:00                    │  │
│  │ Insurance renewal · Golf GTI        │ │
│  │ Renews 16 September.                │ │
│  └────────────────────────────────────┘  │
│                                          │
│  Koi schedules alerts on this device.    │
└──────────────────────────────────────────┘
```

- **The preview card shows the user's own next alert**, not a fake sample (§C7, §D5: sample data
  marks itself, so the honest move is to use real data).
- Milestone anniversaries **off by default** (§C7).
- ⟨ permission denied: the whole page keeps working (the schedule lives in the app) and gains
  **one** quiet row — `Turn on in iOS Settings ›`. Once. No nagging (inv.34, §D6) ⟩
- Copy: `Koi schedules alerts on this device.` — **not** "Koi has no server". §C7's original
  framing predates sync; a device with sync on does talk to a server the user runs, and
  sync-state-dependent privacy claims belong on the release-gated privacy page (bucket F), not
  here.
- A **single-alert** tap deep-links to the reminder's page with Back landing on Home (§C7/§D1).
  A **digest** tap has no single target, so it lands on the **reminders list** (Back → Home) —
  drawn here because §C7's deep-link sentence cannot be honoured by a bundled note.

---

## 10 · Insurance and papers (§C8's vault)

**Naming decision:** the page is titled **"Insurance & papers"**. "Vault" is internal
vocabulary and appears nowhere in §C8's own copy; §D6 is plain language, and the product is
already spending one new coinage on "lens" (Appendix 2 #3). `vault` stays the internal name.

**One door, not two.** §C4's Care group lists both "insurance → vault" and "documents", while
§C8 puts Papers *inside* the vault. Two rows to one page is a nav smell, so the car page carries
one row with a meta line that does the second row's job:
`▓ Insurance & papers  ·  Renews 17 Jul · 3 papers  ›`

```
┌──────────────────────────────────────────┐
│ ‹ Golf GTI    Insurance & papers (pencil)│
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Mapfre                             │  │
│  │ Policy 0084-221-9                  │  │
│  │ Third party, fire and theft        │  │
│  │                                    │  │
│  │ Premium              412,00 €      │  │
│  │ vs last year          +14,00 €     │  │
│  │ Valid until            17 Jul 2026 │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Renews 17 Jul. Most policies roll  │  │
│  │ over automatically.                │  │
│  │                                    │  │
│  │ [ Renewed ]  [ Switched insurer ]  │  │
│  │ ( It lapsed )                      │  │
│  └────────────────────────────────────┘  │
│                                          │
│  PAPERS                                  │
│  ▓ Registration                       ›  │
│  ▓ Insurance policy 2025              ›  │
│  ( Add a paper )                         │
└──────────────────────────────────────────┘
```

| Rule | Detail |
|---|---|
| facts only | insurer, policy number, coverage, premium + trend, valid-until. **Gaps say `not on file`** — never invented (§D5) |
| renewal card | appears when ≤30 days out. Copy verbatim: `Renews 17 Jul. Most policies roll over automatically.` |
| `Renewed` | unfolds an inline premium field with `Leave it empty if the price didn't change.`; rolls the dates forward a year and **re-arms the reminder** |
| `Switched insurer` | opens the edit form prefilled; the trend label stays strictly **"vs last year"** (true either way) rather than becoming "vs last policy" |
| `It lapsed` | **new**, and needed: §C8 offers only two outcomes, so a genuinely lapsed policy could only be recorded as a fake renewal. This is the honest third answer |
| after the date | the card's first line becomes `Cover ran to 17 Jul. Most policies roll over automatically.` (**new** — §C8 gives only the pre-date string, §I5 implies the post-date one) |
| papers | kind + title only. §B1's `Document` has no created-at, size or page count, so an "Added 12 Jun" line would be invented data on the one surface whose whole rule is never to invent. Filed as a later additive-optional field |
| at intake | images are downscaled and metadata-stripped (H6) |
| papers' destination | `( Add a paper )` opens a **fitted** picker (Take a photo · Scan · Choose a file) that hands off to one form for kind + title. Each row pushes a viewer for its image/PDF, kind and title editable via `(pencil)`, Delete confirmed and undoable (inv.31) — a document that can be created but never inspected or removed except by deleting the whole car would fail article 1 |
| the header `(pencil)` | opens the same edit form `Switched insurer` uses, prefilled — the one door that creates or edits the policy's own facts |
| empty | `No papers yet. Add your registration or a policy PDF.` — an honest affordance, not an apology |

**No policy on file — a state this section owes and had not drawn.** A newly added car has no
`InsurancePolicy` row, and §C8 says gaps say "not on file", never invented — but a car with
*no* policy at all is a different state from a policy with some fields missing, and it needs a
door in, not just a blank field:

```
│  No insurance on file.                   │
│  ( Add your policy )                     │
```

`( Add your policy )` opens the same form the header `(pencil)` and `Switched insurer` both
use. The car page's Care row reflects it honestly too: `▓ Insurance & papers · No policy on
file · 3 papers ›` — so §I use case 5 ("Renewal without a nag") has a starting point for a car
that has never had a policy entered, not only for one whose policy is renewing.

**Premium's money status, decided:** a premium is a **fact, never a charge** — the inv.15
purchase-price pattern. It enters no cost total, no €/km and no cost-structure row. Insurance
reaches the money surfaces only when the user logs it as an expense or it rides a plan's
`includesInsurance`. Without this rule the same money is one edit away from being counted twice.
Recorded in spec-delta.

---

## 11 · Onboarding (§C8)

Three beats, **all skippable**.

```
 beat 1 — the value line          beat 2 — add a car             beat 3 — one suggestion
┌──────────────────────┐         ┌──────────────────────┐        ┌────────────────────── ┐
│                      │         │  Add your car         │        │  One reminder to     │
│    [ koi mark ]      │         │                      │        │  start?               │
│                      │         │  Three fields.        │        │                      │
│  Koi keeps your      │         │  Everything else can  │        │  Spain's ITV         │
│  car's story.        │         │  wait.                │        │  inspection is due   │
│  Fills, services     │         │                      │        │  every year for cars  │
│  and reminders.      │         │  MAKE  [ VW       ]   │        │  over four years old.│
│  Computed honestly,  │         │  MODEL [ Golf GTI ]   │        │                      │
│  kept on your phone. │         │  FUEL  ((Petrol))…    │        │  [[ Add it ]]        │
│                      │         │                      │        │  ( No thanks )        │
│  [[ Start ]]         │         │  [[ Save ]]           │        │                      │
│  ( Skip )            │         │  ( Import from MyCar )│        │                      │
│                      │         │  ( Skip )             │        │                      │
└──────────────────────┘         └──────────────────────┘        └────────────────────── ┘
```

- Beat 1's copy is **§C8 verbatim**.
- **The three fields are make / model / fuel type** (**new** — §C8 says "three fields" without
  naming them; this matches what the build already ships). Fuel type is load-bearing for economy
  and for which reminders make sense, and the odometer arrives free with the first fill (§I1).
- The **MyCar import door** lives on beat 2 (§C8).
- Beat 3 is offered **once, never again** — and it is anchored to **"the first car exists"**, not
  to "onboarding ran". Otherwise a user who skips beat 2 burns the suggestion unshown, because a
  reminder needs a `carID`. So it fires after beat 2, after an import, or after a later Garage
  add-car — whichever happens first, exactly once (**new**; §C8's "offered once, never again" has
  this hole).
- **What is deliberately NOT in onboarding: sync, accounts, passkeys.** Sync is opt-in from
  Settings only. Putting an account concept in beat one would contradict the product's
  local-first default (D-006's floor: "app fully functional local-only with no account") and
  would be a bigger, earlier commitment to accounts than anything asks for. This is the same
  reasoning Session 6 used to put sign-in inline with the sync toggle, carried forward.
- **A signed-in second device with no records yet** must not be told "Add your car to begin" —
  that invites the duplicate-car outcome D-052 scenario B already documents as honest-but-unwanted.
  When `syncEnabled && !hasSynced`, the zero-car copy reads `Waiting for your records to arrive.`
  (**new**, and the cheapest possible prevention of a conflict the architecture deliberately will
  not auto-resolve.)

---

## 12 · Settings (§C8) — and where sync + account actually live (R2)

Settings is **one task sheet** with its **own internal push stack**: currency, notifications,
sync, import and privacy push *inside* the sheet, back-only, and swipe-to-close is disabled while
pushed (§D1). **Units is not a push** — §12.6 draws it as a fitted pick, matching §D1's own list
("unit pickers" among the fits-pick class), so it fits and closes itself in place, same as
`Appearance`. Nothing here presents a second tall surface.

### 12.1 The sheet

```
┌──────────────────────────────────────────┐
│ ( Done )        Settings                 │
├──────────────────────────────────────────┤
│  ┌────────────────────────────────────┐  │
│  │ Your data never leaves this device.│  │
│  │ No account, cloud sync or          │  │
│  │ analytics. Export any time.        │  │
│  │                        Privacy ›   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Appearance             ( System ▾ )     │
│  Units                    ( km · L ▾ )   │
│  Currency                   EUR     ›    │
│  Notifications                      ›    │
│                                          │
│  Sync                       Off     ›    │
│  Review notes                 2     ›    │
│                                          │
│  Import from MyCar                  ›    │
│  Export JSON                        ›    │
│  Export CSV                         ›    │
│                                          │
│  ( Erase everything )                    │
│                                          │
│  Koi 0.1.0 (1)                           │
└──────────────────────────────────────────┘
```

**Row order, and why.** Privacy card first (§C8 says "up top"). Then how the app reads
(appearance, units, currency, notifications). Then **this device and your records** — `Sync` and
`Review notes`, together because both are about records arriving from elsewhere. Then data out
(import, export). Then the destructive act, alone, at the foot. Then a faint version row
(**new**: with no analytics and no crash reporting, the user is the only telemetry channel, so
give them the build number).

- **`Review notes`** is R1's second, always-present door: it shows a count when the queue has
  open items and `None waiting` when it does not, and it pushes the same queue page Home pushes.
  This is what keeps resolved items reachable after Home has stopped rendering the entrance.
- **`Appearance`** is R3's slot: `System / Light / Dark`, a fitted picker. **It ships in the same
  increment as the authored dark palette, not before** — a Dark option that selects a palette
  nobody drew is worse than no control, and §D3 explicitly forbids the inversion-pass shortcut
  that would be the tempting fix.

### 12.2 The privacy card, in all three states

**Keyed on "has this device ever synced", not on the toggle.** Turning sync off is a pause
(spec-delta / D-052: "nothing already sent is clawed back"), not an erase — the founding passkey
and the owner's server-side records both outlive it. A card keyed on the toggle alone would print
"No account, cloud sync or analytics" to a device that has both, which is exactly the promise §H1
calls product law: "Every feature must keep these sentences true — they are product law, not
marketing." So there are three states, not two, and the middle one — sync off, after having synced
— is the one a real user reaches every time they pause sync.

```
 never synced (the default)                 syncing
┌────────────────────────────────────┐    ┌────────────────────────────────────┐
│ Your data never leaves this device.│    │ No ads, trackers or analytics.     │
│ No account, cloud sync or          │    │ Export any time.                   │
│ analytics. Export any time.        │    │                                    │
│                                    │    │ This device syncs to your own      │
│                        Privacy ›   │    │ server, so your other devices see  │
└────────────────────────────────────┘    │ the same records. It never leaves  │
                                          │ servers you run.                   │
   §C8 verbatim — still true              │                        Privacy ›   │
                                          └────────────────────────────────────┘
                                             spec-delta's exact sync-on wording,
                                             plus the claims that never stopped
                                             being true

 paused (has synced before, sync now off)
┌────────────────────────────────────┐
│ No ads, trackers or analytics.     │
│ Export any time.                   │
│                                    │
│ Sync is paused. Records you        │
│ already sent are still on your     │
│ server.                            │
│                        Privacy ›   │
└────────────────────────────────────┘
   the state a user reaches every time
   they turn sync back off — never
   "never leaves this device", never
   "no account"
```

Four rules this card obeys, and one thing it must not do:

1. **Never-synced is §C8 verbatim** and is still literally true of a device that has not turned
   sync on — this is the only state where "never leaves this device" and "no account" are honest.
2. **Syncing is spec-delta's own wording, unchanged** — it says *where* data goes (a server the
   user runs) and deliberately claims nothing more.
3. **Paused drops both claims that stop being true the moment an account exists, and states the
   fact instead.** A local wipe on this device does not touch what already reached the server
   (§12.7), so "no account, cloud sync" would be false and "never leaves this device" would be
   false about every record sent before the pause. The card never re-earns those two sentences
   once an account has been created — not on this device, not by turning sync off, not ever
   (short of the S-7 erase-everywhere this build does not have).
4. **The always-true claims survive every switch.** Session 5's card dropped "no account, cloud
   sync or analytics" wholesale the moment sync came on, which let a user infer that analytics
   might now exist. D-006's floor — no ads, no trackers, no analytics, free complete export, sync
   strictly opt-in — is true in *all three* states, so it gets its own line and never leaves.
   (**This is a change to what the build ships today**, and the reason to make it in a wireframe
   pass rather than in code.)
5. **`Privacy ›` pushes the release-gated privacy page, which this pass does not write.** Its
   rewrite is bucket F (⛔, before any sync ships) and carries obligations this card must not
   pre-empt: drop the no-account claim, state that an operator can read server-side data, disclose
   Safari ITP, say the web needs sync (D-023, D-016). Nothing on this card claims otherwise, and
   nothing on this card is the page.

### 12.3 Sync (pushed inside the sheet)

**Naming decision:** the row and page are called **`Sync`**, not "Sync & devices". There is no
device registry — only *this* device's id — and a title promising a device list Koi cannot produce
is a §D5 violation in the one surface whose whole job is trustworthiness. It can be renamed the
day a registry exists.

```
 never synced — the default                 syncing
┌──────────────────────────────────────┐   ┌──────────────────────────────────────┐
│ ‹ Settings         Sync              │   │ ‹ Settings         Sync              │
│                                      │   │                                      │
│  Your data never leaves this device. │   │  This device syncs to your own       │
│  No account, cloud sync or           │   │  server, so your other devices see   │
│  analytics.                          │   │  the same records. It never leaves   │
│                                      │   │  servers you run.                    │
│  [[ Turn on sync ]]                  │   │                                      │
│                                      │   │  Status              Syncing         │
│  Turning sync on signs you in with   │   │  Waiting to send     3 changes       │
│  a passkey — Koi creates one on      │   │  First sync          done            │
│  your first device and reuses it on  │   │                                      │
│  the others. Your phone asks for     │   │  Recovery codes                  ›   │
│  Face ID; the very first device      │   │                                      │
│  asks twice.                         │   │  ( Turn off sync )                   │
│                                      │   │                                      │
│  THIS DEVICE                         │   │  THIS DEVICE                         │
│  iPhone · a1b2c3                     │   │  iPhone · a1b2c3                     │
└──────────────────────────────────────┘   └──────────────────────────────────────┘

 paused — has synced before, sync now off
┌──────────────────────────────────────┐
│ ‹ Settings         Sync              │
│                                      │
│  Sync is paused. Records you already │
│  sent are still on your server.      │
│                                      │
│  [[ Turn sync back on ]]             │
│                                      │
│  Recovery codes                  ›   │
│                                      │
│  THIS DEVICE                         │
│  iPhone · a1b2c3                     │
└──────────────────────────────────────┘
```

| Element | Decision |
|---|---|
| **"Turn on sync" IS the sign-in step** | no separate account screen; the passkey ceremony is a native OS sheet, so from Koi's point of view this is one tap with a system prompt in the middle (spec-delta, Session 6). Unchanged by this pass — only relocated out of the garage |
| **the never-synced explanatory sentence covers both outcomes** | a local-only device makes zero network calls, so it cannot know whether it is about to register the founding passkey or sign in with one that already exists elsewhere (D-053: registration is refused server-side after the first). The copy promises neither outcome specifically and states the one fact that is always true — the first device ever to sync sees two Face ID prompts, every device after that sees one |
| **the paused state never re-explains Face ID** | this device already has a working passkey; turning sync back on is a plain sign-in, one prompt, so the two-prompt sentence belongs only to the never-synced state |
| **no pending count in the never-synced state** | today's build reads `ps_crud` and calls it "N records kept here so far" — but `ps_crud` is an upload *queue*, so a created-then-edited record counts twice and the line over-reports. §D5: sums that would lie are withheld. This state shows **no number**; a count only means something once there is a server to reach |
| **`Waiting to send`** | the honest phrasing, from the queue helper that already exists (`pendingUploadCount`), not raw SQL |
| **the device id** | `iPhone · a1b2c3` (OS device name + last 6 of the id), tap to copy the full value. A bare UUID in a user surface does the id's one job — letting a human match a device to a line — worse than a short alias |
| **turning off** | no confirmation either direction (enabling costs nothing undoable; disabling only pauses future uploads). Toast: `Sync paused. Records already sent stay on the server.` (spec-delta / D-052) — and the page the toast leaves behind is the paused state above, not the never-synced one |
| **failure** | `Not syncing: your server didn't answer. Your records are safe on this device.` — a sentence, not a raw error string, and **no badge anywhere in the shell**. Accepted consequence, recorded rather than smuggled around: a user whose sync has been broken for days finds out on a visit here. A dot on every root would nag from four places about something the car does not need from them |

### 12.4 Recovery codes

```
 the one-time reveal (right after the founding passkey)     later, from Sync
┌──────────────────────────────────────┐            ┌──────────────────────────────────────┐
│ Save your recovery codes             │            │ ‹ Sync      Recovery codes           │
│                                      │            │                                      │
│ If you lose access to every device   │            │  10 codes were created on 28 July.   │
│ with your passkey, one of these      │            │  Koi cannot show them again.         │
│ codes gets you back in. Each works   │            │                                      │
│ once. Koi shows them only this one   │            │  ( Create new codes )                │
│ time.                                │            │  The old ones stop working.          │
│                                      │            │                                      │
│  4KJ2-9QW7-XM3D                      │            └──────────────────────────────────────┘
│  8TZP-1LRV-C6HB                      │
│  … 8 more …                          │
│                                      │
│ [[ I've saved these ]]               │
└──────────────────────────────────────┘
```

- The reveal's copy is **exactly what the build already ships** and moves intact — it is the one
  genuinely new screen Session 6 needed, and this pass only changes where it lives (Settings ›
  Sync, not the garage).
- Codes are mono, tabular, selectable. No screenshot nag, no "copy to clipboard" as the primary
  action.

### 12.5 Using a recovery code — **NOT BUILT** (D-054)

```
┌──────────────────────────────────────┐
│ ‹ Sync      Use a recovery code       │      ⚠ WIREFRAME ONLY — no client
│                                      │        screen exists. Proven
│  Enter one of the codes Koi showed    │        server-side only (D-054).
│  you when you turned sync on.        │
│                                      │
│  [ 4KJ2-9QW7-XM3D              ]     │
│                                      │
│  [[ Sign in ]]                       │
│                                      │
│  Each code works once.               │
└──────────────────────────────────────┘
```

**Placement decided:** a push off `Sync`, reached **only** from the failed-sign-in banner — not
an always-present row. An always-visible "enter a recovery code" invites people to burn one-use
codes they do not need. Until the screen exists, the banner states the dead end plainly:
`This device has no passkey for your account, and Koi has no way to enter a recovery code yet.`
(spec-delta already records this as a real current limitation rather than absorbing it into "just
tap again".)

### 12.6 Units and currency — decision by recognition

```
        ┌──────────────────────────────────┐
        │  Distance                        │
        │  Kilometres      43.465 km    ✓  │
        │  Miles           27.008 mi       │
        │                                  │
        │  Economy                         │
        │  L/100km         6,9 L/100km  ✓  │
        │  km/L            14,5 km/L       │
        │  mpg (US)        34,1 mpg        │
        │  mpg (UK)        40,9 mpg        │
        │                                  │
        │  Volume                          │
        │  Litres          42,10 L      ✓  │
        │  Gallons (US)    11,12 gal        │
        │  Gallons (UK)     9,26 gal        │
        │                                  │
        │  Amounts you logged never change.│
        └──────────────────────────────────┘
```

- Every row shows **the user's own latest number** converted into that option — "decision by
  recognition" (§C8). With a multi-car garage the number is the newest reading in the whole
  garage, shown with **no car name**: it is a format demonstration, not a fact about a car.
- **`Volume` is a fourth group**, easy to forget because it never carries its own headline
  card the way distance and economy do — but §B1 names it as a user preference in the same
  breath ("distance (km/mi), economy (…), **volume (L/gal)**, currency code") and it re-labels
  real surfaces: the fuel keypad's `LITRES` pill, the Fuel lens footer's litres total, and the
  `PRICE PAID` card's €/L all read in whichever unit is chosen here. §B3's own import already
  converts US/imperial gallons to litres for exactly the users who would want to read them
  back.
- ⟨ **early data, nothing to convert:** rows show the unit name alone, with no example and no
  invented placeholder. A made-up `43.465 km` on a picker is exactly the invented number §D5
  exists to forbid ⟩
- Footer verbatim: `Amounts you logged never change.`
- **Currency** is a searchable pushed page; each row shows the format applied to a real amount.
  It relabels and **never converts** (multi-currency totals are refused), which is surprising
  enough to say on the page itself, not only in the units footer:
  `Only the symbol and format change. Amounts you logged never change.`

### 12.7 Export, import, and the erase button

```
│  Import from MyCar                  ›    │
│  Export JSON                        ›    │
│  Export CSV                         ›    │
│  ⟨ Exports what's on this device. ⟩      │
```

- Export is **free, complete, one tap** (article 1; the data-hostage refusal). Two rows: full
  fidelity JSON, and one CSV per table.
- ⟨ when sync is on **and** the queue is non-empty, the rows carry
  `Exports what's on this device.` — an export while sync is on is a device-local snapshot that
  may lag the server, and the export promise should not quietly narrow when sync arrives ⟩
- Import follows §B3's flow: pick file → **"Check before import"** preview (vehicle mapping chips,
  unit-conversion card, soft-flag card) → **`Nothing changes until you tap import.`** → the import
  moment with totals, the skipped-income count, and `Review now` for flagged readings, which
  lands in R1's review queue. **The skipped-income string changes**: §B3's own copy ("N weren't
  imported — Koi tracks costs, not income.") states a refusal that D-008/D-014 formally
  superseded — income is IN scope now (§5.6), just not built yet, so the honest string is
  `N income records weren't imported — Koi has no income surface yet.` §B3's string and §D6's
  reference string both need this update recorded in spec-delta when bucket E lands.

**Erase — the one place this pass changes a specced label.**

**Keyed on "has this device ever synced", the same discriminator as §12.2's card — not on
whether sync happens to be on right now.** A paused device (synced once, now off) is still
enrolled exactly as much as a syncing one: §12.7 itself is the reason why — "the device is still
enrolled, so it re-bootstraps from the checkpoint and the records come straight back" is true
whether or not sync is toggled on at the moment of erasing. Keying the dialog on the toggle would
let a paused device show the full "Erase everything" wipe-claim, which is exactly the promise
Koi cannot keep on that device.

```
 never synced                                has ever synced (syncing or paused)
┌──────────────────────────────────┐       ┌──────────────────────────────────┐
│  Erase everything?               │       │  Erase this device?              │
│                                  │       │                                  │
│  This deletes every car, record, │       │  Sync is turned off first, so    │
│  reminder and document on this   │       │  your server can't send the      │
│  device. There is no undo.       │       │  records back.                   │
│                                  │       │                                  │
│  [ type: ERASE ]                 │       │  This deletes everything on this │
│  [ Cancel ]       [ Erase ]      │       │  device. Records already on your │
└──────────────────────────────────┘       │  server stay there.              │
                                           │                                  │
                                           │  [ type: ERASE ]                 │
                                           │  [ Cancel ]       [ Erase ]      │
                                           └──────────────────────────────────┘
```

Why: **once an account exists, a local wipe is not an erase**, regardless of whether sync is
switched on at the moment. The device is still enrolled, so it re-bootstraps from the checkpoint
and the records come straight back — S-7 (erase-everywhere) is explicitly not built. Two
consequences, both drawn:

1. the act **turns sync off first (if it is not already) and says so**, which is the only version
   of this button that is true today and needs no server work;
2. the label becomes **`Erase this device`** for any device that has ever synced, on or paused
   alike. §D5 forbids a promise Koi cannot keep, and a mislabelled destructive button is the worst
   possible place to break that rule. The "everything / everywhere" wording waits for S-7 and for
   a device that has genuinely never had an account.

Typed `ERASE` confirmation and `There is no undo.` are §C8 verbatim in both states.

---

## 13 · The control language these wireframes assume (§D7)

One list, because every screen above draws from it and a second implementation of any row is how
two surfaces start disagreeing.

| Component | Law |
|---|---|
| **Row** | icon well `{domain}` · title · one-line meta · trailing mono amount · date. One design, used in History, the car page's 3 recent, Insights' record lists, and Home's Last fill |
| **Icon well** | one glyph per record type, used identically everywhere (§D1). Not a coloured bar — §C2 says *icon* well |
| **Chip — filter** | capsule, selected = **ink-filled** |
| **Chip — option** | capsule, selected = **accent-washed** |
| **Chip — status** | not tappable. Labels only. A tappable status chip is hidden navigation with no back story |
| **Fitted picker** | parent visible, applies on tap, closes itself, **no Save button** |
| **Task sheet** | one full-height layer, `( Cancel )` / title / `( Save )`, dirty guard pins it, continues by **inline swap** or its **own** internal push stack |
| **Toast** | one at a time, app-level (not per screen): success 3 s · undo 6 s behind a draining hairline · error persists. **Undo and Retry are the only actions that ride in a toast.** The surface never turns red — the hairline carries the state |
| **Confirmation** | every destructive act confirmed; a car delete and an erase are **typed** |
| **Stat table** | vertical label→value rows, values in the data voice, reflowing to one column at large text |
| **Gauge** | fill + track + a sentence. Fills `{attention}` when over, never red, never hidden |
| **Bar / line / dot** | §4.5's grammar. One series colour, dashed averages, `●` best, `○` worst, `░` ghosts, `≈` on every projection |
| **Motion** | 150 ms fades everywhere. **Exactly one spring**, at capture success. Reduce-motion → fades only |
| **Type** | three voices: display (large titles, verdicts) · text (UI) · **data** (monospaced tabular — every number, date, amount, and micro-label in tracked uppercase) |
| **Targets** | ≥44 pt, rows are real buttons, decorative glyphs hidden from the screen reader |

---

## 14 · The three resolutions

### 14.1 R1 — the S-4 review queue joins Home's state machine

**The problem.** The review queue was invented in Session 4 (D-047) to land every flag the sync
architecture and the domain produce. It is not in §C at all, and it currently sits on a scaffold
route reached from a permanent card at the top of the garage screen. §C's model is four tabs plus
the detached `+`, and the garage is "the cars".

**The resolution.**

1. **Home selects its state on both counts.** `Needs you` fires on an overdue reminder **or** an
   open review item. `All clear` requires **zero overdue and zero open flags**.
2. **The band renders only when the queue is non-empty.** With no open items, Home shows exactly
   what §C1 describes — nothing added.
3. **Position:** under the reminder hero when both exist; **as the hero** when there is no overdue
   reminder. An overdue ITV has a date in the real world; a data disagreement does not, so it
   waits.
4. **No `Snooze`, no `Mark done`** on a flag. The only honest action is to go look.
5. **The queue page is pushed inside the Home tab.** Tab bar stays, Back reads `‹ Home`.
6. **A second, always-present door in Settings › `Review notes`**, so resolved items stay
   reachable after Home has stopped rendering the entrance (D-047: a decision is part of the
   record, not a deletion).
7. **Zero cars wins the screen.** With no live car, the queue's real action — "enter it again" —
   has nowhere honest to put the record, so `Add your car to begin` stays the hero and the queue
   gets a quiet row beneath it.
8. **Cap reminders never drive the state.** `mileageCap` never notifies by design and §I use case 3
   insists nothing flashes; over-cap surfaces in the garage chip and the car-page gauge (inv.26).

**Why not Settings only.** The queue answers "does anything need me?" — the literal question Home
exists to answer. Burying it in Settings would mean the one surface that promises "Everything OK"
could say it while two devices disagree in a drawer.

**Why not a permanent Home row.** Home would grow a fifth thing that is usually empty, which is
precisely how a calm surface becomes a dashboard (article 2).

**What it costs.** Home's state selector needs one reactive query over both counts. Half of it
already exists and is already live-queried (`OPEN_FLAG_COUNT_SQL`, `src/data/flags.ts:41`).

### 14.2 R2 — sync and account live in §C8's Settings sheet

**The problem.** Sessions 5 and 6 put a sync toggle, passkey sign-in and a one-time
recovery-codes reveal on the garage screen, and said in writing that this was a stand-in until the
real app surface existed (spec-delta). It now does.

**The resolution.**

1. **Settings › `Sync`** (pushed inside the sheet) owns: the reversible toggle, the connection
   status, the pending-upload count, the device alias, `Recovery codes ›`, and the failure
   sentence.
2. **The row is called `Sync`, not "Sync & devices".** There is no device registry; a title
   promising a device list Koi cannot produce would be a §D5 violation in the surface whose whole
   job is trustworthiness.
3. **"Turn on sync" remains the sign-in step** — unchanged from Session 6, only relocated. No
   separate account screen; the ceremony is a native OS sheet.
4. **The two-Face-ID stutter gets a sentence now** (`twice the first time, once after that.`), and
   the real fix stays filed as a server obligation.
5. **The one-time recovery-codes reveal moves intact**, copy unchanged, and gains a later
   `Recovery codes ›` page for regeneration.
6. **Recovery-code *entry* is wireframed and marked NOT BUILT** (D-054), reachable only from the
   failed-sign-in banner — never as an always-present row that invites burning one-use codes.
7. **The privacy card and the erase dialog are keyed on "has this device ever synced", not on the
   toggle, and carry three states, not two.** Never-synced (§C8 verbatim), syncing (spec-delta's
   exact wording), and **paused** — sync off after having synced, where the founding passkey and
   the server-side records both outlive the toggle, so the never-synced claims ("no account",
   "never leaves this device") must never return. D-006's floor (no ads, no trackers, no
   analytics, free complete export, sync strictly opt-in) does not change in any of the three, so
   it gets its own line and survives every switch. **This is a change to shipped copy**, and the
   reason to make it here — the paused state does not exist in the build today.
8. **The privacy page is not written by this pass.** Its rewrite is bucket F (⛔ before any sync
   ships) with obligations from D-023/D-016 the card must not pre-empt.
9. **`Erase everything` becomes `Erase this device` for any device that has ever synced — on or
   paused alike — and turns sync off first.** A device that once synced re-bootstraps from the
   checkpoint whether or not sync happens to be on at the moment of erasing; S-7 is not built.
   This is the only version of that button that is true today.
10. **Sync is never offered in onboarding.** Opt-in from Settings only.
11. **No sync badge anywhere in the shell.** Accepted consequence: a long-broken sync is
    discovered on a visit to Settings. A dot on four roots would nag about something the car does
    not need from you.

**Article 7 note.** Article 7's "no accounts, no servers, no network calls… permanent" was already
renegotiated at the investigation gate — D-012 holds articles 1–6 and 8 verbatim and explicitly
renegotiates article 7 within D-005/D-006. So the binding text for these surfaces is **D-006's
privacy floor**, not article 7's original wording, and no wireframe here prints article 7 as
current truth. The public-facing reconciliation is the bucket-F page rewrite.

### 14.3 R3 — dark mode: roles now, the authored palette as its own item

**The resolution: the wireframes carry colour ROLES, and the authored dark palette is a separate
follow-up board item, owed before the app surface ships.**

Why not both palettes now:

- **ASCII cannot review a palette.** Every screen above names its role (`{fuel}`, `{ink}`,
  `{attention}`…), which is palette-independent and is the part a wireframe *can* settle. Two
  columns of hex in a text file would be unreviewable as colour and would read as decided.
- **§D3 forbids the shortcut that would make it cheap.** Dark is co-primary and authored, "never
  an inversion pass". Authoring means picking a warm near-black paper, then finding four domain
  hues that hold their identity and their contrast against it, then validating every semantic pair
  for AA and for colour-blindness — pixel work, not text work.
- **The light pair is already partly wrong and needs fixing in the same pass anyway**:
  `positive === accent === domain.fuel` (`src/ui/theme.ts:27`) makes a positive state and fuel
  money the same pixel, which §D3 explicitly forbids ("semantic colors… never used as 'series
  4'"), and `inkFaint` (`#8C857A`) is the exact faint-ink contrast risk §H4 already lists as debt —
  and History's archived rows and every degraded meta depend on it.

What this pass commits to instead:

1. **Every element in this document names its colour role**, so the palette work is a
   role → two-hex mapping with no structural surprises left.
2. **`Appearance` (System / Light / Dark) has its slot in Settings** (§12.1) and **ships in the
   same increment as the palette** — a Dark option that selects a palette nobody drew is worse
   than no control.
3. **A new board item:** *authored dark palette + `useKoiTheme()` scheme hook + the two light-pair
   fixes*, sequenced **before History's build session** — History is the surface that will expose a
   bad dark palette worst (dimmed archived rows over faint-ink metas).
4. Today the app also lies about its own appearance: `app.json` declares
   `"userInterfaceStyle": "automatic"` while `app/_layout.tsx:14` hard-codes
   `<StatusBar style="dark" />` (dark *content*), so in dark mode that status bar is dark on dark.
   That one is a two-line fix and belongs with the palette work.

---

## 15 · What `@koi/mobile` already has — keep / rework / scaffolding

Required output of this pass: the wireframes are only worth the session if they change what gets
written next. Every claim below is line-checked against the current tree.

### 15.1 Verdicts

| file | LOC | verdict | why |
|---|---|---|---|
| `app/_layout.tsx` | 31 | **scaffolding** | a flat `Stack` of five peer routes (`:15-28`); §C needs four tabs + detached `+` + a Settings sheet, with per-tab stacks that reset on tab-leave |
| `app/index.tsx` | 246 | **rework** | four surfaces in one screen — garage (`:137-148`), review door (`:123-135`), sync/account (`:166-220`), recovery codes (`:222-234`). Under R1/R2 they split across Home, Garage and Settings › Sync. **Every string survives; no layout does** |
| `app/car/[id].tsx` | 197 | **rework** | lists **every** reading (`:152-163`) with an inline add form (`:133-150`). §C4 caps the car page at 3 recent rows + `Full history ›`. The domain calls and the delete/undo contract are keepers |
| `app/review/index.tsx` | 76 | **rework** | the open-list + `Reviewed` structure is right and survives; it stops being a root, becomes a push from Home and Settings, and gives back two strings that are Home's (`:52`, `:61`) |
| `app/review/[id].tsx` | 270 | **rework — highest keep ratio in the repo** | the D-047 honesty gates and the D-051 payload fix are load-bearing and stay; what changes is presentation (raw column names, raw device ids, ISO stamps at `:189-194`, `:202`, `:214`) and two actions (`Open the record` → the record page; blocked re-enter → the fitted car picker) |
| `app/selftest.tsx` | 128 | **keep** | §H7-sanctioned dev harness, gated at `:60`. Needs re-homing out of the product router — today it is a peer route (`_layout.tsx:27`) that a **product screen** redirects into (`index.tsx:80`) |
| `src/ui/components.tsx` | 374 | **rework** | `Toast` (`:174`) is the real §D7 component and must be lifted out **intact and app-level**; `ConfirmPanel` (`:258`), `Empty` (`:57`), `KeyValue` (`:283`) keep their semantics; `Screen`/`Card`/`Row`/`Button`/`Field`/`SectionLabel` are placeholders that actively block §C2 and §C5 |
| `src/ui/theme.ts` | 56 | **rework** | the four light domain hexes (`:30-33`) match §D3 exactly and survive as **one half** of each pair; everything else is owed (no dark, no scheme read, `positive === fuel`, `Menlo`, no motion tokens) |
| `src/sync/provider.tsx` | 227 | **keep** (architecture) | three *surface* bits to extract rather than re-litigate: the fatal screen (`:166-173`), `Opening…` (`:178`), the connect-error sentence (`:202`) — and one off-palette hex to delete (`:223` `#F6EFE3`) |
| `src/review/kinds.ts` | 246 | **keep, verbatim** | all sixteen kinds' `title`/`what`/`note` copy plus the unknown-kind fallback — the densest §D6-compliant copy in the repo, unit-tested against the honesty rules, and D-051's payload-shape fix lives here |
| `src/review/naming.ts` · `queries.ts` | 94 · 27 | **keep** | cosmetic only: `kmLabel` (`naming.ts:40`) must take an injected formatter instead of `toLocaleString()` |
| `src/data/flags.ts` | 108 | **keep** | latch + restore semantics are proven. `OPEN_FLAG_COUNT_SQL` (`:41`) is exactly the reactive count R1's Home needs. `OPEN_FLAGS_SQL`/`RESOLVED_FLAGS_SQL`/`flagById` (`:39-44`) are **dead** — superseded by `review/queries.ts`, verified unused |
| `src/data/cars.ts` | 105 | **keep** | the cascade contract is load-bearing. `listCars` (`:53`) is written and unused — it is exactly the car picker's query. `updateCar` (`:76`) is the car form's edit path, also unused so far |
| `src/data/readings.ts` | 128 | **keep** | delete / undo / edit contract. `updateReading` (`:69`) is the record-page pencil path, already built |
| `src/sync/schema.ts` | 109 | **keep** (architecture) | surface consequence only, and it is the biggest one: the client carries `cars`, `odometer_readings`, `flags`, `app_meta` (`:79-84`) — **no** fuel, expense, service, note, trip, plan, insurance, document or reminder table |
| `src/sync/queue.ts` | 39 | **keep** | `pendingUploadCount` (`:17`) is the helper Settings › Sync should use; `index.tsx:53` bypasses it with raw SQL and then mislabels the result |
| `src/auth/flow.ts` | 84 | **keep** | it names the two screens the surface owes it (`:10-14`): recovery-code entry, and an explanation for the double prompt. §12.5 draws one and §12.3 writes the other |
| `src/{clock,data/db,data/ids,sync/config,sync/connector,sync/device,sync/mode,sync/powersync}.ts`, `src/auth/client.ts`, `src/selftest/scenarios.ts` | — | **keep** | plumbing and evidence infrastructure; no surface decision touches them |

### 15.2 What each existing screen becomes

**`app/index.tsx` → three surfaces.**

| Part | Goes to |
|---|---|
| review card `:123-135` | **Home**'s conditional decision band (R1) + Settings › `Review notes` |
| cars list `:137-148` | **Garage** (§6.1) — gaining photo, attention dot, identity line, status chips, archived section. Its accent must stop being `color.domain.fuel` (`:145`) |
| inline add-car `:150-164` | the **car form sheet** (§6.5); the three-field promise and its copy survive |
| sync block `:166-220` | **Settings › Sync** (§12.3), copy intact, minus the mislabelled off-state count (`:201`) |
| recovery codes `:222-234` | **Settings › Sync › Recovery codes** (§12.4), copy intact |
| device id `:212-214` | the same page, as an alias (`iPhone · a1b2c3`), not a raw UUID |
| car-delete toast handoff `:66-76` | survives as-is behind the car form's `Remove`; the reasoning stays verbatim |
| selftest link `:215-219` | out of the product screen entirely |

**`app/car/[id].tsx` → the §C4 car page.** Keep, and move: `deriveCurrentOdometerKm` on the render
path (`:67-71`) becomes the odometer card's value **and** the numerator behind the garage cap chip
— there is never a stored current (S-3). `checkOdometerReading` as a pre-write hard stop (`:85-91`)
gets three homes: the odometer sheet, the car form's baseline field, and every capture surface
carrying an odometer — with two shortfalls to fix in the move: inv.9 says the error "offers to
open it", and today's message names the conflict but offers no action; and inv.10 (excluding a
fill's own reading and its folded twin from the check on edit) is not implemented at all today,
so a mistyped odometer value on a saved fill currently cannot be corrected downward. `deleteReading` +
`undoDeleteReading` + the toast closure (`:76-83`) move to the record page's Delete and History's
swipe. `deleteCarWithReadings` + `router.replace` + the no-undo toast move behind the car form's
`Remove`. The deleted-elsewhere state (`:110-117`) stays as the car page's own — it is the honest
face of D-043. **Dies:** the readings list, the inline add form, the body-mounted delete button.

**`app/review/*` → two pushed pages.** Structure and copy survive almost whole; §2.8/§2.9 draw the
two changes (human field labels; the car picker for a `late-child` re-enter) and §8.7 gives
`open-record` somewhere honest to land.

### 15.3 Where the existing code already contradicts §C/§D

Not "incomplete" — actually contradicts. This list is the argument for why the wireframe pass had
to come before more screen code.

1. **`app/car/[id].tsx:152-163` renders the whole ledger on the car page.** §C4: "exactly 3 recent
   rows + `Full history ›` … never a second copy of the ledger." Article 1 says the same. §E round
   1 records this as a real defect Tester R found in the old app ("duplicated history inside car
   sheet") whose 2.0 fix *was* the one-ledger rule. **A shipped-and-fixed defect has been
   reintroduced.**
2. **Creation flows live inline on non-sheet surfaces** — `car/[id].tsx:133-150` (add a reading),
   `index.tsx:150-164` (add a car). §D1: "tasks float, once"; §C4: "car form (one sheet)". Neither
   has a dirty guard, and the reading form has no soft-confirm path, so a >5.000 km jump saves
   silently where §B2 requires "Does that look right?".
3. **`app/index.tsx:145` paints a car row with the fuel hue.** §D3: car accents are identity only,
   never data — and this also spends the one green the app is allowed on something that is not fuel
   money.
4. **`src/ui/theme.ts:27` makes `positive` identical to the fuel hue** (both `#43823B`). §D3:
   semantic colours are reserved and "never used as 'series 4'". A positive state and fuel money
   are currently the same pixel.
5. **Light mode is hard-coded while the app declares automatic appearance.** `app.json` says
   `"userInterfaceStyle": "automatic"`; `theme.ts` has one palette and no `useColorScheme`
   anywhere; `_layout.tsx:14` pins `<StatusBar style="dark" />`. Article 9: dark mode co-primary.
6. **`theme.ts:55` hard-codes `Menlo` for the data voice** (and `index.tsx:244` repeats it). §D4:
   numbers wear a monospaced tabular voice **everywhere** and never jitter. Menlo is an Apple font;
   on Android it silently falls back to the proportional default — on the platform the README calls
   co-equal.
7. **Every number is formatted with bare `toLocaleString()`** — `car/[id].tsx:128`, `:157`,
   `review/[id].tsx:56`, `review/naming.ts:40`. §H3/§D4 make es-ES the design default
   (`1.234,56 €`, `43.465 km`). No locale, no options, and Hermes' Intl support is
   environment-dependent. Meanwhile `@koi/domain`'s deterministic `formatAmount` exists for exactly
   this and is imported by **zero** app files — the only domain import in the whole app is
   `car/[id].tsx:18`.
8. **`app/index.tsx:201` "N records kept here so far." is false.** The number is
   `SELECT count(*) FROM ps_crud` (`:53`) — an upload *queue*, as its own comment says. One
   created-then-edited-then-deleted reading makes that line claim 3 records with zero on the
   device. §D5: sums that would lie are withheld. (The honest helper exists and is bypassed:
   `src/sync/queue.ts:17`.)
9. **A permanent sync-internals card sits at the top of the Garage** (`:123-135`, `:166-220`). §C4:
   the Garage is "the cars".
10. **`app/review/index.tsx:52` and `:61` speak Home's lines.** §C1 reserves "Everything OK" for
    Home's All-clear and "Needs you" for its overdue state; §D6 lists the first as a reference
    string. Under R1 the queue is pushed *from* Home, so a user could meet "Everything OK" twice in
    one stack meaning two different things.
11. **`app/review/[id].tsx` renders schema and protocol internals as user copy** — a row labelled
    "Field" with the value `reading_km` (`:189`), raw column names as labels (`:202`, `:214`), a
    raw device id (`:190`), raw ISO timestamps (`:191`, `:228`), "Record version" (`:193`). §D6 is
    plain language; spec-delta's own note says this should read "your other device".
12. **`app/car/[id].tsx:130` ships "Derived from the trail, never stored (S-3)." to users.** An
    internal decision id in product copy.
13. **`app/car/[id].tsx:161` deletes a reading with no confirmation.** inv.31: every destructive
    action is confirmed *and* undoable; only the undo half is honoured. §D1 also puts trash behind
    detail or swipe, not as a bare button on every row.
14. **`app/car/[id].tsx:174-176` silently swallows a wrong typed confirmation** — the button stays
    enabled and nothing happens. §D6: errors explain and offer the fix.
15. **`src/ui/components.tsx:53` and `:149` uppercase the string itself**, not a style. §F learned
    this the hard way: uppercase transforms leak into accessibility labels, and here there is no
    transform to strip — the text node *is* uppercase.
16. **`src/ui/components.tsx:145` commits capture to the system number pad.** §C5 and Appendix 1
    both require a custom in-sheet keypad **with a locale decimal key**; iOS `number-pad` has none,
    so "Enter any two" cannot be typed on this component at all.
17. **There is no icon in the app** — `Row`'s "well" is a 6×28 coloured bar
    (`components.tsx:76`, `:317`). §C2 specifies an **icon** well; §D1 wants one icon per record
    type used identically everywhere. `expo-symbols` is installed and unused.
18. **`components.tsx:372` fixes the fact-row label column at 118 pt.** §H4 requires single-column
    reflow at the largest text sizes; this truncates instead.
19. **`app/review/[id].tsx:238-240` "Open the record" opens the car**, not the record. §C6: every
    ledger row opens a page — and the flagged subject is usually a reading.
20. **`app/index.tsx:156` writes `fuel_type` as free text.** §B1 makes it an enum and §C4 specifies
    fuel **chips**. `checkCarFields` exists in `@koi/domain` and is never called — so the client
    half of "flag, never fix" is applied to readings and not to cars.
21. **There is no Settings surface at all** — no route, and the word appears in `app/` only inside
    comments. §C requires a floating Settings button on **every** root.

### 15.4 What the new surfaces need that does not exist yet

Named so the next session does not discover them one screen at a time. None of this is an
architecture change (D-032 stands) — it is surface plumbing plus one stated schema dependency.

| Need | For | Note |
|---|---|---|
| **Locale formatters** — separators, currency placement, unit suffixes (`km`, `L/100km`, `€/L`, `€/km`, `€/day`), the `≈` prefix rule, month/date labels | every surface | `@koi/domain` gives the deterministic core (`parseAmount`, `formatAmount`, `toMinorUnits`, `sumMinorUnits`) and its own header explains why the rest cannot live there — the package is dependency-free and Intl-free by conformance rule. **Recommend `@koi/i18n`** (already boarded, bucket C) + a thin `useFormat()` hook, because the web client must render the same numbers |
| **`useKoiTheme()`** — resolved light/dark tokens from `useColorScheme()`, plus `prefersReducedMotion` and `fontScale` | every surface | R3's follow-up item |
| **An icon set, one per record type** | History rows, chooser tiles, record pages, Insights lists | `expo-symbols` is installed and unused; the README already records the trap (object form of `name`, plus an Android fallback or nothing renders) |
| **The `TimelineEvent` projection** (§B1) | History's mixed feed, the car page's 3 recent, Insights' record lists | pure and read-only → belongs in `@koi/domain`, with the tint as a **token name** (`'fuel' \| 'service' \| … \| 'ink'`), never a hex. It is also the one place inv.7's fold rule should be decided |
| **Home's state selector** as one reactive query `{ overdueCount, nextReminder, openFlagCount }` | Home (R1) | half exists (`flags.ts:41`); the reminder half needs a reminders table plus inv.32/33 |
| **A fitted car picker** | capture, the review queue's re-enter, the scope chips | `listCars` (`cars.ts:53`) is the query, already written and unused. Article 8: it must not exist at all on a single-car garage |
| **Device-local UI state** — scope chip, lens, page size, filter chips | History, Insights | `app_meta` is the right store and is already local-only; S-12 (preference split) is still `todo` |
| **Swipeable rows + the sheet dirty guard** | History, every capture sheet | `react-native-gesture-handler` and `react-native-reanimated` are installed and imported nowhere |
| **An app-level toast host** | everywhere | §D7's "one at a time" is currently true only per screen (three separate `<Toast>` mounts), which is why a car delete has to smuggle its message through a route param |
| **The time-pages carousel** | Insights | three interval-keyed pages, re-keyed on settle, axis-separated from the inner scroll. The page-bucketing helpers (weeks in a month, months in a year, years across all) do not exist and belong next to `civil-date`; `cycleAnchor` already covers the cap-cycle exception |
| **The derivation engines behind three lenses** | Fuel, Distance, Cost, Ownership | domain has `economyL100km` (one interval) and the odometer helpers. It does **not** have the full→full **chain walker** (inv.1-4, partial accumulation, `missedPrevious` restart, recent-mean-of-≤5 with the ±5% dead band and the trend word), **bucket interpolation** + today-anchored projection (inv.21-23), the **plan billing series** (inv.13-15, 19), or **cap cycle + pooling** (inv.24-27). No wireframe above assumes any of them exist |
| **Record tables** | History, Insights, Capture, Reminders, Vault | the client schema carries four tables. Five of capture's six types, seven of History's eight row kinds, three of four lenses and all of §C7 are blocked on that batch. **Stated dependency, not a proposal** |
| **Also missing** | | notification scheduling (`expo-notifications` not a dependency; S-13 `todo`); photo/document capture and storage (no image or filesystem module); export writers (bucket E); a column→human-name map and a device-alias resolver before the review evidence card can ship |

### 15.5 Carry-out list — what must not die with the files

**Copy that is spec-verbatim or spec-delta-mandated:**

- `index.tsx:153` "Three fields. Everything else can wait." · `:138` "Add your car to begin."
- `index.tsx:198` "Your data never leaves this device. No account, cloud sync or analytics."
  (§C8; spec-delta pins it as the **sync-off** string)
- `index.tsx:171-172` "This device syncs to your own server, so your other devices see the same
  records. It never leaves servers you run." (spec-delta's exact **sync-on** wording)
- `index.tsx:114` "Sync paused. Records already sent stay on the server."
- `index.tsx:184-186` "N changes waiting to reach the server" — keep this phrasing, drop `:201`'s
- `index.tsx:224-232` the whole recovery-codes card, including "Each works once. Koi shows them
  only this one time." and "I've saved these"
- `index.tsx:73-74` "Car deleted, with N readings." / "Car deleted."
- `car/[id].tsx:113` "This car is not on this device. It may have been deleted somewhere else."
- `car/[id].tsx:80` "Reading deleted." + Undo
- `review/index.tsx:63` "Nothing is fixed silently. You decide what happens." (§D6 reference
  string) · `:53-55` "Nothing needs a decision. When two devices disagree, or a change cannot be
  applied, it waits here."
- `review/[id].tsx` — "This record is deleted, so it is not on this device." (`:176`), "This note
  carries no values of its own — the change itself is kept on the server." (`:221`), the
  deleted-car sentence (`:251-253`, which becomes the car picker's copy), every section label
  (`:185`, `:199`, `:210`, `:225`) and every action label (`:229`, `:234`, `:245`, `:256`), and all
  five toasts (`:127`, `:136`, `:140`, `:152`, `:163`)
- `src/review/kinds.ts:50-198` — **all sixteen kinds' strings plus the unknown-kind fallback.**
  Densest §D6 copy in the repo, unit-tested against the honesty rules
- `src/sync/provider.tsx:202` "Not syncing: … Your records are safe on this device." — keep the
  sentence, stop rendering the raw error inside it

**Reasoning that must not be re-derived:**

- the **toast-timer ref trick** (`components.tsx:184-191`) — a live query elsewhere on the screen
  re-renders the parent constantly, so depending on `onDismiss` directly would restart the timer on
  unrelated renders and break §D7's 3 s / 6 s promise
- the **§D7 toast laws** as stated at `components.tsx:1-12` and type-enforced at `:165` — one at a
  time, Undo/Retry only, "the surface never turns red — the hairline carries the state"
- **D-051's payload-shape fix** (`kinds.ts:225-236`) — `column-conflict` writes a bare scalar named
  by `column_name` while every other kind writes an object snapshot; both the restore write and the
  display read go through `namedPayloadEntries` so they can never drift apart again
- **D-047's re-enter rule** (`review/[id].tsx:1-18`) — never offer "restore" on a deleted record
- the **D-051 deleted-car gate** (`review/[id].tsx:102-110`) — re-entering under a deleted car
  would insert tombstone-born and vanish a second time, silently
- the **verbatim-evidence rule** (`review/[id].tsx:187`) — the server wrote that sentence with the
  data in hand
- the **no-undo-on-car-delete rule** (`index.tsx:64-65`) — a car delete has no undo (inv.30), and
  offering one would be a promise Koi cannot keep
- the **cross-screen toast handover** (`car/[id].tsx:103-104`) — the confirmation happens on a
  screen that is gone the moment the car is
- the **naming fallback rule** (`review/naming.ts:2-6`) — "a review item that cannot name what it
  is about is a warning, not a decision"
- the **③ no-confirmation stance** (`index.tsx:97-100`) and the **`ps_crud` fact** (`:50-52`)
- `theme.ts:23` "The app accent — and the fuel domain hue. **One green in the app.**"
- `README.md`'s two Expo traps that bite on first real UI: `Link.AppleZoom` needs `asChild` **and a
  flattened child style** (an array style there is a hard dev error), and `expo-symbols` needs the
  object form of `name` plus an Android fallback

---

## 16 · Open questions for the owner

Recommendations are stated; each is a real fork, and none of them blocks drawing.

| # | Question | Recommendation |
|---|---|---|
| 1 | **Do plan charges become ledger rows in History?** §B1's TimelineEvent has no plan-charge event, but inv.13 makes plan billing real money and the Cost lens counts it — so a subscription car's July whisper and Insights' July headline would answer the same question differently. That is the exact bug class §F says the time-pages work existed to kill | **Yes** — render the monthly charge as a non-editable `{contract}` row (glance sheet, no swipe, "Set by your plan — open the car to change it"), filterable, counted in the whisper. The cheaper alternative accepts a permanent discrepancy no copy explains |
| 2 | **The Fuel lens headline's period.** inv.4 defines recent economy as a *trailing* ≤5-value window; §D2 forbids trailing windows on a paged surface | **Page-scoped mean** for the lens headline (≥2 measured values in the page), keeping inv.4's ≤5 window as the definition of "your usual" that Home's Last-fill card and the record-page verdict compare against |
| 3 | **`By week` bucketing.** ISO weeks straddle month boundaries, which would either double-count or leave gaps and make the labels lie | **Day-of-month blocks** (1–7, 8–14, 15–21, 22–28, 29–end): they telescope exactly to the month total, never overlap, and the short last bucket is honest because it is labelled by its dates |
| 4 | **inv.21 vs inv.23 for a page's distance.** One spreads a years-wide gap across the months it covers; the other refuses a figure under two readings in a window | inv.21 governs pages **bounded by readings on both sides** (km shown, `≈`-marked, captioned as spread evenly); inv.23 governs unbounded pages (dash + sentence). Adds a required `≈` to per-page €/km that neither §C3 nor §D4 currently shows |
| 5 | **Top-5 truncation in `Where it went`** leaves five bars that do not sum to the headline | add an **`Other (N kinds)`** row in `{ink}` — the total reconciles, the grammar holds, no sixth colour is invented |
| 6 | **`Erase everything` → `Erase this device` for any device that has ever synced** — keyed on "has an account", not on the toggle, so a paused device gets it too — turning sync off first (§12.7) | ship it. It is the only true version of that button before S-7 |
| 7 | **The privacy card carries three states, not two**, keyed the same way — never-synced / syncing / paused — so the never-synced claims never return once an account exists (§12.2) | ship it. It changes copy the owner already reviewed once, which is why it is here and not just done |
| 8 | **Undo when two records are deleted quickly.** §D7's one-toast-at-a-time plus inv.31's in-memory closure means the first delete becomes permanent with no warning | queue the closures: the new toast supersedes visually, each closure survives its own 6 s, and the toast reads "2 records deleted." with one `Undo` that restores both |
| 9 | **Income is IN scope** (D-008/D-014 supersede the refusals-table row) but no surface exists for it, and the design sketch wants the *positive* hue while §D3 reserves semantic colours | keep income **off** the capture chooser for the shell build (a sixth tile would create records no surface can render) and treat the hue collision as a colour-law item for the income session — it cannot be settled inside capture |
| 10 | **Default Insights page size** (Appendix 2 #2, still unsigned) — Month lands on today's partial page and is sparse on the 1st–3rd | keep **Month**, and answer the sparseness with the honest empty page (§5.1). Worth deciding against the drawn empty-month page rather than on principle |
| 11 | **Lens picker title** (Appendix 2 #3) | **no title** — four rows say what they are, and "lens" never becomes user-facing vocabulary, which was the whole objection |
| 12 | **Garage ordering.** The build sorts by make/model | **most-recently-active first, archived always last.** An alphabetical garage buries the car you actually drive. Taste call, not a derivation |
| 13 | **`missedPrevious` has no capture control anywhere in §C** — only the importer maps it, so a user who forgot a fill cannot restart the chain and Koi will publish a wrong number instead of none | a quiet **"I missed a fill before this one"** toggle under `Full tank`, off by default |
| 14 | **The trip sheet's start-km prefill breaks monotonicity on backdated trips** (current km is newer than the trip's dates) | prefill **only when the start date is today**; otherwise leave it empty with "Add the reading you started with." A guardrail that fires on the app's own default trains people to tap through guardrails |
| 15 | **Ownership's subject under a swap lineage.** "Always single-car" collides with inv.13's plan-level billing and inv.28's lineage | the subject is the **plan's lineage** — "Since 2019 · 2 cars on this plan", a `Swapped to X` milestone, a footnote, and today's-km scoped to this car. Charging one car's ledger with two cars' plan payments is the worse lie |
| 16 | **A flagged reading inside an Insights page** makes a clean-looking chart out of data the user has not accepted | one quiet ink line — "Some readings in this period need a decision. Review notes ›" — only when a flag intersects the page. Explicitly **not** a banner, so Insights does not become a second Home |
| 17 | **No sync badge anywhere in the shell** (§12.3) | accept it, recorded: a long-broken sync is discovered on a visit to Settings |
| 18 | **`Vault` → `Insurance & papers`** as the user-facing title (§10) | ship it; "vault" stays internal |

---

## 17 · What the session after this one should build first

Not a plan to approve here — the sequencing that falls out of the wireframes, so the next brief
does not have to re-derive it.

1. **The shell, for real.** Four tabs + detached `+` + the floating Settings button + per-tab
   stacks + an **app-level toast host**. Everything else hangs off it, and it is the one thing no
   surface can be built correctly without.
2. **The palette and the token layer** (R3's item): the authored dark pair, `useKoiTheme()`, the
   `positive === fuel` fix, the faint-ink contrast fix, the `StatusBar`/`userInterfaceStyle`
   mismatch, `Menlo` → a real cross-platform tabular voice. Before History, not after.
3. **The formatter layer** (`@koi/i18n` + `useFormat()`), because every screen from here on prints
   numbers and there is currently no correct way to do it.
4. **Garage + car page, rebuilt to §C4** — the only two surfaces whose data already exists, and
   the two that carry the live defects (§15.3 #1-#3). This is where the wireframes get their first
   real test.
5. **Home, with R1's state machine** — using the flag count that already works, and stubbing the
   reminder half until the table lands.
6. **Settings + Sync**, moving Sessions 5-6's proven copy off the garage (R2), plus the privacy-card
   split and the erase-label fix (§16 #6, #7).
7. **Capture → Odometer**, the one capture surface whose table exists: the real sheet, the custom
   keypad, the delta hint, the soft/hard validation split, and the dirty guard. It proves the
   capture pattern end to end on real data before five more sheets are written against it.
8. **Then the schema batch** (fuel, expense/service/note, trip, plan, insurance, document,
   reminder) — after which History, Insights and the rest of Capture become buildable at all. That
   batch is the real gate on §C, and it is new-table work, not an architecture change.
9. **Insights last**, and inside it: **Ownership first** (no chart needed at all), then Distance
   (the trail already exists), then Cost, then Fuel — with every card shipping as
   headline + sentence + stat table before any canvas exists (§5.7), which is also §H4's
   accessible summary, so a11y comes free instead of as an overlay subsystem later.

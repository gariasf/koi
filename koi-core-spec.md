# Koi — Core Specification

**Purpose.** This document is a self-contained hand-off: everything a team needs to re-create the core of Koi — the product thesis, the data model and its invariants, every surface's functional requirements, the UX pattern language, the feedback that shaped it, and what is deliberately absent. It assumes no access to the existing codebase. Visual design is described at the pattern level (structure, hierarchy, color roles), not pixel level.

**Scope.** The iOS app only. The website and any other platform appear only where they constrain the product (privacy claims). Testers are anonymized: **Tester R** (a designer; gave the earliest structured critique and the navigation/graph feedback) and **Tester M** (a long-time subscriber of the competing app MyCar who imported years of real data and compares side-by-side).

**Status date.** July 2026. Shipped through v2.3.0; the "time as pages" Insights navigation (§C5) is implemented and verified but not yet released.

---

## A · Thesis

> **Koi is the car book you actually trust: effortless to keep, complete underneath, calm on the surface, and private by construction.**

A ledger app for what cars cost — owned, financed, leased, or on a subscription. One sentence of positioning: *"Your cars, calmly."* Open it, see that everything's fine, get on with your day; when you want depth, every number is there and shows its work.

Two personas, one product, **layered not opposed**:
- The **conscientious owner** (Tester R's profile) logs every fill with odometer, drills into per-fill economy, wants the math visible.
- The **calm owner** logs sporadically, wants "does anything need me?" answered in three seconds, and **must never be punished** for not opening statistics.

Neither sees the other's app. Depth is one tap away, by invitation, never forced.

### The constitution (nine articles)

1. **The ledger is sacred.** Everything recorded is visible, inspectable, editable, deletable, exportable. One ledger with scoped lenses — never parallel copies of history.
2. **Calm surface.** Home answers "does anything need me?" in three seconds. Home is never a dashboard and never grows charts.
3. **Complete core.** Per-fill economy, cost structure, distance, full statistics — as complete as the best data trackers, but curated with hierarchy instead of dumped.
4. **Trust through transparency.** Show the math. An economy figure states its measurement interval. Estimates are marked ≈. No black boxes.
5. **Guardrails at the door.** Validate at entry: impossible values are hard stops; improbable values are soft confirms. Data is never silently "fixed" afterwards.
6. **Zero-friction capture.** Smart defaults, derive-what-you-can, always lighter than the competition. A fuel fill logs in under ten seconds.
7. **Local and private by construction.** No accounts, no servers, no analytics, no network calls. Local notifications only. Free, complete export. This is permanent, not a roadmap stage.
8. **Scale with the garage.** One car: no selectors anywhere. Several: effortless scoping.
9. **Native and durable.** Platform-native UI, dynamic type, dark mode co-primary, screen-reader support.

### The refusals

Refusals define the product as much as features. Each is deliberate and reasoned:

| Refused | Why |
|---|---|
| Accounts, cloud sync, telemetry, ads | Privacy by construction (article 7); "nothing to sell, because we never have it" |
| Gamification: streaks, badges, confetti | Calm surface; the app never performs enthusiasm |
| Forced dashboards | Home never grows charts; Insights is always opt-in |
| Data hostage-taking | Export is free, complete, one tap |
| Silent data mutation | Every derived or corrected value is labeled; the app never rewrites user records behind their back |
| Income tracking | Vision-locked: Koi tracks costs. The importer counts income records and says it skipped them — never silently |
| Pie charts | Constitutional. Cost structure = ranked horizontal bars with a closing sentence |
| GPS, background tracking, trip timers | A trip is a ledger record (two odometer readings + a name), not surveillance |
| Per-trip fuel economy, average speed | Economy is only honest between full tanks; a 13-hour trip showing "57 km/h" is parked-time fiction |
| Fuel-price finder / station prices | Shipped in 1.x, **removed**: the only outside service the app talked to. Never reintroduce |
| A stored expense-category taxonomy | Zero logging burden; grouping free-text notes plus preset chips gives category rows without a schema |
| Blending fuel economy across cars | Physically meaningless; cost and distance may aggregate, economy is always per car |
| iPad/Mac, EV charging economics, multi-currency totals | Explicitly deferred, not creeping in half-done |

---

## B · Domain model

### B1. Entities

All persistence is one JSON document (see §H2). All new fields are optional-with-default so old files decode forever.

**Car** — id, make, model, year?, plate?, nickname?, vin?, odometerKm? (current), fuelType (petrol/diesel/electric/hybrid/mild-hybrid/plugin-hybrid/LPG/CNG/other), registrationYear?, purchaseYear?, powerHP?, fiscalPower?, purchasePrice?, soldPrice?, tankCapacityL?, addedAt, initialOdometerKm? (baseline at acquisition), odometerLog [OdometerReading]?, archivedAt?, photo?, revision (bumped on every edit — equality is id+revision so any edit forces a UI diff), importedVehicleID? (source-app id for idempotent re-import). Derived: displayName (nickname → make+model), ownedSinceYear (purchaseYear ?? registrationYear ?? year), isArchived.

**OdometerReading** — id, date, km, source? (manual / fuel / imported; nil = legacy).

**FuelLog** — id, carID, date, amount (money), liters, odometerKm?, station?, filledToFull? (nil reads as full), missedPrevious? (nil reads as nothing missed). Economy is derived at read time, never stored.

**LogEntry** — id, carID, kind (expense / service / note), date, amount?, note, odometerKm?.

**Plan** — id, kind (owned / finance / lease / subscription), provider?, monthlyCost?, initialPayment? (deposit), mileageCapPerMonth?, capPeriod (month/year), mileagePools? (unused km carry over), startedAt, endsAt?, paidOffAt? (finance → owned), includesInsurance/Maintenance/Roadside, allowsSwap + swapIntervalMonths?, **carIDs: ordered lineage** (last = current car; swap history lives here). Every car is reached through a plan; an owned car has a bare `owned` plan.

**Trip** — id, carID, name, startDate, endDate, startKm, endKm (0 = unknown), note. Derived km = end − start, nil unless both known and end ≥ start. Cost is a derived ≈view (§B2), never stored.

**InsurancePolicy** — id, carID, insurer, policyNumber, coverage, premium?, premiumLastYear? (renewal trend), validFrom?, validTo?.

**Document** — id, carID, kind (registration / inspection / insurance / other), title, image or PDF data (downscaled, metadata-stripped), fileName?.

**Reminder** — id, carID, kind (service / inspection / insurance / mileageCap), title, dueDate? and/or dueMileageKm? (absolute odometer target; both = whichever first), snoozedUntil?, resolved, completedAt?, recurrence? {everyMonths?, everyKm?}, advanceAlertDays? (defaults: inspection 60/30/7/1 · insurance 60/30/7 · service 30/7/1 · mileageCap never notifies).

**TimelineEvent** — a read-only projection (never persisted): every record type flattened into one feed row (fuel, expense, service, note, odometer, trip, plus system milestones: joined, swap, insurance). Carries title, subtitle, trailing amount, a typed back-reference to its source record, and a tint (see color law §D3).

**Units** — user preference: distance (km/mi), economy (L/100km, km/L, mpg US, mpg UK), volume (L/gal), currency code. One number, converted everywhere; **logged amounts never change**.

### B2. Invariants (the laws the code must enforce)

**Economy**
1. L/100km is computed full-tank → full-tank only. A value exists only at a full fill with an odometer, measured back to the previous full fill with an odometer.
2. Partial fills and full fills without odometers don't measure alone — their litres accumulate into the enclosing full→full interval.
3. `missedPrevious` restarts the chain: that interval yields **no number** (never a wrong one).
4. Recent economy = mean of the last ≤5 measured values; requires ≥2; trend compares older half vs newer half (±5% dead band → "steady").
5. Economy is never blended across cars.

**Odometer trail**
6. One merged trail per car: acquisition baseline + manual readings + fuel odometers + entry odometers + trip endpoints, sorted by date then km.
7. **Fold rule:** a reading logged with a fill or trip lives inside that record — it joins the trail at read time but never gets its own ledger row. A deliberate manual reading always keeps its row.
8. Zero/unknown readings never join the trail (a name-only imported trip must not corrupt monotonicity).
9. Monotonicity is validated both directions at entry: a reading may not be lower than an earlier-dated one nor higher than a later-dated one. Hard stop; the error names the conflicting record and offers to open it.
10. Editing a fill's odometer excludes both the fill's own reading and its legacy folded twin from validation, so correcting downward is possible.
11. Adding any record updates the car's current odometer only if it is the newest reading; backdated records never clobber a newer current. Deleting/editing re-derives current from the trail.
12. Suspicious stored sequences (imports, legacy data) are **flagged for user review, never auto-fixed**.

**Money**
13. Plan charges are the billing truth: deposit at signup, then the monthly amount at each cycle start anchored to the signup day-of-month; billing stops at min(end, paid-off, today). Every money surface derives plan money from this one series.
14. The deposit is capital, not a running cost: excluded from per-month rates.
15. Purchase price is a **fact, never a charge**: shown as a ledger fact row for owned/financed cars, absent for subscription/lease; excluded from running rates ("purchase aside").
16. Note-kind entries never join money totals.
17. Trip costs (≈fuel = km × lifetime fuel-€/km; ≈all-in = km × running-€/km) are views over money already counted — they never join any total, and the UI says so: "Already part of your totals. This is that drive's share."
18. Cost-structure rows name the plan **type** ("Subscription", "Finance"), never the provider brand; same-kind plans merge.
19. A per-month rate always divides by the same window it claims (never a trailing-12 denominator under another label). The running rate = plan monthly at face value + variable spend averaged over the tracked span.
20. Money parsing is locale-safe: "1.234,56" = "1,234.56" = 1234.56; grouping-only "20.000" = 20000, never 20.0 (a 1000× corruption class).

**Distance**
21. Distance buckets interpolate the trail linearly between readings: a years-wide gap spreads across the months it covers instead of spiking in the month the next reading lands. Buckets telescope exactly to last − first.
22. Pace projections anchor two months past **today**, never past the last reading (a stale trail must not "project" into the past).
23. Distance is never invented: fewer than two readings in a window → no figure, dash + sentence.

**Caps and pooling**
24. A cap cycle anchors to the plan's start day-of-month (clamped on short months), not the calendar 1st; monthly or yearly period.
25. Pooling plans budget against cap + carry-over (banked under-driven km from completed cycles). The pool never credits untracked months before tracking began.
26. Over-cap is never hidden: the gauge fills in the attention color, the overage is counted in text, the pace line stays in present tense.
27. Cap reminders are synthesized live from the plan (never stored), follow car swaps automatically, and go quiet for 7 days after any odometer update.

**Lifecycle**
28. Swap appends the new car to the plan's lineage; date-based reminders carry over, mileage-target reminders retire with the old car.
29. Finance past its end date without payoff triggers a one-time nudge ("All N payments logged. Paid off?"); marking paid-off flips to owned, keeps every record, stops billing. Declining is persisted and respected.
30. Archive shelves a car (kept, restorable, out of tallies/reminders; hidden from the all-cars feed by default, one tap brings archived records back; a scoped view always shows them). Delete purges the car and everything attached, after typed confirmation. The two are never conflated.
31. Every destructive action is confirmed; every deletion of a record is undoable via toast (the toast holds the closure to restore).

**Reminders**
32. Resolving a recurring reminder materializes the next occurrence from the original anchor (a lapsed yearly catches up — never scheduled into the past; a 31st anchor never decays). Km rules target current odometer + interval. One-shots create nothing.
33. Km-based alerts are phrased by predicted time at the user's real pace ("around November"), never as frozen remaining-km.
34. Notification permission is requested only after the user creates their first reminder, behind an explanatory pre-prompt; "Not now" is honored quietly — the schedule still lives in the app.

**Validation table**

| Rule | Severity |
|---|---|
| Odometer breaks monotonicity (either direction) | Hard — names the conflicting record |
| Odometer outside 0…9,999,999 | Hard |
| Litres ≤ 0 or amount ≤ 0 on a fill | Hard |
| Empty make/model; year outside 1950…next; tank outside 10–200 L; power outside 20–2000 hp | Hard |
| Odometer jump > 5,000 km since previous | Soft — "Does that look right?" Save anyway / Go back |
| Litres > tank × 1.15 | Soft |
| €/L outside 0.60…3.50 | Soft |
| Imports | Soft-only — imports never hard-fail; suspect rows are flagged for review |

### B3. Import (MyCar CSV)

The competitor migration path; Tester M's real multi-year export is the parity fixture.

- Multi-section CSV (`## Section` headers), real quoted-field parsing.
- **Vehicles** → Car + owned Plan: name→nickname, units detected per car (miles→km ×1.60934; US/imperial gallons→litres), tank/purchase/sale mapped; a sold car imports **archived** with its sale reading. Source vehicle id stamped for idempotency.
- **Refuels** → FuelLog: tank-level ≥ 99.5 → full; missed-previous flag mapped; a fill survives if it has money OR litres (money-only fills are common and kept); 0/blank odometers → nil, never a stored 0.
- **Services/Expenses** → LogEntry with note = type + notes + location; **NoteEvents** → notes; **OdometerEvents** → imported trail readings.
- **Trips** → Trip records; the stored trip distance is only a cross-check (readings win; mismatch = soft flag); speed/efficiency columns dropped on principle.
- **Incomes** → skipped and **counted**, surfaced after import: "N weren't imported — Koi tracks costs, not income."
- Flow: pick file → "Check before import" preview (vehicle mapping chips onto existing cars, unit-conversion card, soft-flag card) → **"Nothing changes until you tap import."** → import moment with totals + "Review now" for flagged readings.
- Re-import is idempotent at vehicle level (known vehicle id doesn't duplicate); record-level dedup is a known gap (§G).

---

## C · Functional requirements by surface

Shell: four tabs — **Home · History · Insights · Garage** — plus a detached **+** capture button. Floating Settings button top-right on every root. Places push (pages with Back), tasks float (one sheet), pickers fit (short sheets). See §D1.

### C1. Home — "does anything need me?"

Exactly one of three states, then one card:
- **Needs you** (anything overdue): hero reminder with days-over capsule, actions **Mark done** / **Snooze** (+7 days, both undoable), then a "Later" list, then the month pulse.
- **Coming up**: featured next reminder (due date + which alerts will fire), "All ›" to the full list, "Later" list, month pulse.
- **All clear**: the brand mark, "Everything OK", "All quiet for the next few weeks.", month pulse.

Month pulse = one strip, three numbers: km driven · money spent · €/km this calendar month (per-km hidden until distance exists). **Never a chart.** Below: a "Last fill" card (economy + interval, or money), tappable to its record. Marking a recurring reminder done from Home gives the same "next occurrence created" toast as everywhere else.

### C2. History — the ledger

One month-grouped feed of every record type: fills, expenses, services, notes, odometer readings, trips, milestones. Filters: record-type chips + car scope chip (multi-car only). Month headers carry a whisper: leading count + that month's money ("2 fills · 141,38 €"; trips never contribute money). Rows: icon well (domain color), title, one-line meta (fuel meta leads with economy + interval — "6,9 L/100km · 378 km"), mono amount, date. Row tap → record page. Swipe: Edit / Delete (confirmed; undoable). Archived cars' records hidden by default behind "Show N archived records". Empty states teach; a filtered-to-nothing state offers "Clear filters".

### C3. Insights — four lenses × time pages

Header (one control row + pager):
- **Title = the lens**: "Cost ▾" — tap opens a fitted picker (Cost / Fuel / Distance / Ownership). Car scope chip rides trailing.
- **Pager**: `‹ July 2026 · to date ▾ ›`. Chevrons turn one page; tapping the period opens the page-size picker (**Month / Year / All time**, each named with its resolution: by week / by month / by year). **TODAY** appears when panned. Current partial page says "to date".
- **Time is pages, not windows.** Pages are calendar-aligned and never overlap, so every quantity has exactly one period and one answer. The whole lens page (headline, cards, records) rides a swipe carousel: a horizontal drag moves the period with the finger, snaps, rubber-bands at the edges (first record / today). Page-size changes keep your place; year→month drills into that year.
- Every card also carries a small period label ("July") as a receipt for mid-scroll reading.

**Cost lens**: headline = the page's total ("249,43 € in June") + "X is your biggest cost."; All time keeps a stable rate instead (€/month + €/km, ≈-marked under 8 weeks of data). Cards: *Where it went* (ranked domain-colored bars, top 5), *By week/month/year* (ink bars, peak labeled, tap-to-read any bar, faint ghost bars at edges where more history exists), *Cumulative* (line, zero baseline, endpoint values). Month pages end with **the records behind the numbers** (up to 6 ledger rows, tap → record page; "N more in History"); wider pages hand the list to History.

**Fuel lens** (per car; all-cars shows per-car tiles, never blended): headline avg L/100km + trend word; *Per fill* line (≥3 measured fills; dashed average hairline, best = filled dot, worst = hollow attention dot); *Price paid* (average + sparkline ≥3 points, cheapest station); *The numbers* (vertical stat table: average, best·worst, last, cadence days·km, litres·€ per fill); footer = period · fills · litres (only when every fill has litres) · money + chain integrity ("21 fills, all full" / "18 of 21 full. Averages shown as ≈"). Sparse state teaches: "Two full tanks to go" + progress dots, never an apology.

**Distance lens**: headline km in page + km/day over tracked days; capped cars get the **cap gauge card pinned above the paged charts, anchored to the plan's own cycle** (a lease cycle is not a calendar page); *By week/month* bars (ink); *Trips* card (top 3 by km + "N trips · X km together · ≈Y €"); *Odometer* line with dashed ≈projection two months past today.

**Ownership lens** (always single-car; timeless — the pager folds away): "Since 2019" display headline; ledger card "What this car costs · since tracking began" — purchase-price fact row (owned/finance only), fuel, services, expenses, plan charges, sold-for; total row = All-in so far / Net cost (if sold) / Logged so far; rates sentence "€X a day · Y €/km, purchase aside."; Milestones dot-list (bought/joined provider → tracking began → latest service → today's km).

Chart grammar for all of it: §D4.

### C4. Garage — the cars

Car cards: photo, name + attention dot, identity line, status chips (provider · cap "1.240/1.500 km" · "Insurance in N days"); over-cap chip wears the attention color — garage and car page tell one truth. Archived section: dimmed rows, "Archived 2020 · records kept", Restore.

**Car page** (pushed): photo + plate chip + specs; odometer card (tap → update sheet); plan card (subscription/lease: monthly, included cover as quiet facts, cap gauge + pace sentence, carry-over footer); swap card → fitted sheet ("Koi can't perform the swap and doesn't pretend to" — states the window, what happens to records, offers a reminder); finance payoff nudge (once, §B2-29); Care group (insurance → vault; reminders; documents; add reminder); Ownership group (owned/finance: purchase price etc.); **exactly 3 recent rows + "Full history ›"** which jumps to History pre-scoped — never a second copy of the ledger.

**Car form** (one sheet, add + edit): make/model, year, odometer, name, fuel chips, plate/tank/power, ownership as three radio rows — Owned outright / Financed (lender, monthly, end, mark-paid-off home) / On a plan (provider, monthly, deposit, cap + period + pooling toggle, dates, included covers, swap) — selected row unfolds inline, "Switching keeps every record. Nothing to retype." Purchase price hidden for subscriptions. Foot: Archive / Restore / Remove ("This deletes the car and its records… There is no undo.").

### C5. Capture — the pen

**+** opens the chooser: hero tile **Fill-up** ("Total, litres, odometer.") + grid: Expense · Service · Odometer · Trip · Note. Money tiles wear their domain hue.

**Fuel capture** (keypad-first, the 10-second surface): three pills **Total / Litres / €/L** — "Enter any two. The third is computed." (derived pill visibly marked); odometer well beneath with delta hint ("+378 km since the last reading."); Full tank toggle default ON; station menu (recents + New station + none); date pill (backdatable, never future); custom in-sheet keypad with locale decimal key. Save disabled until total + litres exist. **Saved moment** — the app's only spring: check mark, "Saved. Economy computed.", the number, "over 378 km", auto-dismiss ~2s. Edits reuse the same surface prefilled, and save quietly (ceremony only for creation).

**Other types** (form sheet): amount, note (+ **preset chips**, recents float first — Expense: Parking · Toll · Tax · Insurance · Car wash · Accessories; Service: Oil & filter · Tyres · Brakes · Inspection · Battery · Wipers), odometer (service), date. Presets exist because free-text notes made noisy cost rows; they fill the field, still editable — no stored taxonomy.

**Trip sheet**: name (+ past-name chips by frecency), start/end dates, start/end odometers (start prefilled with current km), live derivation card "232 km · ≈20,40 € fuel · ≈58,00 € all-in — at your averages. Readings are checked against your ledger."

All capture sheets: dirty guard (sheet pins, "Discard this fill? / Keep editing"), validation per §B2 table (soft = warn + "Save anyway"; hard = blocks and names the conflict).

### C6. Record pages

Every ledger row opens a page (push, zoom transition from the row): icon + title + date, fact rows, then a **Computed** panel where derivation exists. Fuel is the flagship: economy + "26,25 L over 378 km · since the 12 Jun fill" + verdict vs the user's average, plus honest degraded states — "This fill is partial. Economy resumes at the next full tank." / "A fill was missed before this one." / "Add the odometer to measure this interval." — and a reliability footer ("N full fills in a row. Economy is reliable."). The degraded panel is never red: **missing data is not an error**. Trip pages show both ≈costs + the double-count disclaimer. Odometer pages show source (manual/imported) and delta. Milestones open as a small glance sheet: "Milestones can't be edited." Edit = pencil (opens the capture surface prefilled); Delete = confirmed + undoable.

### C7. Reminders

List (Upcoming / Later / Done), builder, detail. Builder = "the contract is a sentence": kind, title (placeholder per kind), car, due **date and/or km** (whichever first), repeat chips (never / 6 mo / year / 2 years / 10.000 km / year-or-10.000 km / custom N months|km), alert-days multi-select (90/60/30/14/7/1) — and a live plain-words card: "ITV, every year, alerts 60, 30 and 7 days before." + pace line for km rules. Detail: due card ("55.000 km or 14 Mar — whichever comes first"), rule rows, **Done / Snooze / Delete**, "Done creates the next one from the rule."

Notifications: local only; delivery Right away or Morning digest (9:00, bundles a day's alerts into one note); kinds toggles (reminders / milestone anniversaries, milestones off by default); an honest preview card showing the user's own next alert; denied state gets the one quiet "Turn on in iOS Settings ›" row. Tapping a notification deep-links to the reminder's page with Back landing on Home.

### C8. Vault, onboarding, settings

**Vault** (per car): facts-only policy card (insurer, policy no., premium + vs-last-year trend, valid-until; gaps say "not on file" — never invented); renewal flow ≤30 days out: "Renews 17 Jul. Most policies roll over automatically." → **Renewed** (inline new-premium field, "Leave it empty if the price didn't change.") or **Switched insurer**; renewal rolls dates forward and re-arms the reminder. Papers: user documents (photo/scan/PDF), honest empty affordances.

**Onboarding**: three skippable beats — value line ("Koi keeps your car's story. Fills, services and reminders. Computed honestly, kept on your phone."), add-car (three fields: "Three fields. Everything else can wait." + MyCar import door), one local suggestion (e.g. Spain's ITV inspection reminder) offered once, never again. Zero-car state on every tab converges to "Add your car to begin".

**Settings** (sheet): appearance; units (fitted pickers showing *your own latest number converted* in each option — "decision by recognition"; footer "Amounts you logged never change."); currency (searchable, each row shows the format applied to a real amount); notifications page; Import from MyCar; **Export JSON + Export CSV** (one file per table); **Erase everything** (type-ERASE confirmation, "There is no undo."); privacy card up top: "Your data never leaves this device. No account, cloud sync or analytics. Export any time."

---

## D · UX pattern language

### D1. Navigation — "a book, not a deck of cards"

> **Push to go, sheet to do, fit to pick — and never two tall layers.**

- **Places push** (record pages, reminder pages, vault, car page, all-reminders): pages on the tab's stack, Back always means back, tab bar stays.
- **Tasks float, once** (capture, car form, reminder builder, settings): exactly one full-height sheet; a sheet never presents another tall surface — it continues by inline swap or by pushing on its own internal stack (Settings does this: currency/import/privacy push inside the sheet, back-only, swipe-close disabled while pushed).
- **Fits pick** (car picker, lens picker, page-size picker, unit pickers, swap window, milestone glance): short fitted sheets, parent visible, tap applies and closes itself — no Save buttons on pickers.
- Pushed pages never self-dismiss; they pop by path mutation. Dirty forms pin their sheet and ask ("Discard changes? / Keep editing"). Tab-leave resets that tab's stack. Notification taps tear down modals, land on Home, push the target page.
- Maximum depth anywhere: root → pushes → one task sheet → one fitted pick.
- `+` creates, pencil edits, trash deletes (behind detail or swipe, always confirmed). One icon per record type, used identically everywhere.

### D2. Time as pages (the Insights time model)

- **Page size × page position** are separate controls: size is a rare choice (menu on the period label — Month / Year / All), position is the frequent act (swipe or chevrons, one page per gesture).
- Pages are calendar-aligned and non-overlapping → any quantity maps to exactly one period. This dissolved a whole bug class: seven overlapping windows ("This month", "3 months", "12 months"…) had made one question yield four answers.
- The **whole page** slides with the finger (headline + charts + records move together — everything on screen answers for the same period); native snap physics; edges rubber-band (pages that don't exist are never rendered).
- **TODAY** appears whenever you're panned; current partial pages say "· to date"; each card repeats its period as a small receipt.
- Exceptions are principled: **Ownership is timeless** (pager folds away); a **plan's cap cycle is not a calendar page** (its gauge rides above the paged charts, anchored to its own dates); **All time doesn't page**.
- A month page ends with its records (chart → evidence → tap into the ledger); wider pages hand the list to History. History itself never gets a time control — an infinite scroll IS time navigation; one idiom lives where the charts live.

### D3. Color law

> **Color answers "what kind of money." Ink is everything else. Red stays earned.**

- Four domain hues, worn identically by a record's icon well, its detail chrome, and every chart of that domain — light/dark pairs, contrast + color-blindness validated: Fuel = the app accent green (#43823B / #4E9139 — one green in the app); Service amber (#9C731A / #BB8826); Expense blue (#337FB8 / #4E92CE); Contract plum — insurance + plans (#8A4879 / #A05C96).
- Mixed-kind money (monthly totals, cumulative) is a total, not a category: it wears strong ink. Distance, odometer, notes, milestones are not money: ink.
- Semantic colors are reserved: positive / attention (warnings, over-cap) / critical (destructive, hard errors). Never used as "series 4".
- Car accent colors are identity-only (photos, decoration), never data.
- Surfaces are warm paper (off-white / near-black warm dark), dark mode co-primary — authored together, never an inversion pass.

### D4. Chart grammar

- **Every chart is led by a headline number and a plain sentence; the chart is evidence, not decoration.** If a chart can't earn that, it's a stat table instead.
- No pies. Cost structure = ranked horizontal bars + closing sentence.
- One data series color per chart. Averages = dashed hairlines; best = filled dot, worst = hollow attention dot; projections = dashed tail + hollow endpoint, always ≈, dated in the caption.
- Max ~8 marks; labels only where they answer a question: the peak bar carries period + value; tap any bar to read it (selection replaces the peak label; clears on data change); line endpoints carry their values beside the dots; first/mid/last dates under the axis (collapsing to one label when all points share a month).
- Faint **ghost bars** past the window edges say "there's more history this way."
- A trend line needs ≥3 points to earn its space; below that, the numbers carry it.
- Buckets follow the page: weeks in a month, months in a year, years across everything.
- Numbers wear a monospaced tabular voice everywhere — numbers never jitter; estimates are ≈; units use locale formats ("1.234,56 €", "43.465 km").

### D5. Honesty patterns

- ≈ marks every estimate/projection; "to date" marks partial periods; early data says "Early days, based on N weeks."
- Derived values carry their basis inline: "6,9 L/100km · 378 km"; "over 378 km · about your usual 6,85".
- Missing data is stated, not styled as an error: "not on file", "no readings", "not computed yet" + what would compute it.
- Sums that would lie are withheld: litres total only shown when every fill carries litres; rates appear only past minimum spans (≥7 days for €/day, ≥2 pairs for economy).
- The chain-integrity line always tells reliability: "21 fills, all full" / "18 of 21 full. Averages shown as ≈."
- Rates derived without capital say so: "purchase aside."
- Sample data marks itself; anything imported-and-suspect is flagged, visible, and the user decides.

### D6. Voice

Plain, warm, factual, sentence case. Verdicts in words; never scolds, never gamifies, never exclaims. States facts, not warnings ("Renews 17 July. Most policies roll over automatically."). Errors explain and offer the fix. Refusals are stated in-product without apology ("Koi tracks costs, not income."; "Milestones can't be edited."; ""Not now" is honored quietly."). Reference strings: "Everything OK" / "All quiet for the next few weeks." · "Enter any two. The third is computed." · "Saved. Economy computed." · "Three fields. Everything else can wait." · "Nothing changes until you tap import." / "Nothing is fixed silently." · "Already part of your totals. This is that drive's share."

### D7. Type, motion, controls (pattern level)

- **Three type voices**: display (large titles/verdicts), text (UI), data (monospaced tabular — all numbers, dates, amounts, micro-labels in tracked uppercase).
- **Motion is calm**: 150 ms fades everywhere; exactly one spring in the app (capture success); reduce-motion gets fades/crossfades.
- Controls: capsule chips (selected = ink-filled for filters, accent-washed for options); fitted pickers apply-on-tap; segmented controls only where options are few and stable; toasts one-at-a-time (success 3 s · undo 6 s with a draining hairline · error persists), icon carries state, surface never turns red, Retry/Undo are the only actions that ride in a toast.
- Touch targets ≥44 pt; rows are real buttons; decorative glyphs hidden from the screen reader; dynamic type reflows to one column, charts keep headline + sentence as the accessible summary.

---

## E · Feedback ledger

| Round | Source | Ask (essence, some verbatim) | Decision |
|---|---|---|---|
| 1 · first structured critique | Tester R | Odometer records invisible in history; "odometer must always increase" (app accepted lower future values); + for adding vs pencil for editing; duplicated history inside car sheet; reminders must repeat and notify without opening the app; car creation accepts absurd values; records not editable/inspectable; efficiency read 6.9 vs car's 6.8 | All addressed structurally in 2.0: odometer readings became ledger rows; monotonic validation both directions; +/pencil doctrine; one-ledger rule (car page = 3 recent + link); recurrence + advance alerts + local notifications; validation framework; every record opens/edits |
| 2 · competitor bar | Tester M's MyCar data + screenshots | Match MyCar's completeness (per-fill detail with math shown, full stat tables, monthly+cumulative, cost structure, odometer curve, chain-integrity counts) without its chaos (6 dashboard tabs, rainbow pies, form-first capture) | Insights lenses with curated hierarchy; MyCar named the completeness bar and the anti-pattern simultaneously |
| 3 · domain color round | Tester M | "The greens don't differentiate — expense types look the same"; "charts should wear the record-type color"; "swipe through chart periods like Withings/Health, with snapping"; "I want ownership KPIs — purchase price, €/day, €/km"; vertical stat lists beat horizontal pills; MyCar's own contrast overdone ("take the principle, not the look") | Shipped 2.1.0: four validated domain hues + color law; window panning with month snapping + ghost bars; ownership ledger card; K2StatTable verticals. Refused from same round: pies, income, chart-tab IA, stored expense taxonomy |
| 4 · trips batch | Tester M | Trips ("senzillot però funcional" in MyCar): name, dates, odometers, derived km — plus his real 10 trips; expense/service type presets (his own rows read "Parking · Interparking…"); income tracking; "This month looks identical to 3 months"; finer weekly resolution; tap-to-read chart points | Shipped: Trips as ledger records (≈costs as views, refusing speed/efficiency/GPS), preset chips, weekly buckets (bug root-caused: the month window had borrowed a 3-month series), tap-to-read bars. **Income deferred** with design sketch on file |
| 5 · navigation round | Tester R (via owner) | Insights tabs ≠ History tabs — simplify; Withings model: few time filters + swipe across periods; "quantities but you don't know which period" (graph audit) | Shipped (unreleased): time-as-pages — Month/Year/All page sizes, pager with named period, whole-page swipe carousel, records under the graph; one-row header (lens in title menu, grain in period label). Explored and parked: overview-tiles + pushed lens pages (Health IA); grain-as-content |

Standing feedback-round pattern: real data in, side-by-side comparison, verbatim quotes recorded, every ask answered with ship / defer-with-design / refuse-with-reason — refusals are told to the tester, not silently dropped.

---

## F · Learnings

**Product**
- **Overlapping time windows are a bug factory.** Seven windows all ending "now" produced four answers to one question and made "This month" identical to "3 months". Calendar pages that never overlap dissolved the class; the stable-rate-vs-total tension disappeared with it (a page total is unambiguous; the lifetime page keeps the rate).
- **The period must live at the answer.** Users read quantities without their timeframe (the single most repeated critique). Fix at the source: the period is a control (pager), a receipt (card labels), and a phrase (headline qualifier) — not an implication.
- **Real imported data is hostile.** Money-only fills, litres-only fills, 0.0 odometers, years-wide gaps, name-only trips, US-gallon cars, sold cars, million-km typos. Every aggregate needs a defined behavior for each; "flag, never fix" is the only trustworthy posture.
- **Free text becomes taxonomy by usage.** Verbose notes ruined ranked cost rows; preset chips (recents-first) fixed grouping without a stored category schema.
- **Competitor parity is a menu, not a mandate.** Match the completeness (stats, detail pages, chain flags), refuse the shape (dashboard IA, pies, income, speed fictions) — and say why, in-product where relevant.
- **Refusing features is a designable act.** "Koi tracks costs, not income" surfaced at import converts a limitation into trust.
- **Depth by invitation works.** The calm persona never meets a chart; the conscientious one is two taps from everything. Neither pays for the other.

**Process**
- **Mock the interaction in HTML before building.** The time-pages round: an interactive artifact (real swipe, three header variants) let the owner *feel* options and pick in minutes; the Swift build then had a settled target. Two rounds of throwaway HTML beat weeks of native iteration.
- **Audit tours as evidence.** UI tests that walk every surface and screenshot each step (failures don't stop the walk) turn "did we break anything" into reviewing a contact sheet — and they double as marketing-shot automation and use-case documentation.
- **Adversarial seed data.** A dedicated stress fixture (53-char names, 7-digit odometers, ×47 over-cap, million-euro costs, an empty car) catches layout and honesty failures the happy seed never will.
- **Fixture-driven parity tests.** The tester's real export with its known totals (economy avg, spend, fill count) as regression assertions keeps the import + math honest forever.
- **Decisions need a ledger.** Numbered design docs with LOCKED / SUPERSEDED / REFUSED markers made every later round cheaper — supersession is explicit, never archaeology.
- **One design canvas, frozen after each milestone.** Components get designed once, reused exactly; "new frames only" prevented drift.

**Platform-generalizable technical**
- Value **identity must include a revision** for diffable UIs: id-only equality made photo edits invisible until restart. Any UI framework diffing by equality has this class.
- **Locale-safe money parsing** is a 1000× corruption class ("20.000" as 20.0), not an edge case.
- **Migration is a one-way door**: old builds re-saving silently strip new fields — additive optional fields + a frozen old-file decode test, forever.
- Uppercase text transforms can leak into **accessibility labels**; screen-reader strings need their own pass.
- Calendar math: anchor cycles to the contract's day-of-month, clamp short months, and align windows to calendar boundaries — rolling windows mislabel their own axes.

---

## G · Missing / could-have (with stances)

| Item | State | Stance |
|---|---|---|
| Income tracking | Deferred, design sketched (income record kind, positive hue, ownership "Incomes −" + net row, excluded from cost charts) | Vision-locked out of the ledger; would touch every money surface. Revisit only on repeated real demand |
| Koi-export re-import (full backup round-trip) | Missing | Should-have: completes the export promise (restore/device-move without iCloud) |
| Record-level import dedup | Vehicle-level only | Should-have for incremental re-imports; natural key = vehicle+date+amount+odometer |
| Multi-item service entries (per-line costs) | Deferred | MyCar parity item; presets cover the common case; revisit with real demand |
| History search | Missing | Nice-to-have once ledgers get big; filters cover most needs |
| Receipts/photos on records | Missing (documents exist per car) | Natural extension of the vault pattern |
| Widgets (lock/home screen) | Named in vision backlog | One quiet widget fits the thesis ("everything OK" / next reminder) |
| Trip-computer cross-check ("car says" field) | Named in vision backlog | Honest drift display; low cost |
| iCloud backup/sync | Explicitly later | Tension with "no servers" story is resolvable (CloudKit private DB) but changes the privacy page; not before a real multi-device ask |
| EV charging economics | Explicitly later | Needs its own cost model (kWh, home/public tariffs); must not add logging burden to ICE users |
| Business/private trip flag + trips CSV export | Refused v1, possible v2 | Only with a real expensing use case |
| Overview + pushed lens pages (Health-style IA) | Designed alternative, parked | Revisit if the one-row lens menu feels like a hidden mode after living with it |
| Grain-as-content (month pages only; year/all as summary cards) | Sketched | The "zen" simplification; composes with current model |
| History period jump (tap a bar → that month in History) | Sketched | Cheap bridge between chart and ledger |
| Multi-currency totals, iPad/Mac, Android | Later / separate | Out of iOS core scope |
| Accessibility completion pass | Partially deferred (an audit batch was consciously postponed) | Debt: faint-ink contrast in dark, row semantics, 44 pt sweeps — scheduled before any major release |

---

## H · Non-functional requirements

**H1. Privacy (public, load-bearing).** The website and App Store listing promise: no account, no email, no sign-in; data stored only on device; no ads, trackers, or third-party analytics; the app contacts no outside services; export or delete everything at any time; data rides the user's own encrypted phone backup. **Every feature must keep these sentences true** — they are product law, not marketing.

**H2. Persistence.** One JSON document in app storage, written on a serial queue, OS file-protection encryption at rest. Corrupt files are backed up (`.corrupt`) then started fresh — never overwritten in place. All schema evolution is additive-optional. Full-fidelity JSON export + per-table CSV export.

**H3. Localization.** Five locales shipped (en, es, ca, fr, nb); the primary human persona is Catalan. ~725-key catalog. Design for +30% string length; every user-visible string localized including accessibility labels; plurals per CLDR; unit/number/date formats always locale-driven. Es-ES formats are the design default ("1.234,56 €"). Catalog is maintained by hand (translations reviewed, not machine-dumped).

**H4. Accessibility.** Dynamic Type through the largest sizes (single-column reflow; charts expose headline + sentence as their summary); VoiceOver labels on every interactive element; contrast AA for every semantic pair in both themes; reduce-motion honored (fades only). Known debt listed in §G.

**H5. Testing.** Three tiers: (1) ~100 unit tests encoding the §B2 invariants — economy chain, trail folding, money laws, cycles/pooling, recurrence, validation, locale parsing, migration decode; (2) import-parity tests against a real anonymized export with known totals; (3) UI tours — a full-surface screenshot walk (light + dark), a stress-fixture walk, and targeted probes (navigation regressions, dirty guards, deep links, swipe paging). Failures in tours collect evidence rather than halting.

**H6. Performance guards.** Bucket loops capped; derivations computed per render from small collections (a garage is thousands of records, not millions); images downscaled + metadata-stripped at intake; no networking.

**H7. Dev harness.** Launch-argument matrix drives every state headlessly: seeded/calm/empty/stress garages, tab/lens/page-size/scoped-car/date-offset selection, capture sheets open, over-cap fixture, deep-link simulation, notification test. This is what makes the screenshot tours and rapid design iteration possible; treat it as a feature.

---

## I · Use cases (acceptance narratives)

1. **First fill to first number.** New user adds a car (three fields), logs a fill with odometer: "Saved." Second full fill 378 km later: saved moment shows "6,9 L/100km over 378 km". The fuel lens sparse card had said "Two full tanks to go" with progress dots; now the number replaces it. Nothing was shown before it could be computed.
2. **The switcher.** Tester-M profile exports MyCar CSV (multi-year, 49 fills of which 43 money-only, trips, incomes, one US-gallon car, a sold car). Preview maps vehicles, offers litre conversion, flags 3 odd readings, states skipped income count. Import lands: sold car arrives archived, economy computes only where full-tank chains exist (≈ elsewhere), trips carry no invented distances, totals match the source app's to the cent. "Review now" walks the flagged readings; the user fixes one, keeps two.
3. **Subscription mid-cycle.** Car on a 1.500 km/mo pooling plan, cycle resets the 23rd. Garage chip reads "1.240/1.500 km"; car page gauge shows used vs pooled budget with carry-over footer and "At your pace, ≈1.410 by 30 June. Under the cap." Driving past the budget flips chip + gauge to attention and counts the overage; the pace line stays factual; nothing flashes.
4. **"What did the inspection cost last spring?"** Insights → Cost → page back to April (swipe or ‹). Ranked bars show Services; the records list under the chart has the ITV row; tap → record page; Back returns to April, TODAY jumps home.
5. **Renewal without a nag.** Insurance renews in 16 days: Home says "Coming up", the vault card shows the date + "most policies roll over automatically." After the date: "Renewed?" → one tap, optional new premium, dates roll forward a year, next year's reminder arms itself. Premium trend appears ("+14 € vs last year").
6. **Finance ends.** Last month of a 48-month loan passes: car page shows the one-time "All 48 payments logged. Paid off?" nudge. Mark paid off → ownership flips to owned, billing stops, every record stays, a milestone lands in History. "Not yet" is remembered and the nudge never returns; the car form can flip it any time.
7. **Two-car household.** Insights "All cars": cost and distance aggregate; fuel shows two per-car tiles (never a blended average). Car scope chip filters everything; a single-car garage never shows the chip at all.
8. **A named drive.** "Salou" trip: start/end odometers → "232 km · ≈20,40 € fuel · ≈58,00 € all-in — at your averages." The trip page states it's a share of money already counted; History shows it as a distance row (no month-money contribution); the Distance lens lists it in the period's Trips card.
9. **Deletion honesty.** Deleting a fill warns it leaves History **and** the averages; undo restores everything. Deleting a car demands its name understood ("…records, reminders and documents. There is no undo."). Erasing all data requires typing ERASE.
10. **Sold the car.** Set sold price → Ownership ledger closes with "Sold for −X" and a **Net cost** total; archive it → it leaves Home/Garage tallies but its whole story remains one tap behind "Show archived records".

---

## Appendix 1 · iOS implementation advisories

For a rebuild on Apple platforms specifically:
- SwiftUI + custom-drawn charts (the grammar needs exact control; a charting framework fights it). One shared zoom-transition namespace makes ledger rows morph into their pages (iOS 18+).
- Time-page swipe = a paged `TabView` over [previous, current, next] intervals, pages **tagged by their interval start date** so the post-settle re-center is invisible; settle mutates the anchor inside a no-animation transaction; chevrons drive the same carousel. Inner vertical ScrollViews coexist (axis separation). Missing edge pages simply aren't rendered → native rubber-band.
- Fitted sheets: `presentationDetents` with computed row heights; pickers apply-on-tap and dismiss themselves.
- Navigation: typed path arrays per tab (`NavigationStack`), one shared destination table, pop by path mutation only — `dismiss()` inside pushed pages eventually rebinds to a sheet and kills Back (hard-won bug).
- Custom in-sheet keypad for fuel capture (locale decimal separator; system keyboard for text fields elsewhere).
- Notifications: `UNUserNotificationCenter`, identifiers `reminder-<id>-<days>`, re-schedule on every odometer write + app foreground; digest = one daily bundled request.
- `.textCase(.uppercase)` leaks into accessibility labels; UI tests should match labels case-insensitively.
- Store the model as Codable structs with hand-written `decodeIfPresent` only where a field predates ids; never let a new non-optional field into the wire format.
- Localization via String Catalog; note the build system never writes translations back — the catalog is source of truth, edited directly.

## Appendix 2 · Open questions

1. **Monetization.** Undecided. The vision document recommends **paid up front, no subscription** (subscriptions fight the privacy story; nag walls are constitutionally banned). Options weighed: free forever (privacy halo, no revenue), paid up front (aligned, small market), one-time unlock of nothing-in-particular (tip-jar honesty). Whatever is chosen must not add accounts, upsells, or feature hostage-taking.
2. **Default Insights page size.** Currently Month (lands on today's partial page, Withings-style, sometimes sparse). Alternative: Year. Needs owner sign-off after living with it.
3. **Lens picker title copy.** "Which lens?" parallels "Which car?" but "lens" is new user-facing vocabulary. Alternatives: "What to look at?", plain list with no title.
4. **iCloud backup** timing (see §G) — the privacy page commits to updating itself *before* any such feature ships.
5. **Digest hour** is fixed at 9:00; making it adjustable is trivial but unrequested.

---

*End of specification.*

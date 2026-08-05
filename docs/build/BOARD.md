# Build board

The build-phase working memory — replaces the investigation ritual (discharged, D-036).
Backlog compiled from `docs/investigation/06-decision.md` §4 (adopted as D-033);
severities are that doc's: **⛔ blocker** · **▲ important** · **▽ later**. Item detail
lives in §4 — this board tracks status, not prose.

**Rhythm (deliberately small):**
1. Session start: read this file. Blockers first; inside bucket A, ⑤ runs first.
2. Session end: update statuses + append one session-log line. New decisions →
   D-0xx in `docs/investigation/decisions.md`. Spec amendments →
   `docs/build/spec-delta.md` (create on first use), never edit `koi-core-spec.md`.
3. Statuses: `todo` · `doing` · `done` · `blocked(by)`.

## Now / Next

- **OWNER REVIEW OWED (2026-08-05): Session 8 done — the app surface, built to the design
  (D-060..D-064).** The visual-design phase's handoff is vendored at `docs/build/design/` (18 sheets,
  the authoritative `spec-amendments.md`, the reconciled fixture ledger) and **precedence changed**:
  design first, `wireframes.md` demoted to reference. Shipped, in the order the design asks for:
  **the token layer** — `palette.light` + `palette.dark` as authored siblings behind `useKoiTheme()`,
  plus `control`/`radius`/`fab`/`motion`, and the four defects the design named (positive was literally
  the fuel hue; inkFaint failed AA; StatusBar pinned dark under `userInterfaceStyle: automatic`; an
  off-palette `#F6EFE3`) — **the control language** (rows, the eight `domainWash` + `domainText` wells,
  three chip species, four button variants with emphasis as ink, the toast, the three layer species,
  the stat table, the gauge, the confirmations) — **`@koi/i18n`** with the `Intl` grouping trap asserted
  in a test rather than described, and IBM Plex Mono bundled — **the four-tab shell** with per-tab
  stacks, the detached `+`, the floating Settings and an app-level toast host — **Garage · car page ·
  car form** rebuilt to §C4 (car rows stop wearing the fuel green; the car page shows three recent rows
  and a link, not a second ledger; fuel type is an enum by chip; archive has a write path now) —
  **Home's state machine** — **Settings + Sync** with the three-state privacy card and the erase dialog
  keyed on *has ever synced* — and **capture → Odometer** with Koi's own keypad, the five well states,
  the soft/hard validation split, inv.10's edit exclusion and the dirty guard. Two unimplemented
  mechanics landed with them: **swipeable rows** and the **sheet dirty guard** (both gesture libraries
  were installed and imported nowhere). Three things the session refused to fake, each recorded rather
  than smuggled: Home's **money and €/km do not render** because no money records exist and a `0,00 €`
  would claim a sum of no records (D-063); the car page's **`PLAN`/`OWNERSHIP`/`CARE` groups are
  absent** because the schema has no ownership kind, plan, cap, reminder or document; and Settings
  renders **only rows whose destination exists**. One number in the amendment set is stale and is now
  corrected in `spec-delta.md`: July's rate is **1,18 €/km** (487,90 ÷ 412), not the `0,77` that
  survived as scenery on sheet 08 — the sheets and the ledger derivation agree, the summary line did
  not. `archived_at` **joined the sync rules with its write flow** (D-061), which is the one contract
  change: an ordinary client-writable column, so archive/restore takes ordinary per-column conflict
  analysis, proved by asserting `record_version` increments rather than reading the local row.
  **Proof:** both sync tiers green (server 11 files/17 tests; mobile 2/6 including the new archive
  round-trip, server receipt `applied 1 · dead-lettered 0`), all unit tiers green (i18n 12, mobile 47,
  server 42, domain 71), golden vectors **byte-identical** on node + jsc + hermes
  (md5 `f93b1d6b1717043d97f16b0a17416681`) — `@koi/domain` untouched — and eight simulator screenshots
  in **both schemes**: Home zero-car (light + dark), Home *All clear* with the August pulse computed
  from the trail (378 km), Garage with two live cars + one archived (light + dark), the car page, the
  odometer sheet with its keypad, and Settings. Scripted taps are still blocked (bucket H), so the
  screens were reached by seeding the design's fixture and landing the app on each route — the
  temporary entry file is reverted, not committed. **Owner review owed on the surfaces.**

- **OWNER REVIEW OWED (2026-07-28): Session 7 done — the wireframe pass (D-057..D-059).** Bucket D's
  first item, opened on the owner's own Session 7 brief (the brief being typed into the session was the
  Session 6 sign-off). Deliverable is `docs/build/wireframes.md`, a reviewable design document — **no
  screen code was written, and none should be until this is reviewed.** ASCII/block screens for the
  whole surface: the shell (four tabs + detached `+` + floating Settings + per-tab stacks + the route
  map the four tabs imply), Home's three states with the month pulse and Last-fill card, History's
  month-grouped feed with row anatomy per record kind, the Insights header + the time-as-pages
  carousel and all four lenses card by card, Garage/car page/car form, all six capture surfaces
  including the fuel keypad's derived-pill state machine and the saved moment, record pages with every
  degraded fuel panel, reminders + notifications, the vault, onboarding, and the Settings sheet.
  **Three gaps resolved rather than drawn:** the S-4 review queue joins Home's *state machine* — so
  `All clear` can no longer say "Everything OK" while two devices disagree — with a second door in
  Settings (D-057); sync, the passkey sign-in, the recovery-codes reveal and the privacy card move off
  the garage into the §C8 Settings sheet under a page called `Sync` (not "Sync & devices" — there is no
  device registry), with the sharpest honesty fix being that **`Erase everything` becomes `Erase this
  device` for any device that has ever synced**, on or paused alike, turning sync off first — because a
  local wipe on an enrolled device re-bootstraps from the checkpoint (D-058); and dark mode carries
  colour **roles** now, with the authored palette as its own board item sequenced before History
  (D-059). **The comparison against existing code earned the pass:** 21 places where `@koi/mobile`
  already contradicts §C/§D, with file:line — notably the car page re-introducing a shipped-and-fixed
  defect (it lists the whole ledger; §C4 caps it at 3 rows + `Full history ›`, and §E round 1 records
  Tester R finding exactly this in the old app), `positive === domain.fuel`, every number formatted by
  a bare `toLocaleString()` while `@koi/domain`'s own `formatAmount` is imported nowhere, and a sync
  card whose "N records kept here so far" counts upload-queue rows. Verdicts: `_layout.tsx` scaffolding
  · `index.tsx`/`car/[id].tsx`/`review/*`/`components.tsx`/`theme.ts` rework with a carry-out list of
  every proven string · all sync/domain plumbing keep. 18 owner questions in §16 (the sharpest: do
  plan charges become ledger rows, so History's whisper and the Cost lens stop disagreeing), and §17
  carries the build order. Method: two workflows — 10 agents producing per-surface spec-element
  inventories + the code audit, then 6 adversarial lenses (constitution/invariants, honesty/voice,
  nav/time, colour/chart, completeness vs §C, internal consistency) with a refute-first verify pass,
  **which caught a real product-law violation of its own** — the privacy card and erase dialog were
  keyed on the sync toggle rather than on "has ever synced," so a paused device (synced once, then
  turned off) would falsely claim "no account, never leaves this device" while its passkey and
  server-side records both still existed. Fixed in-session along with 47 other confirmed findings
  (cap-gauge math against the bare cap instead of the pooled budget, the car page rendering
  OWNERSHIP on the subscription fixture, arithmetic that didn't reconcile, missing car-form controls);
  see the Session 7 follow-up entry below for the full account. **Owner review owed on the current,
  already-corrected document.**
- **Session 6 done — real auth end-to-end (D-053..D-056).** Opened on the owner's own Session 6
  brief (the gate below — the owner typing the brief directly into the session was the sign-off).
  better-auth mounted in-process, Drizzle-integrated (no separate migration mechanism), replacing
  `KOI_DEV_AUTH` (deleted, `auth.ts` gone). Passkey-primary, single pre-seeded owner account
  (simplest thing, doesn't foreclose S-14); passwordless bootstrap for the founding passkey only,
  guarded server-side against a second silent claim. Recovery codes built as a standalone custom
  plugin — NOT better-auth's `two-factor` (that plugin is real 2FA, wrong shape for a passkey-loss
  fallback; also its raw crypto helpers turned out to be type-only exports, found the hard way) —
  proven end-to-end in 4 new server scenarios. All three sync tiers re-proven green under real auth,
  twice each (server 17, mobile 5 top-level covering 9+3 scenarios); both unit tiers unaffected.
  **Native passkey on Expo/iOS (Ⓓ) — DISCHARGED, proven on device (D-055).** Real Face ID ceremony
  on the simulator: passkey registered (`multiDevice`, `backed_up`), session created, 10 encrypted
  recovery codes stored, and the resulting JWT **accepted by PowerSync itself** (`Sync stream
  started user_id: user-owner` … `checkpoint_complete`, from `powersync-react-native ios/26.5`).
  No password fallback needed. Four preconditions found the hard way, all now documented: Associated
  Domains needs a PAID Apple account (and the team id that matters, `AB72ZGY444`, is NOT the one on
  the keychain cert); the dev loop needs a resolvable domain serving an AASA over TLS (recipe:
  `?mode=developer` + `swcutil developer-mode` + hosts override + simulator-trusted self-signed
  cert); `@better-auth/expo`'s client and server plugins are a matched pair (RN sends no `Origin`,
  so POSTs 403 `MISSING_OR_NULL_ORIGIN` until the SERVER `expo()` plugin reads the `expo-origin`
  header); and registering a passkey does NOT sign you in (better-auth creates a session only on the
  authentication path — first-time setup therefore shows two Face ID prompts). Taps were owner-driven
  (bucket H still blocks scripted iOS UI), so every claim is backed by a DB/server-log check rather
  than screen-reading. Sign-in surface: no separate screen — "Turn on sync" IS the sign-in step
  (spec-delta.md). **Owner gate owed before bucket D (app surface) or S-7.**
- **OWNER GATE OWED (2026-07-27): Session 5 done — ③ local-only → sync-on migration (D-052).** Bucket
  A's last ⛔ before auth. Verified from the PowerSync source (not assumed): every write already
  queues locally regardless of connection, so "local-only" is just never having called `connect()` —
  turning sync on is one call, and the existing backlog drains through the SAME base_version
  machinery that already covers "baseless offline create-then-edit" (D-037 law 3). No migration write
  path was built because none was needed. Client: `app_meta.sync_enabled` gates `connect()` entirely
  (zero network calls while off, matching the local-only-no-account floor); the garage screen carries
  a reversible sync toggle with a live `ps_crud`-backed pending count and honest copy in both states
  (spec-delta.md). Proven on the real stack: a new `sync-tests/local-first.test.ts` (3 scenarios) —
  a full single-device offline backlog (create/edit/delete) drains flag-free with correct versions; two
  independently-local-only devices both join one household with no loss; an offline car-cascade-delete
  survives the same way. On-device: screenshotted the local-only default correctly refusing all network
  activity with the server unreachable; the live tap-through-to-synced screenshot is blocked by the
  still-missing Accessibility grant for scripted iOS UI (bucket H, tracked since Session 1) — not new,
  and the automated real-stack proof already covers the same code path exhaustively. **Do NOT open the
  better-auth passkey round-trip until the owner signs off** — that was the stop line for this session.
- **NEXT (Session 6, pending that gate): better-auth passkey-primary + recovery codes, full round-trip**
  (order per §4.A — the last piece before S-4/③ can be considered fully closed out). Brief in
  `docs/build/next-session.md`.
- **OWNER GATE OWED (2026-07-26): Session 4 done — the client exists.** @koi/mobile is scaffolded and
  running (Expo SDK 57 / RN 0.86 pinned, D-048), the PowerSync client honours the full S-6 contract
  (D-049), and the **S-4 review queue is built with its `resolved_at` write flow** (D-047) — one ⛔
  blocker down. The Ⓒ proxy-Hermes caveat is discharged (D-050). Proven twice: the app's own modules
  against a real stack in CI, and the same nine scenarios on the iOS simulator (real Hermes +
  op-sqlite + RN SDK). **Adversarially reviewed (D-051):** the workflow's verify pass hit a token
  quota mid-run, so findings from the 4 lenses that did complete were adjudicated by hand instead —
  6 real defects fixed (a stale reference-client schema, an evidence-display + restore bug in the
  S-4 payload reader, a silent-success bug in the restore write, a review-queue action that could
  silently vanish a re-entered reading, a toast timer that could reset early, a prototype-pollution
  hardening gap), 3 tradeoffs recorded rather than changed, both sync tiers re-verified green
  afterward. build-ops/test-integrity lenses never ran — a narrower follow-up pass is owed, not
  blocking. **Do NOT open ③ (local-only → sync migration) or the better-auth passkey round-trip
  until the owner signs off** — that was the stop line for this session.
- **NEXT (Session 5, pending that gate): ③ local-only → sync-on migration**, then passkey (order per
  §4.A). Brief in `docs/build/next-session.md`.
- **Owner gate — tombstone stance RESOLVED (2026-07-25, D-046):** owner chose **bucket-filter**.
  Sync rules now carry only live rows (`WHERE deleted_at IS NULL`); a delete propagates as a
  checkpoint row-removal, clients never hold tombstones, and deleted content never ships to a
  device enrolled after the delete (H1 satisfied structurally). This discharges the "stop shipping
  tombstone content to new devices" S-7 obligation; S-7 still owes the `dead_letters` sweep.
  Re-proven on the real stack (13-scenario torture tier green). **Session-3 approval to open S-4/③
  is still owed** — do NOT open them until the owner signs off.
- **Owner gate owed (2026-07-23):** Session 3 (S-6) done — see the session log + D-039..D-046.
- **Owner gate passed (2026-07-22):** Session 2 approved — D-037 conflict semantics
  (later-arrival wins + displaced-value flag), D-038 interim stances (DELETEs
  dead-letter until S-6; archived_at/resolved_at unsynced until their write flows;
  household_id/car_id not patchable), and the `KOI_DEV_AUTH` default-off gate all
  signed. Session 3 may open on S-6.
- **Owner gate passed (2026-07-21):** Session 1 approved. Repo moved to
  `gariasf/koi` + private remote `github.com/gariasf/koi` created and pushed; legacy
  dir renamed `koi-app`; capture-feel native builds purged; hardening calls delegated
  and kept. Session 2 may open on ⑤.

## Backlog

### A · Sync protocol & data model
| st | sev | item |
|---|---|---|
| done | ⛔ | ⑤ base_version per-column protocol (S-5) — Session 2, D-037: proven on real stack, torture-tier covered |
| done | ⛔ | accept-with-2xx exhaustive op-handling (dead-letter/flag unknown ops, never skip) — Session 2, D-038: registry + content-hash dead letters + synced flags |
| done | ⛔ | S-14 household non-preclusion — schema stance from the first migration — Session 2: households table + household_id + updated_by on every record from migration 0000 |
| done | ⛔ | S-6 delete model (tombstones, undo-survives-sync, cascade, late-child flag) — Session 3, D-039..D-045: migration 0001 tombstone cols + `deleted_via` provenance; DELETE→tombstone; same-device resurrection; atomic cascade + per-child conflict; late-child; edit-vs-delete both orders; DELETE dead letters terminal (D-044); proven on two @powersync/node clients |
| done | ⛔ | S-4 client post-merge review queue ("Review now" pattern; where flags land) — Session 4, D-047: all 9 sync kinds + 7 domain kinds rendered and resolvable in @koi/mobile; `flags:PATCH` resolve latch + `resolved_at` joined to the sync rules with it; unknown kinds still shown; no action offered that the architecture cannot deliver (deleted records get "enter it again", never "restore") |
| done | ⛔ | ③ local-only → sync-on first-enable migration, lossless — Session 5, D-052: no migration write path needed (every write already queues locally pre-connect); `app_meta.sync_enabled` gates `connect()` (zero network calls off); proven via 3 new torture scenarios (single-device full backlog, two independent devices join one household, offline cascade delete), all flag-free |
| todo | ▲ | S-7 erase-everywhere (truncate + purge ledger + compaction + ≤24 h revocation) |
| todo | ▲ | S-9 import remap + dedup ordinal |
| todo | ▲ | S-1/S-2/S-3/S-8/S-10/S-11 (ids · versioning · derived-never-sync · recurrence idempotency · unknown-field round-trip · offline-first capture) — S-2/S-3 schema stances landed in Session 2 (record_version everywhere; no current_odo column, derived via domain); server-side S-10 stance = strict-reject→dead-letter, client half still owed |
| todo | ▲ | S-12 preference split (synced vs device-local) |
| todo | ▲ | S-13 per-device notification scheduling (no push infra) |
| todo | ▲ | engine-agnostic domain set: lineage swap, occurrence identity, dedup ordinal, settings singleton, "keep both", post-flag validation |
| doing | ▲ | sync torture-test suite (Spike ② scenarios graduate into it) — Session 2 seeded 5; Session 3 grew it to 13 (S-6 tier) on two @powersync/node clients + CI job; Session 4 added a SECOND tier: 9 scenarios driving @koi/mobile's own schema/connector/write functions, run under Node in CI and on the iOS simulator from one module (D-049); Session 5 added a THIRD file (`local-first.test.ts`, 3 scenarios): single-device offline backlog drain, two independently-local-only devices joining one household, offline cascade delete (D-052); Session 6 added recovery-code generate/verify (`11-recovery-codes.test.ts`, 4 scenarios, D-054) — server tier now 17 |

### B · Backend / infra / auth
| st | sev | item |
|---|---|---|
| done | ⛔ | better-auth passkey-primary + recovery codes + no-email FULL round-trip — Session 6, D-053..D-056: mounted in-process, Drizzle-integrated; single pre-seeded owner, passwordless-bootstrap-once guard; recovery codes as a standalone custom plugin (not two-factor); KOI_DEV_AUTH retired; all 3 sync tiers re-proven under real auth. **Ⓓ discharged: real Face ID round-trip on the simulator → passkey + session + recovery codes persisted, JWT accepted by PowerSync (`checkpoint_complete`, D-055)** |
| todo | ▲ | Android-over-network initial-sync measurement |
| todo | ▲ | self-hosting ops: WAL-slot alert, compaction cron, disk alert, ~6-mo SDK windows |
| todo | ▽ | server discipline: no user content in logs, no analytics, no 3rd-party processors |

### C · Domain / CI
| st | sev | item |
|---|---|---|
| done | ▲ | on-device (RN-bundled) Hermes golden-vector CI step — Session 4, D-050: new `conformance-rn-hermes` job builds Hermes from the tag the installed react-native pins, asserts compiler identity + HBC version (RN 0.86 is HBC 98; the jsvu proxy is 96), runs the vectors from source AND as RN-hermesc bytecode — md5 f93b1d6b… both ways. jsvu job kept as a canary. Still owed, narrowly: a device/emulator run for the per-OS Unicode provider (normalize NFC) |
| done | ▽ | @koi/domain primitives build-out — Session 1: money/civil-date/ordering/ids/economy, ESLint bans, vectors byte-identical tri-engine (md5 f93b1d6b…). date-fns v4 stays the sanctioned calendar dep; primitives needed none of it (hardening calls delegated to assistant at gate; kept) |
| doing | ▽ | i18n setup: **the package exists and the formatter half is done** — Session 8, D-064: `@koi/i18n` ships the locale edge (km/litres/economy/€ per L/€ per km/km per day/dates/`≈`/counts/`parseKm`), 12 tests including the one that asserts `Intl`'s `minimumGroupingDigits: 2` trap directly (`1148` vs `1.148`), and an ESLint ban on `Intl`/`toLocale*` inside `src/`. Still todo: **i18next + shared JSON catalogs**, adopting the Selector API from the start — i18next v27 plans to drop type-level string keys (parking-lot promotion, D-035) |
| todo | ▲ | **TimelineEvent projection (§B1) in @koi/domain** — pure, read-only, deterministic; tint expressed as a token name (`'fuel' \| 'service' \| 'expense' \| 'contract' \| 'ink'`), never a hex, so the palette stays at the edge. History's mixed feed, the car page's 3 recent rows and Insights' record lists all need it, and it is the one place inv.7's fold rule should be decided (wireframes §3.2, §15.4) |
| todo | ▲ | **lens derivation engines in @koi/domain** — the full→full economy chain walker (inv.1-4: partial accumulation, `missedPrevious` restart, recent-mean-of-≤5 with the ±5% dead band and the trend word) · distance bucket interpolation + today-anchored projection (inv.21-23) · the plan billing series (inv.13-15, 19) · cap cycle + pooling (inv.24-27) · page bucketing (weeks in a month, months in a year, years across all). Domain today has only `economyL100km` for a single interval; Fuel, Distance, Cost and Ownership all block on these (wireframes §15.4) |

### D · Clients (mobile + web)
| st | sev | item |
|---|---|---|
| done | ▲ | **wireframe pass** — Session 7, D-057..D-059: `docs/build/wireframes.md` (18 sections, ~3.2k lines) — shell · Home · History · Insights header+pager · four lenses card-by-card · Garage/car/car-form · capture (chooser, keypad, other-type, trip, odometer, note) · record pages incl. every degraded fuel panel · reminders+notifications · vault · onboarding · Settings. Three gaps RESOLVED, not just drawn: the S-4 queue joins Home's state machine (D-057), sync+account+privacy-card land in the §C8 Settings sheet (D-058), dark mode carries roles now with the authored palette as its own item (D-059). 21 places the existing code already contradicts §C/§D are listed with file:line (§15.3), and §17 carries the build order that falls out. **Adversarially reviewed**: 6 lenses (constitution/34 invariants, honesty/voice, nav/time-as-pages, colour/chart grammar, completeness vs §C sentence-by-sentence, internal consistency) with a refute-first skeptic pass, 66 raw findings → 48 confirmed (2 blocker, 25 important, 21 minor) → all 48 fixed same session. The blocker: the privacy card and erase dialog were keyed on the sync toggle, not on whether the device has ever synced, so a device that paused sync after using it would see "no account, never leaves this device" while its founding passkey and server-side records both still existed (§H1 violation) — both now carry a third "paused" state, keyed on "has ever synced". Also fixed: cap-gauge math drawn against the bare cap instead of the pooled budget (inv.25), a car page rendering the OWNERSHIP group on the subscription-plan fixture car (inv.15), the Ownership lens example switched to the owned Ibiza, a stale cap cycle window dated before "today", several arithmetic reconciliation errors (trips summing past their own page's headline km, a `km/day` computed over more days than the page contains), the review queue reusing Home's reserved "Everything OK"/"Needs you" strings, the car form missing photo/mark-paid-off/mark-as-sold controls, a no-policy vault state, and 4 stale `§6.3`/`§9` cross-references. **Owner review owed before the four-tab build.** |
| done | ▲ | **the four-tab shell + app-level toast host** — Session 8, D-062: `app/(tabs)/` with four per-tab stacks and `popToTopOnBlur` (leaving resets the stack, screen state survives because the root never unmounts), the detached ink FAB and the floating Settings button on every root, and `ToastHost` above every layer. The toast host closes a **data-loss bug**: the undo closure used to live in the toast's own state, so a second delete inside six seconds silently made the first permanent — closures now queue and each expires on its own 6 s, collapsing to `2 records deleted.` with one Undo. Shared destinations are registered per tab (the review queue in Home's stack *and* the Settings sheet's) with screen bodies in `src/screens/` and one-line route re-exports. The route-param smuggling a car delete needed is gone |
| done | ▲ | **authored dark palette + token layer** — Session 8, D-060: `palette.light` + `palette.dark` as full siblings behind `useKoiTheme()` (scheme · reduce-motion · fontScale · `stacked`), plus `control`, `radius` (eight named roles), `fab` and `motion` — tokens `theme.ts` had none of. All four named defects fixed: `positive` is a teal and no longer the fuel hue, `inkFaint` clears AA (4,59:1 on paper), `StatusBar` is `"auto"` against `userInterfaceStyle: automatic`, and the off-palette `#F6EFE3` went with the shell banner that used it. Emphasis is ink (primary buttons 4,10:1 → 15,29:1); the accent keeps exactly one job, tinted interactive type. `Appearance` (System/Light/Dark) ships in the same increment per D-059, device-local in `app_meta`. Verified on the simulator in both schemes |
| done | ▲ | **locale formatter edge layer** — Session 8, D-064: `@koi/i18n` + a `useFormat()` hook, which is also where the Units setting lands later. Every number in the app now goes through it; the bare `toLocaleString()` calls are gone, and `Intl` is banned in the package that replaced them because it drops the separator on four-digit values. IBM Plex Mono is **bundled** (Menlo is Apple-only and falls back to a proportional face on Android) |
| doing | ▲ | full Bundle A app build (capture + ledger + record + Insights) — Session 8 built everything the schema supports: the shell, the control language, Garage/car page/car form (rebuilt to §C4, archive included), Home's state machine, Settings + Sync, and capture → Odometer with the keypad, the soft/hard split and the dirty guard. **What remains is gated on tables, not on architecture:** History, Insights' four lenses, record pages, reminders, the vault, onboarding and the other five capture sheets all need the §B1 record kinds (fuel · service · expense · contract · trip · note) — their own batch. Also owed inside this item: the capture chooser (lands with the second capture surface), a real date picker, and the plan/ownership/cap groups on the car page |
| todo | ▲ | chart §D4 finish: ghost bars, on-canvas peak label; iOS large-title inset fix |
| todo | ▲ | Recharts web charts (share selectors only) |
| todo | ▲ | web companion scope: read+edit no capture, import console, export, WCAG 2.2 AA |
| todo | ▲ | Safari-ITP key-custody recovery UX (~7-day eviction → re-auth/re-sync) |
| todo | ▲ | Expo gotchas: Link.AppleZoom asChild+flatten; expo-symbols Android fallback |

### E · Migration & data portability
| st | sev | item |
|---|---|---|
| todo | ▲ | Koi JSON export re-import (migration bridge) + record-level import dedup |
| todo | ▲ | free complete export + backup=export path (client-side JSON + per-table CSV) |
| todo | ▲ | income tracking (D-014 §G reopen — IN) |

### F · Privacy & product copy
| st | sev | item |
|---|---|---|
| todo | ⛔ | privacy-page rewrite BEFORE any sync ships (release gate, two-part page) |
| todo | ▲ | privacy wording: drop no-account claim; operator-can-read; ITP disclosure; web-needs-sync |

### G · Accessibility (deprioritized near-term D-028; end-state required D-014)
| st | sev | item |
|---|---|---|
| todo | ▽ | a11y completion pass + article-9 bar |
| todo | ▽ | chart a11y overlay subsystem + fontScale plumbing |
| todo | ▽ | article-9 wording finalization (Ⓐ resolved, can finalize) |

### H · Build kickoff / project
| st | sev | item |
|---|---|---|
| done | ▲ | repo reset + git-init + naming + monorepo scaffold (Session 1, D-034) |
| done | ▲ | Expo SDK pin + Phase-4 re-confirmation — Session 4, D-048: SDK 57 (`expo ~57.0.8` = RN 0.86 + React 19.2.3) with companions from Expo's bundledNativeModules; PowerSync RN 2.0.0 + op-sqlite 17.1.2 (the 1.35.x line is bridgeless-dead) and @powersync/node bumped to match; charts re-confirmed on paper (Skia 2.6.2 + Victory XL 41.26) but not installed until the chart work; pnpm isolated node_modules survived — no `nodeLinker: hoisted` needed |
| todo | ▲ | Android build path unverified (no JDK on the dev machine) — owed before Bundle A's "one codebase" claim is fully earned; also the Android-over-network initial-sync measurement in bucket B |
| todo | ▽ | niche-tool exit-plan register upkeep (04-stack §5) |
| todo | ▽ | dev tooling: `idb` + macOS Accessibility grant for scripted iOS UI |
| todo | ▽ | deletion grace-window undo semantics (refines S-6/S-7) |
| doing | ▽ | spike teardown: services stopped + capture-feel/node_modules purged (Session 1); write-path seed mined + deleted (Session 2); delete spikes/ entirely once the capture-feel seed is mined |

## Open decisions carried into build
- **D-009 pricing model — OPEN.** Does not block build; no nag walls, no feature
  hostage-taking regardless.

## Session log

- **2026-08-05 · Session 8 — the app surface, built to the design (D-060..D-064).** Step 0 committed
  Session 7's uncommitted wireframe docs and vendored the visual-design handoff into
  `docs/build/design/` (1.2 MB: 18 `.dc.html` sheets, `spec-amendments.md`, the decisions log with §B's
  reconciled fixture ledger and §H's eighteen answers), which moves precedence to design-first and
  demotes `wireframes.md` to reference. Then built, sheet by sheet: the token layer, the control
  language, `@koi/i18n`, the four-tab shell with an app-level toast host, Garage/car page/car form,
  Home's state machine, Settings + Sync, and capture → Odometer. Deleted `src/ui/theme.ts` and
  `src/ui/components.tsx` outright — they were explicitly scaffolds, and every screen now assembles
  from `tokens.ts` + `theme.tsx` + `controls.tsx` + `icons.tsx` + `toast.tsx` + `sheet.tsx` +
  `keypad.tsx` + `swipe.tsx`. Method: rather than read 1.2 MB of design HTML into context, wrote a
  throwaway extractor that renders each sheet as an indented digest carrying every product style value
  (hex, size, radius, spacing) and every string, then read the digests — 9.2k lines for 18 sheets.
  **Four findings worth the session on their own.** (1) The undo closure lived in the toast's own state,
  so a second delete inside six seconds *silently made the first permanent* — a data-loss bug the
  design had already diagnosed (B10) and the new host fixes by separating the view from the queue.
  (2) July's rate in the amendment set (`0,77 €/km`) is the pre-correction figure; the ledger derives
  `1,18` and `Koi Home` renders it eight times, so the summary line is stale in exactly one number.
  (3) `positive` really was `domain.fuel` — the same hex — so a positive state and fuel money were one
  pixel; it is a teal now and reserved. (4) Adding the two sanctioned dependencies re-resolved pnpm's
  peer graph and flipped `better-auth`'s `better-call` copy to the older one `@better-auth/cli` drags
  in, which broke `@koi/server`'s build with TS2742 (an inferred type nameable only through a
  `.pnpm/...` path). Pinned in `pnpm-workspace.yaml` to the versions better-auth itself pins, with the
  reason written above the pin; **the failure reproduced with the session's own server changes stashed**,
  which is how it was attributed to the graph rather than to the code. New deps, exactly as sanctioned:
  `lucide-react-native` (+ its required `react-native-svg` peer) and `@expo-google-fonts/ibm-plex-mono`;
  charts stay uninstalled. **What was refused rather than faked:** Home's money and €/km (no money
  records exist, and zero would be a claim about records that cannot exist), the Last-fill card, the
  car page's PLAN/OWNERSHIP/CARE groups, the cap chip and gauge on a schema with no cap, Settings' rows
  whose destinations are unbuilt, and the capture chooser while there is exactly one capture kind to
  choose. Each is recorded in `spec-delta.md` with the rule it follows. **Proof:** `turbo run lint
  typecheck test build` green across six packages; both sync tiers green against a real stack (server
  11 files/17 tests, mobile 2/6 including a new archive round-trip asserting `record_version` increments
  — server receipt `applied 1 · dead-lettered 0` — which is what proves `archived_at` is applied rather
  than dead-lettered); golden vectors byte-identical on node + jsc + hermes (md5 `f93b1d6b…`), with
  `@koi/domain` not touched at all; eight simulator screenshots across both schemes. One flake seen and
  re-run green: `04-dead-letter`'s "a DELETE on an unknown table still dead-letters" saw only the PUT on
  the first run and both ops on the second — a timing race in the test's queue-drain wait, not a
  server behaviour change, and worth a look before it bites CI. Still blocked: scripted iOS taps
  (bucket H), so screens were reached by seeding the design's own fixture into the local database and
  landing the app on each route in turn; the temporary entry file that did it is reverted and not
  committed, and the odometer sheet's screenshot shows its header under the status bar only because a
  modal presented as the *first* route has nothing to present over (the header insets itself when it is
  genuinely full-screen).

- **2026-07-21 · Session 1 — repo reset (D-034) + @koi/domain.** git-init `koi`
  monorepo at `koi-project/koi`; commit 1 carried in spec + investigation record.
  Scaffolded pnpm workspaces + Turborepo (remote cache off, telemetry disabled),
  skeleton packages + infra, build CLAUDE.md. Stood up @koi/domain for real:
  primitives (integer minor units, civil-date integer math, NFC/code-point ordering,
  injected UUIDv7 ids, economy), ESLint purity bans, Spike Ⓒ vectors as Vitest suite,
  tri-engine conformance runner — **PASS byte-identical on node + jsc + hermes, md5
  `f93b1d6b1717043d97f16b0a17416681`** (the spike's locked hash, now proven on
  production code). CI: lint/build/test + node+hermes conformance jobs. Spike
  teardown: write-path Docker stack down, no Gradle/Kotlin daemons, capture-feel
  node_modules purged (~4 GB reclaimed); spike source kept as seed. **Owner actions:**
  (1) archive/rename legacy `koi` iOS repo, then move this repo to `gariasf/koi`
  (plain `mv`, git-safe); (2) create the remote when ready — CI activates on first
  push; (3) veto window: domain primitives shipped dependency-free (date-fns v4
  remains sanctioned, unused so far); economy/litres≤0 hardened to null beyond spike
  semantics (vector-compatible).
  **Adversarial verification pass** (5 review dimensions, 2-skeptic verify per
  finding): 14 raw → 10 confirmed → all fixed same session. Notables: ESLint bans
  hardened against `globalThis.*` escapes, Date-typed parameters (local-tz getters),
  unprefixed node builtins and dynamic import; `formatCivilDate` now validates at
  construction (never mints an invalid CivilDate); turbo no longer caches the
  conformance task (a cached PASS is a lie about engine behavior); typecheck task
  added so `types: []` purity barrier + test/ actually typecheck in the pipeline;
  i18next v27 Selector-API watch restored to this board (was dropped between D-035
  and §4); CI env now truthfully includes `EXPO_NO_TELEMETRY=1`.
- **2026-07-21/22 · Session 2 — sync core opened: ⑤ + exhaustive op-handling + S-14/S-2/S-3
  schema + torture tier.** Mined the write-path seed into real packages: `infra/`
  (compose: Postgres 16 logical replication + PowerSync OE 1.23.3 pinned, Postgres bucket
  storage, loopback-bound ports) and `@koi/server` (Fastify 5 + zod + Drizzle; jose/JWKS
  shim, better-auth deferred, mint gated behind `KOI_DEV_AUTH=1`). First migration carries
  the three non-retrofittable stances: S-14 (households + household_id + updated_by on every
  record), S-2 (`record_version` replaces `revision`, synced down), S-3 (NO current_odo
  column anywhere — derived via `@koi/domain deriveCurrentOdometerKm`). **⑤ base_version
  per-column protocol built and PROVEN on the real stack (D-037):** trackPrevious echo →
  per-column `column_versions {v,by}` attribution → same-column conflict = apply later
  arrival + displaced value in an atomically-committed flag (never silent LWW); disjoint
  columns merge flag-free; same-device edits never self-conflict. **Exhaustive op-handling
  (D-038):** handler registry; anything unregistered (incl. all DELETEs until S-6)
  dead-letters with full payload + synced flag, content-hash idempotent, per-op SAVEPOINTs,
  always 2xx. `@koi/domain` grew pure odometer (inv.6–12, inv.8 zero-exclusion) + car-bounds
  (§B2 table) checks — vectors untouched, tri-engine md5 `f93b1d6b…` intact. Torture tier
  seeded (D-013/H5): 5 scenarios on two real `@powersync/node` clients + CI job — all pass.
  **Adversarial verification (2 workflow runs, 5 dimensions, 2-skeptic verify; first run
  half-killed by session limit, resumed from cache):** ~29 raw findings → 21 distinct
  confirmed (incl. 3 self-verified after verifier limit deaths) → all fixed same session.
  Notables: readings PUT/PATCH lock-order inversion (deadlock → valid edit dead-lettered);
  dead-letter ids now content-hashed (retry-idempotent); NUL sanitization (a U+0000 payload
  could 500-wedge the queue via the dead-letter path itself); future-base clamp (backup
  restore would silently disarm conflict detection); spurious missing-base flag killed on
  offline create-then-edit; `source` nullable per spec; 20 MiB bodyLimit (1 MiB default =
  import-wedge); token mint gated; sync_rules drops archived_at/resolved_at until their
  write flows land; test:sync isolated to its own compose project. Stopped at the
  S-6/S-4/③ line per brief — owner review owed (see Now/Next).
- **2026-07-21 · Session 1 gate (owner).** Approved. Executed on owner instruction:
  legacy iOS dir renamed `../koi` → `../koi-app` (matches GitHub `gariasf/koi-app`,
  stays read-only); monorepo moved to `gariasf/koi`; **private remote
  `github.com/gariasf/koi` created, main pushed, CI live** (note: the stale GitHub
  redirect `gariasf/koi` → `koi-site` is now claimed by this repo). Capture-feel
  android/ios build dirs purged — spikes/ now ~76 MB source seed only. Hardening
  calls delegated: dependency-free primitives + economy litres≤0→null both kept.
  On-device RN-bundled Hermes CI step (bucket C) remains owed with @koi/mobile.
- **2026-07-23 · Session 3 — S-6 delete model (D-039..D-045).** The next ⛔ blocker built and
  proven. Migration 0001 adds tombstone columns (`deleted_at` synced down; `deleted_by`/
  `_device`/`_via` server-side) to cars + readings + a partial purge-scan index. DELETE → tombstone
  (never physical removal); `deleted_at` is a first-class `column_versions` column so delete-vs-edit
  and delete-vs-undo races reuse the base_version machinery (`planDelete`). Same-device reading undo
  resurrects flag-free; cars never resurrect via PUT (inv.30); foreign replays/imports are
  preserved-and-flagged `write-on-tombstone`, never a silent resurrection. Car delete cascade-
  tombstones its readings in one transaction (atomic per checkpoint) with `deleted_via` provenance;
  per-child conflict via the pinned children-first client contract, server cascade as backstop.
  Late child of a deleted car is kept tombstone-born + flagged. Edit-vs-delete: delete wins
  visibility both orders, edit preserved + flagged (`edit-after-delete` / `delete-conflict`), never
  silently absorbed. D-044: the D-038 DELETE dead letters are terminal (no auto-replay). Undo
  re-INSERT dead-letter trap closed (schemas accept-and-ignore server-managed columns). Torture tier
  5 → 13 scenarios (all on two real @powersync/node clients); unit tier +`planDelete` +`isRetryable`
  (35 → 39). @koi/domain untouched — golden vectors byte-identical (md5 `f93b1d6b…`).
  **Two adversarial workflows (5 lenses each, 2-skeptic verify):** the design run (23 findings; both
  verify phases died on the Fable session limit, so I adjudicated all 23 as reviewer — 19 accepted
  and built in, incl. same-device-gated resurrection, versioned displaced-snapshot flags, per-child
  cascade conflict, `deleted_via` provenance, domain-skip-on-tombstone); the code run (Opus, ran
  fully) → 1 blocker CONFIRMED (2-skeptic): the blanket handler-error catch dead-lettered TRANSIENT
  Postgres errors (deadlock 40P01 etc.) → for a terminal DELETE that was permanent loss + divergence
  — fixed by classifying retryable SQLSTATEs and rethrowing for an idempotent batch retry; 5 other
  findings refuted. **Owner gate owed before S-4/③** — D-045 tombstone-sync stance choice
  (`spec-delta.md`), and S-7 inherits: stop shipping tombstone content to new devices + sweep
  `dead_letters`.
- **2026-07-25 · Session 3 follow-up — bucket-filter (D-046).** Owner resolved the D-045 tombstone
  sync gate: switched from sync-down-and-filter to **bucket-filter** (`WHERE deleted_at IS NULL` in
  `infra/powersync/sync_rules.yaml`). Deletes now propagate as checkpoint row-removals; the client
  schema drops `deleted_at` entirely (clients never hold tombstones); deleted content never ships to
  a device enrolled after a delete — H1 satisfied structurally, which discharges that S-7 obligation
  (only the `dead_letters` sweep remains). Server-side S-6 logic unchanged. Torture assertions
  flipped from "tombstone visible on client" to "row removed"; all 13 scenarios re-proven on the
  real stack; unit tier unchanged (39). Session-3 approval to open S-4/③ still owed.
- **2026-07-25/26 · Session 4 — the client exists: @koi/mobile, S-6 client contract, S-4 review
  queue, RN-Hermes CI (D-047..D-050).** Prep: Expo SDK 57 (`expo ~57.0.8` = RN 0.86 + React 19.2.3)
  pinned to Expo's own `bundledNativeModules.json`, not npm-latest; PowerSync client settled on
  `@powersync/react-native` 2.0.0 + `@op-engineering/op-sqlite` 17.1.2 after research showed the
  1.35.x line has no working driver on RN 0.86 (bridgeless-only); `@powersync/node` bumped
  0.19.4→0.20.0 so client and reference test client share one API shape — the 13-scenario server
  torture tier re-greened unchanged on it. Scaffolded `@koi/mobile`: garage, car page, PowerSync
  connector honouring the full S-6 client contract (delete=DELETE, cascade=children-first-one-tx,
  undo=re-INSERT, no `deleted_at` column), and the S-4 review queue (all 9 sync kinds + 7 domain
  kinds named, explained, resolved — never auto-repaired) with its `flags:PATCH` resolve-latch write
  flow server-side. Built the RN-bundled Hermes discharge: a new CI job builds Hermes from the exact
  tag react-native pins, asserts compiler identity + HBC version against the standalone-Hermes
  proxy's drift (HBC 96 vs RN's 98), runs the vectors twice. **Proven twice, not asserted:** a new
  9-scenario tier drives `@koi/mobile`'s own schema/connector/write functions against a real stack
  under Node in CI, and the SAME module runs on the iOS simulator (real Hermes + op-sqlite + RN SDK)
  — both green (screenshot: "All 9 scenarios pass"). pnpm's isolated node_modules survived contact
  with native modules with no `nodeLinker: hoisted`, against both Expo's and PowerSync's own
  guidance. **Adversarial review (D-051):** 6-lens workflow launched; 4 lenses completed raw
  findings before the verify pass hit a token quota and died, so findings were read against the
  actual code by hand instead of machine-verified. 6 real defects fixed (stale reference-client
  schema missing `resolved_at`; a payload-shape bug that both hid `column-conflict` evidence AND
  double-nested a single-column `delete-conflict`'s restore write; `restoreDisplaced` reporting
  success without checking the UPDATE matched a row; "enter it again" silently vanishing for
  `late-child` because its car is always deleted — insertLateChild tombstone-borns the re-entry
  again; a toast dismiss-timer that could reset on any unrelated re-render; `PATCHABLE_COLUMNS`
  hardened against prototype-chain collisions). 3 tradeoffs recorded in spec-delta.md rather than
  changed (the latch's one named race; flags:PATCH's deferred household scope; flag payloads
  necessarily outliving H1 for deleted-record evidence). 8 regression tests added (38 mobile unit
  tests total); both sync tiers re-verified green after the fixes. build-ops/test-integrity lenses
  never ran — owed as a narrower follow-up, not blocking. **Owner gate owed before ③/passkey.**
- **2026-07-27 · Session 5 — ③ local-only → sync-on migration, lossless (D-052).** Read the
  PowerSync source before designing anything: `init()` has always applied the full synced schema,
  and its native triggers queue every write into the local `ps_crud` table independent of
  `connect()` — confirmed by reading `BasePowerSyncDatabase.ts` (shared-internals), not assumed from
  docs. That single fact dissolved the whole migration problem: "local-only" is not a schema, a
  database, or a copy-forward step — it is never having called `connect()` — and turning sync on is
  one call, draining a backlog that already looks, on the wire, exactly like the "baseless offline
  create-then-edit" case D-037 law 3 has covered since Session 2. No new server code was written.
  Client: `src/sync/mode.ts` (`app_meta.sync_enabled`, device-local, default false) gates `connect()`
  in `KoiProvider` — local-only makes zero network calls, not merely "fails gracefully" if one is
  attempted. `src/sync/queue.ts` centralizes the upload-queue helpers (hoisted out of the Session 4
  self-test scenarios, which now import it instead of duplicating it) and adds `pendingUploadCount`.
  The garage screen's "Sync" card is a reversible toggle (on/off, no confirmation dialog either way —
  enabling is undoable-by-nature, disabling can't lose data) with a live pending count from `ps_crud`
  (a real queryable table, reactive like any other) and copy that is honest in both states without
  touching the release-gated privacy page (exact strings recorded in spec-delta.md, marked NOT the
  real §C8 surface). **Proven, not just reasoned:** `sync-tests/local-first.test.ts`, 3 new scenarios
  against the real stack — a single device's full offline backlog (plain create, offline
  create-then-edit, offline create-then-delete) drains with exact expected `record_version`s and zero
  flags/dead-letters; two devices with independent offline histories both connect (one concurrently)
  and join one household with no loss and no id collisions (recorded, not solved: two independently
  offline-added "same" cars land as two rows — S-9 territory); an offline car-with-children delete
  (children-first, one local transaction, D-041) survives having been made entirely before any
  connection existed. Full pipeline green (11/11 tasks); both sync tiers (server 13 + mobile 9 + the
  3 new) green against the real stack. On-device: screenshotted the local-only default correctly
  making zero network attempts with the server unreachable — a leftover car from Session 4's local
  storage was still there, itself a small proof that local persistence survives independent of any
  server. The live "tap the toggle, watch it sync" screenshot was blocked by two dead ends tried in
  order — `osascript`/Accessibility (no grant, a gap tracked since Session 1, bucket H) and a direct
  SQLite edit (PowerSync's tables are extension-backed views; a bare `sqlite3` insert errors on a
  missing internal function) — accepted rather than forced, since the automated real-stack tier
  already exhaustively proves the identical code path. **Owner gate owed before better-auth/passkey
  (Session 6).**
- **2026-07-28 · Session 6 — real auth end-to-end (D-053..D-056).** Opened directly on the owner's
  own Session 6 brief (the sign-off for the Session 5 gate). better-auth mounted in-process
  (`packages/server/src/auth/instance.ts`), Drizzle-backed on the same connection and the same
  `db:generate`/`db:migrate` flow as everything else — `@better-auth/cli generate` emits its table
  definitions (`src/db/auth-schema.ts`), drizzle-kit migrates them (`0002_gorgeous_mantis.sql`), no
  separate mechanism. Single-tenant: one pre-seeded owner row (`DEFAULT_OWNER_USER_ID`,
  `ensureDefaultOwnerUser` mirroring `ensureDefaultHousehold`) — simplest thing, doesn't foreclose
  S-14. Passkey plugin's passwordless registration lets the founding passkey attach with no session;
  `resolveUser` refuses every attempt after the first (queries for an existing `passkey` row) so the
  sessionless path is one-time, not standing. JWT plugin unchanged contract from the dev shim
  (`aud`/`iss`/`exp`/`jwks` path all the same) — `infra/powersync/config.yaml` needed no edit.
  Recovery codes are a standalone custom plugin (`src/auth/recovery.ts`), NOT better-auth's
  `two-factor` — that plugin turned out to be real 2FA (flips `user.twoFactorEnabled`, gates every
  later sign-in behind a pending-cookie handshake), the wrong shape for a passkey-loss fallback; its
  own raw crypto helpers are also type-only exports at the public entry point (a boot-time
  `SyntaxError` found this, not inspection), so `recovery.ts` is self-contained on
  `better-auth/crypto`'s public primitives instead. Proven in 4 new scenarios
  (`sync-tests/11-recovery-codes.test.ts`): generate, redeem-with-no-session, single-use, reject
  invalid. `KOI_DEV_AUTH`/`createAuthShim`/`auth.ts` deleted (D-038's own words); test harnesses
  authenticate through a `testBootstrap`-gated plugin that structurally cannot exist in `main.ts`'s
  call to `createAuth` (a source-code decision, not an env var — D-056), verified directly (the real
  dev server 404s the test-bootstrap route). All three sync tiers re-proven green under real auth,
  twice each for stability (server 17, mobile 5 top-level / 9+3 scenarios); unit tiers unaffected (42
  server + 38 mobile). One integration bug found and fixed the hard way: the Fastify catch-all's
  reconstructed `Request` needs `content-type: application/json` set unconditionally, not copied
  from the original caller, or a bare bodyless POST 415s before better-auth's handler runs — first
  symptom was a hung `test:sync` run, not a readable error. **Native passkey on Expo/iOS (Ⓓ) —
  DISCHARGED, working end-to-end on the simulator (D-055).** A real Face ID ceremony registered a
  passkey (`Koi (ios)`, `multiDevice`, `backed_up`, on `user-owner`), signed in, generated 10
  encrypted recovery codes, and the session minted a JWT that **PowerSync accepted and synced with**
  — its own log: `Sync stream started user_id: user-owner` → `New checkpoint: 0 | buckets: 1
  ["1#household[]"]` → `checkpoint_complete`, from `powersync-react-native react-native/0.86
  ios/26.5`. No password fallback needed; the kill criterion never fired. Four preconditions found
  the hard way and now written down: (1) Associated Domains needs a PAID Apple account — and the
  team id Apple matches (`AB72ZGY444`) is NOT the one printed on the keychain's dev certificate
  (`TK6Z94M3S5`), which cost one wrong AASA file; (2) the dev loop needs a resolvable domain serving
  `/.well-known/apple-app-site-association` over TLS — a placeholder domain builds fine and fails
  only at ceremony time with an opaque `ASAuthorizationError 1004`; the working recipe is
  `?mode=developer` + `sudo swcutil developer-mode -e true` + an `/etc/hosts` override + a
  simulator-trusted self-signed cert (`simctl keychain add-root-cert`) + a local HTTPS AASA server,
  no public DNS; (3) `@better-auth/expo`'s client and SERVER plugins are a matched pair — RN sends
  no `Origin` header, so every state-changing POST 403s `MISSING_OR_NULL_ORIGIN` while GETs pass,
  until the server-side `expo()` plugin reads the client's `expo-origin` header; (4) registering a
  passkey does NOT sign you in — better-auth calls `createSession` only on the authentication path,
  so `flow.ts` must always follow a registration with a sign-in (first-time setup therefore shows
  two Face ID prompts; recorded as bucket-D UX roughness, not a correctness issue). Bridge:
  `expo-better-auth-passkey` (kevcube, MIT, 33★), in the D-022 niche register with an exit plan.
  Taps were owner-driven (bucket H still blocks scripted iOS UI), so every claim here is backed by a
  database or server-log check rather than screen-reading — the precedent Session 5 set. Sign-in
  surface decided and recorded (spec-delta.md): no separate screen, "Turn on sync" IS the sign-in
  step; a one-time recovery-codes reveal card is the one new screen. **Owner gate owed before bucket
  D (app surface) or S-7** — brief explicitly named both as out of scope this session.
- **2026-07-28 · Session 7 — the wireframe pass, bucket D opened on paper (D-057..D-059).** No screen
  code, by design: the BOARD's own first bucket-D item asks for ASCII/block screens *before* more
  screens get written, so layout and information-architecture problems get caught on paper while they
  are cheap. Read §C and §D in full, then drew the whole surface into `docs/build/wireframes.md`
  (17 sections): the shell and the expo-router layout the four tabs imply — including the one real
  routing problem, that a record page is reachable from three tabs and so must be one *destination*
  registered per tab rather than one route owned by a tab; Home's three states plus the month pulse's
  rules and the Last-fill card's four variants; History's feed with a row-anatomy table per record kind
  that makes inv.7's fold rule concrete; the Insights control row, both fitted pickers, the three-page
  carousel, the four principled pager exceptions, and the Cost and Fuel lenses card by card with an
  exhaustive degraded-state table (money-only fills, `missedPrevious` chain breaks, partials, no
  odometer, under-minimum spans), Distance with the cap gauge pinned above the paged region, and
  Ownership with the pager folded away; Garage, car page and car form; all six capture surfaces
  including the derived-pill state machine ("your last two edits win"), the odometer well's four states
  and the saved moment's six variants; record pages with every §C6 degraded panel plus two §C6 never
  wrote (chain-not-started, money-only import) and the composition line that stops two litre figures on
  one page from looking like a bug; reminders and notifications; the vault; onboarding; and the
  Settings sheet. **Three gaps resolved, per the brief:** D-057 puts the S-4 queue into Home's state
  selection (`Needs you` fires on an overdue reminder *or* an open flag; `All clear` requires zero of
  both; the band renders only when non-empty, so article 2 holds and the calm owner never meets it),
  with a second always-present door in Settings; D-058 moves sync, sign-in, recovery codes and the
  privacy card into the §C8 Settings sheet under a page named `Sync`, keeps the always-true privacy
  claims in *both* sync states, drops the mislabelled off-state count, and relabels the erase button
  `Erase this device` while sync is on (turning sync off first) because S-7 does not exist and a local
  wipe on an enrolled device re-bootstraps from the checkpoint; D-059 keeps colour **roles** in the
  wireframes and makes the authored dark palette its own board item, sequenced before History, carrying
  three light-pair defects found while drawing. **The required code comparison found 21 real
  contradictions** with file:line — loudest being `app/car/[id].tsx` listing every reading on the car
  page, the same defect Tester R reported in the old app and whose structural fix (§C4's "exactly 3
  recent rows + Full history ›") is in the spec because of him. Verdicts cover every file:
  `_layout.tsx` scaffolding; `index.tsx` (four surfaces in one screen), `car/[id].tsx`, both review
  screens, `components.tsx` and `theme.ts` rework; all sync/auth/domain plumbing keep — with a
  carry-out list of every spec-verbatim string and every piece of hard-won reasoning (the D-051 payload
  fix, the toast-timer trick, D-047's re-enter rule) so nothing dies with the files. 18 owner questions
  in §16; build order in §17. **Method:** two workflows, 16 agents — 10 producing exhaustive
  per-surface spec-element inventories plus the code audit, then 6 adversarial lenses (constitution +
  the 34 invariants, honesty/voice, nav + time-as-pages, colour + chart grammar, completeness
  sentence-by-sentence against §C and §I, internal consistency), each with a refute-first skeptic.
  Example data was then reconciled by hand so bars sum to their headlines and every rate divides by the
  window it claims (§0.6 states how far to trust the numbers). **Owner review owed before the four-tab
  build.**
- **2026-07-29 · Session 7 follow-up — adversarial review of the wireframes, 48 findings fixed.** The
  hand-reconciliation the Session 7 entry above describes was necessary but not sufficient — a
  6-lens adversarial workflow (constitution/34 invariants, honesty/voice, nav + time-as-pages,
  colour + chart grammar, completeness vs §C sentence-by-sentence, internal consistency), each lens
  followed by its own refute-first skeptic, read `wireframes.md` against `koi-core-spec.md` and
  against itself. 66 raw findings → 48 survived the skeptic pass (2 blocker, 25 important, 21
  minor) → all 48 fixed in the document, none deferred. **The blocker (both lenses caught it
  independently):** the privacy card and the erase dialog were keyed on the sync toggle rather than
  on "has this device ever synced" — so a device that turned sync off after using it (a pause, not
  an erase, per D-052) would show "no account, cloud sync or analytics… never leaves this device"
  while its founding passkey and its server-side records both still existed. That is exactly what
  §H1 calls product law, not marketing. Both surfaces now carry a third state — **paused** — keyed
  correctly, and D-058/spec-delta were updated to describe three states, not two. Other confirmed
  defects, mostly self-inflicted by the hand-reconciliation pass itself: the Distance lens and car
  page's cap gauge were drawn against the bare cap (1.500 km) instead of the pooled budget
  (cap + carry-over = 1.760 km per inv.25), which made an under-budget car read as over-cap; the car
  page rendered the OWNERSHIP purchase-price group on the Golf GTI, which §0.6 fixes as the
  subscription car — inv.15 forbids that combination outright, so the Ownership lens example moved
  to the owned Ibiza instead (with its own numbers, and the purchase-price row pulled into a
  separate `FACTS` group so the summed total still reconciles); the cap cycle's drawn window
  ("23 Jun – 22 Jul") had already ended relative to the fixture's own "today" (now stated explicitly
  in §0.6 as 28 July 2026), which put a future-tense pace sentence on a past date; a `km/day` figure
  divided by more days than its own "to date" page contained; a Trips card summed to more kilometres
  than the same page's own headline; the review queue reused Home's reserved "Everything OK" /
  "Needs you" strings one push away from Home itself; the car form had no photo well, no working
  `Mark paid off` control (only a sentence), and no way to record a car as sold despite the Ownership
  lens and §I use case 10 depending on it; the vault had no state for a car with no policy on file at
  all; and four `§6.3`/`§9` cross-references pointed at the wrong section after an earlier edit
  renumbered things around them. Full findings list and fixes are in the session transcript;
  `wireframes.md` itself carries no changelog — the fixed document **is** the record.

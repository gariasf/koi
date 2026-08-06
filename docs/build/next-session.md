# Next session kickoff — Session 9: the record tables, and the ledger they unlock

Paste the block below to start Session 9. Working-memory artifact; refresh or delete it once Session 9
is underway.

Session 8 closed 2026-08-05 and is **still in owner review** (BOARD Now/Next). One thing already came
back from it and was fixed in place — the faint ink ramp, D-065. If more comes back, that goes first
and this brief waits.

---

Build phase, Session 9. Repo: ~/Documents/gariasf/koi, remote github.com/gariasf/koi.

Sessions 1–8 done, and everything below is on `main` with CI green on all four jobs.

`@koi/domain` is pure and untouched — golden vectors byte-identical tri-engine, md5 f93b1d6b…, and
that includes the RN-Hermes job, so the engine under test is the one the app ships. The sync server is
complete for cars + odometer_readings (⑤ base_version D-037, exhaustive op-handling D-038, the full
S-6 delete model D-039..D-046 with bucket-filter), and `archived_at` joined the sync rules **with its
write flow** (D-061) — the one contract change Session 8 made. Real auth end-to-end, passkey-primary,
proven on device (D-053..D-056). ③ local-only → sync-on (D-052).

The **app surface is built to the visual design for everything the schema supports** (D-060,
D-062..D-065): the token layer and both authored palettes behind `useKoiTheme()`, the control language
in full, `@koi/i18n` + `useFormat()`, the four-tab shell with per-tab stacks and an app-level toast
host whose undo closures queue, Garage · car page · car form with archive, Home's state machine,
Settings + Sync, and capture → Odometer with Koi's own keypad, the soft/hard split, inv.10's edit
exclusion and the dirty guard. Swipeable rows and the sheet dirty guard — designed since the
wireframes, imported nowhere until Session 8 — both work.

**Read in this order, and mind the precedence:**

1. `docs/build/design/spec-amendments.md` — the authoritative amendment set. **One number in it is
   stale:** July's rate is `1,18 €/km` (487,90 ÷ 412, which the sheets render eight times), not the
   `0,77` in its §D summary (D-063).
2. `docs/build/design/README.md` — tokens, screens, interactions, state, the fixture.
3. `docs/build/design/decisions.md` — §B the reconciled fixture ledger with every derivation, §H the
   eighteen answers.
4. The sheets themselves. **This session's are `Koi History`, `Koi Insights`, `Koi Record Pages` and
   `Koi Reminders`.** Don't read the raw `.dc.html` — 1.2 MB of markup. Extract a digest first: an
   indented tree keeping each element's product style values and its text turns 18 sheets into ~9k
   readable lines. Session 8's extractor pattern is in its session-log entry.
5. `koi-core-spec.md` §A (thesis + the nine articles) and §D (pattern language) — still product law.
6. `docs/build/spec-delta.md` — **read its Session 8 section closely.** It lists every place the build
   knowingly departs from the design and the rule each departure follows. Several of those departures
   are things this session is supposed to close.
7. `koi/CLAUDE.md` (ritual + ground rules) and `docs/build/BOARD.md`.
8. `docs/build/wireframes.md` — reference only. Fastest way to find the reasoning behind a layout and
   the degraded-state catalogues, but the design supersedes it and its §0.6 fixture numbers are stale.

**The gate this session opens is the schema, not the architecture.** History, Insights' four lenses,
record pages and reminders are designed in full and blocked on one thing: the §B1 record kinds do not
exist. That is new-table work end to end — server schema + migration + sync rules + zod + client
schema + PATCHABLE_COLUMNS — and only then the surfaces.

Scope, smallest honest increment first:

1. **The §B1 record tables**: fuel_fills · services · expenses · contracts · trips · notes. Each joins
   the sync rules **with** its write path, the way `resolved_at` (D-047) and `archived_at` (D-061) did
   — never a column clients can see and the server strict-rejects, which is a dead-letter trap. Mind
   inv.7's fold rule at the schema level: a reading logged *with* a fill lives inside that record and
   still joins the trail. Money is integer minor units through `@koi/domain`, never a float column.
2. **`TimelineEvent` projection in `@koi/domain`** (BOARD bucket C, ▲): pure, read-only,
   deterministic, tint as a token name (`'fuel' | 'service' | 'expense' | 'contract' | 'ink'`) and
   never a hex, so the palette stays at the edge. History's mixed feed, the car page's three recent
   rows and Insights' record lists all need it, and it is the one place inv.7's fold rule should be
   decided. New vectors, not a new md5 — a golden-vector diff is a cross-engine-convergence event to
   investigate, never a fixture to update.
3. **History** (sheet 09): the month-grouped feed, row anatomy per record kind, the swipe (the
   mechanic exists), the **plan-charge ledger row** that makes July reconcile (amendment B3), and both
   empty states. Two things point here already and currently point at a placeholder — the car page's
   `Full history ›` and Home's Last-fill card.
4. **The lens derivation engines in `@koi/domain`** (bucket C, ▲) — the full→full economy chain walker
   (inv.1-4), distance bucket interpolation + projection (inv.21-23), the plan billing series
   (inv.13-15, 19), cap cycle + pooling (inv.24-27), page bucketing. Then **Insights**, Ownership
   first: it needs no canvas at all, and it is the lens Tester M asked for by name.
5. **Record pages** (sheet 11) as a **shared destination registered per tab** — the pattern is already
   in place for the review queue, so this is registration, not routing work.

**Close these Session 8 departures as their data arrives** (all listed in `spec-delta.md`): Home's
money and €/km, which are withheld today because no money records exist; the Last-fill card; the car
page's `Full history ›` becoming unconditional; and the capture chooser, which `+` currently skips
because there is only one capture kind to choose.

**New dependencies this sanctions, and only these:** a date picker
(`@react-native-community/datetimepicker`) to replace the odometer sheet's fourteen-day fitted list,
and `expo-device` for the Sync page's device alias — the design pairs the OS device name with the id's
last six, and the bare id does that job worse. Both were flagged by Session 8 and neither is optional
much longer. **Charts stay uninstalled**: the sheets deliberately draw them as stat tables per §D4's
own escape hatch, and the target mark grammar is documented for later.

**Not this session:** the plan/ownership/cap groups on the car page and the cap chip (they need the
plan-lineage model amendment B8 describes, which is its own decision) · S-7 erase-everywhere · the web
companion · the privacy-page rewrite (bucket F, ⛔) · income tracking · the inv.21/inv.23
reconciliation amendment B13 leaves open · onboarding · the vault · the other five capture sheets
beyond what History needs to display.

**Prove it, don't assert it.** Both sync tiers green (`pnpm turbo run test:sync --concurrency=1`), all
unit tiers green, golden vectors byte-identical, and screens checked on the iOS simulator in both
schemes. Scripted iOS UI is still blocked (bucket H: no Accessibility grant, no idb, no Maestro), so
follow the Session 8 precedent: seed the design's own fixture into the local database, land the app on
the route via a temporary entry file, screenshot it, and **revert the temporary file rather than
committing it**. `xcrun simctl ui booted appearance dark|light` switches schemes; `simctl openurl`
deep links hit an un-dismissable iOS confirm dialog and are useless here.

**Three threads Session 8 left, worth clearing early:**

- `packages/server/sync-tests/04-dead-letter.test.ts` — "a DELETE on an unknown table still
  dead-letters" flaked once (saw the PUT, not the DELETE) and passed on a re-run. Looks like a race in
  the test's queue-drain wait rather than a server behaviour change, but it will bite CI.
- `pnpm-workspace.yaml` carries an `overrides:` pin for `better-call` / `@better-fetch/fetch`, with the
  reason written above it. **Adding any dependency can re-flip the peer graph** and break
  `@koi/server`'s build with TS2742 — which is exactly how it surfaced. Since this session installs
  two new packages, expect it and check `pnpm turbo run build` right after `pnpm install`. Remove the
  pin when `@better-auth/cli` catches up.
- CI silently produced **no jobs at all** from Session 6 until Session 8 fixed the workflow file
  (`run: "$HERMES_BIN" -version` is a quoted YAML scalar followed by stray text, so GitHub rejected
  every run before starting one). It is green now, but nothing machine-checked Sessions 5–7 at the
  time. If something looks wrong in that work, that is why.

**Still outstanding, not this session:** Android build unverified (no JDK); the device/emulator
golden-vector run for the per-OS Unicode provider is Ⓒ's narrow remainder; build-ops and
test-integrity review lenses have never run; no client screen for entering a recovery code (D-054,
server-proven only); first-time passkey setup shows two Face ID prompts (D-055); the capture-feel
spike seed is still unmined and `spikes/` still wants deleting.

Update BOARD.md + the session log + `decisions.md` before ending. Commits authored as the owner only —
no co-author trailer. Stop for owner review when the surfaces are on screen in both schemes and both
sync tiers are green.

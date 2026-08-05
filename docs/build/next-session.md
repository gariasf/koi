# Next session kickoff — Session 8: the four-tab shell, built to the design

Paste the block below to start Session 8. The visual-design phase is done: the handoff lives at
`~/Documents/gariasf/koi-project/design_handoff_koi` (outside the repo — the session copies it in).

Working-memory artifact; refresh or delete it once Session 8 is underway.

---

Build phase, Session 8. Repo: ~/Documents/gariasf/koi, remote github.com/gariasf/koi.

Sessions 1–7 done. The spine is built and proven — `@koi/domain` pure and untouchable (md5
f93b1d6b…, tri-engine + RN-Hermes); the sync server complete for cars + odometer_readings (⑤
base_version D-037, exhaustive op-handling D-038, the full S-6 delete model D-039..D-046 with
bucket-filter); `@koi/mobile` on Expo SDK 57 / RN 0.86 with the S-6 client contract (D-049) and the
S-4 review queue (D-047); ③ local-only → sync-on (D-052); real auth end-to-end, passkey-primary,
proven on device (D-053..D-056). Bucket A is closed. Session 7 drew the app surface as ASCII
wireframes (D-057..D-059); **its doc changes are still uncommitted — commit them first**, authored
as the owner, no co-author trailer.

**Since Session 7 a multi-day visual-design phase ran and closed.** Its handoff is at
`~/Documents/gariasf/koi-project/design_handoff_koi` — 18 HTML design sheets covering the *whole*
surface at high fidelity (final hex, type scale, spacing, radii, copy, motion), an authoritative
`spec-amendments.md`, and a `decisions.md` that answers **all 18** of the wireframes' open owner
questions plus two more that surfaced while drawing. **Step 0 of this session: copy that bundle into
`docs/build/design/` (everything except its `spec/` subfolder, which is just stale copies of docs we
already own) so it is version-controlled with the build.** The `.dc.html` sheets open in a browser;
the steel-blue "Industry" chrome around each phone frame is documentation only and never appears in
the app — only what is *inside* the frames is the product.

**Read in this order, and mind the precedence — it changed:**

1. `docs/build/design/spec-amendments.md` — **the authoritative amendment set.** Where anything else
   disagrees with it, it wins. Short. Start here.
2. `docs/build/design/README.md` — tokens, screens, interactions, state, the fixture, and the list of
   contradictions with current code.
3. `docs/build/design/decisions.md` — the running log: §B is the reconciled fixture ledger with every
   derivation, §H holds the 18 answers.
4. The sheets themselves, starting with `Koi Palette` and `Koi Control Language` — **build those two
   sheets' components first; every screen is assembled from them.**
5. `koi-core-spec.md` §A (thesis + the nine constitutional articles) and §D (pattern language) —
   still product law **except where §1 amends it**.
6. `koi/CLAUDE.md` (ritual + ground rules) and `docs/build/BOARD.md` (bucket D).
7. `docs/build/wireframes.md` — **reference now, not authority.** It is the structural pass the sheets
   were drawn from and they cite its § numbers, so it is the fastest way to find the reasoning behind
   a layout, the exhaustive degraded-state catalogue (§3.6, §5.2, §8.2), and the file-by-file code
   audit (§15). But the design supersedes it on layout, and its §0.6 fixture numbers and §16
   recommendations are **stale** — see below. Same for `spec-delta.md`, which predates the design pass.

**Two things in the older docs are actively wrong now; do not copy from them:**

- **The fixture numbers.** `wireframes.md` §0.6 stated July three different ways; the design pass
  found and corrected seven arithmetic contradictions. The authored ledger is **487,90 € · 412 km ·
  72,54 L · 3 fills · 0,77 €/km** (both live cars, 1–28 Jul 2026), Golf at 91.240 km read 12 Jul,
  rate 412 ÷ 28 = 14,714 km/day, projection ≈92.388 km · 28 Sep. Read `decisions.md` §B before
  touching any number.
- **Two of `wireframes.md`'s own recommendations were overridden.** The cap chip and the car-page
  gauge now use **one denominator** (the pooled budget, `268/1.760 km`) — the wireframes let the chip
  show the bare cap, which lets two surfaces reach opposite verdicts about one car. And Home's
  `ALSO COMING` band is bounded by the same 28 days the state machine uses, so it no longer lists
  things 2 and 8 months out.

**Scope — the design covers everything, the schema does not.** The client carries `cars`,
`odometer_readings`, `flags`, `app_meta` and nothing else, so build only what has data:

1. **The shell** — four tabs + detached `+` + floating Settings on every root, per-tab stacks that
   reset the *stack* but **preserve screen state** (filter chips, scope, lens, page size), and the
   shared destinations (a record page is reachable from 3 tabs, the reminder detail from 2 — register
   per tab, never one route owned by one tab). Replaces the flat `Stack` in `app/_layout.tsx`.
   Includes the **app-level toast host**: it is a prerequisite for the queued-undo fix (amendment
   B10), which is a real data-loss bug today — a second delete inside six seconds silently makes the
   first permanent.
2. **The token layer** — `palette.light` + `palette.dark` + `control` + `radius` + `motion` verbatim
   from the handoff README, behind a `useKoiTheme()` hook reading `useColorScheme()`, plus
   `prefersReducedMotion` and `fontScale`. Dark is authored, not inverted. This also lands four fixes
   the amendments name: `positive` becomes teal (it was literally the fuel hue), `inkFaint` gets its
   AA-passing value, the `StatusBar style="dark"` / `userInterfaceStyle: automatic` mismatch, and the
   off-palette `#F6EFE3` in `sync/provider.tsx`. Record the shipped palette as a D-0xx entry —
   D-059 promised the authored pair and this is where it lands.
3. **The control library** — `Koi Control Language` in full: rows, the eight icon wells
   (`domainWash` + `domainText` glyph, radius 10, never a saturated fill), three chip species, four
   button variants (**emphasis is ink, not accent** — the accent means fuel money and nothing else),
   the toast, the three layer species, the stat table, the gauge, the confirmations.
4. **The formatter layer** — `@koi/i18n` + a `useFormat()` hook. Two hard rules from the amendments:
   bundle **IBM Plex Mono** for the data voice (Menlo is Apple-only and falls back to a proportional
   face on Android, so numbers jitter on a co-equal target), and **never `toLocaleString('es-ES')`
   for a Koi figure** — Intl applies `minimumGroupingDigits: 2`, so four-digit values silently lose
   their separator (`1148`, not `1.148`). Micro-labels are uppercased **in the style layer**, never
   typed uppercase, or the screen reader has nothing to strip.
5. **Garage + car page + car form** (`Koi Garage`) — the two ownership shapes (`PLAN` and `OWNERSHIP`
   groups never both appear), three recent rows and a link to History on the car page (**never** a
   readings list — that defect regressed once already), car rows stop wearing the fuel green, fuel
   type becomes an enum entered by chip. **Archive has no write path yet** — inv.30 is broken by
   omission today, so the archive write flow belongs in this session.
6. **Home** (`Koi Home`) — four states, strict precedence, exactly one renders; the flag count that
   already works (`OPEN_FLAG_COUNT_SQL`) blocks `All clear`; the reminder half stubbed until that
   table lands. Alert lines are future tense (amendment B6): "Next alert 9 August, 7 days before."
7. **Settings + Sync** (`Koi Settings`) — the three-state privacy card and erase dialog keyed on
   **"has this device ever synced"**, not on the toggle (D-058). §12.5 recovery-code entry stays
   marked PROPOSED / NOT BUILT.
8. **Capture → Odometer** (`Koi Capture`) — the one capture surface whose table exists: the sheet, the
   custom in-sheet keypad with a locale decimal key, the delta hint, the soft/hard validation split
   (soft confirms do not exist in the app at all today), inv.10's edit exclusion, and the dirty guard
   — which **wins over a notification deep-link's modal teardown**. The odometer error must name the
   conflicting record and offer to open it.

Also land the two unimplemented mechanics the amendments call out, since the surfaces above need
them: **swipeable rows** and the **sheet dirty guard**. Both gesture libraries are already installed
and imported nowhere.

New dependencies this sanctions, and only these: `lucide-react-native` (icons, stroke-width 1.75)
and whatever bundles IBM Plex Mono. Charts stay uninstalled — the sheets deliberately draw them as
stat tables per §D4's own escape hatch, and the target mark grammar is documented for later.

**Do NOT build**, even though it is designed: History, Insights, reminders, the vault, onboarding,
and the other five capture sheets. They need the §B1 record tables — their own batch, and new-table
work rather than an architecture change. Also not this session: S-7 erase-everywhere, the web
companion, the privacy-page rewrite (bucket F, ⛔), income tracking, the plan-lineage model amendment
B8 needs, or the inv.21/inv.23 reconciliation amendment B13 leaves open.

Carry out, do not re-derive: `wireframes.md` §15.5 lists every spec-verbatim string and every piece
of hard-won reasoning that must survive the rewrite (the D-051 payload fix, the toast-timer ref
trick, D-047's re-enter rule, the no-undo-on-car-delete rule).

**Prove it, don't assert it.** Both sync tiers stay green (`pnpm turbo run test:sync
--concurrency=1`), both unit tiers too, and the golden vectors stay byte-identical (md5
`f93b1d6b…`) — `@koi/domain` should not be touched at all. Screens get checked on the iOS simulator
in **both** schemes. Scripted iOS UI is still blocked (no Accessibility grant / idb / Maestro, bucket
H), so follow the Session 5/6 precedent: back every claim with a database check, a server log, or a
screenshot you actually took.

Still outstanding, not this session: Android build unverified (no JDK); the device/emulator
golden-vector run (Unicode provider) is Ⓒ's narrow remainder; build-ops/test-integrity review lenses
never ran; no client screen for entering a recovery code (D-054, server-proven only); first-time
passkey setup shows two Face ID prompts (D-055); capture-feel spike seed still unmined.

Update BOARD.md + the session log + decisions.md before ending. Commits authored as owner only — no
co-author trailer. Stop for owner review when the surfaces above are on screen in both schemes and
both sync tiers are green.

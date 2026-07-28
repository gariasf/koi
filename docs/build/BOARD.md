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
| todo | ▽ | i18n setup: i18next + shared JSON catalogs (@koi/i18n); adopt the Selector API from the start — i18next v27 plans to drop type-level string keys (parking-lot promotion, D-035) |

### D · Clients (mobile + web)
| st | sev | item |
|---|---|---|
| todo | ▲ | **wireframe pass FIRST** — ASCII/block screens translating §C (functional reqs) + §D (nav model, time-as-pages, color law, chart grammar) into concrete layouts for the four tabs + capture + record + reminders + vault/settings, sanity-checked against what @koi/mobile already has (garage/car/review) before writing more screen code. Queued for right after Session 6 (passkey) gates — prep for opening this bucket, not a parallel side-track. |
| todo | ▲ | full Bundle A app build (capture + ledger + record + Insights) — Session 4 scaffolded @koi/mobile and built the sync surfaces only (garage · car page · review queue); §C's four-tab shell + capture sheets + dark palette are this item; **starts from the wireframe pass above** |
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

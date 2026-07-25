# Decision ledger

Every settled question gets an entry. Statuses: **LOCKED** (user signed at a gate) · **OPEN** (raised, unsettled) · **SUPERSEDED → D-xxx** (replaced by a later decision, pointer mandatory) · **REFUSED** (considered and rejected, reason mandatory). Reopening a LOCKED decision happens only via an explicit SUPERSEDED entry at a gate.

Format: `D-NNN · <date> · <status> — <one-line decision>. <why, one or two sentences.>`

---

- D-001 · 2026-07-21 · LOCKED — Investigation workflow and six-phase map adopted (`00-workflow.md`); the workflow ran all six phases to a clean close and is discharged. (Locked with D-036 at the Phase 6 gate — the workflow proved itself in use.)
- D-002 · 2026-07-17 · LOCKED — Workspace is `koi-project/` (plain folder, no git until build phase); existing repos (`koi` app, website) are read-only references; all repos get reset with new naming when building starts, planned in Phase 6. Owner's instruction.

<!-- Phase 1 charter — LOCKED 2026-07-17 at gate, with two owner amendments (D-010 freeze dropped, D-012 invariants park trigger added). -->
- D-003 · 2026-07-17 · LOCKED — Motives for multiplatform: own need + growth ambition + learning; no tester demand exists yet. Owner-driven effort; park triggers (D-012) are the counterweight.
- D-004 · 2026-07-17 · LOCKED — Platform roles: iPhone daily driver; web = read-mostly companion (not full peer); Android = stack-decided in Phase 4 (parity if shared stack wins, else follower/deferred).
- D-005 · 2026-07-17 · LOCKED — Privacy stance: Phase 3 decides the rung with declared priority E2EE-no-accounts > E2EE+account > server-readable; each rung priced honestly.
- D-006 · 2026-07-17 · LOCKED — Privacy floor regardless of rung: no ads/trackers/analytics; free complete export; sync strictly opt-in; app fully functional local-only with no account. Privacy page rewritten before any sync ships.
- D-007 · 2026-07-17 · LOCKED — Sync scope: single-user multi-device; architecture must not preclude household sharing later (extension, not rewrite).
- D-008 · 2026-07-17 · LOCKED — Scope: broad §G reopen including income tracking, settled item-by-item at the Phase 2 gate; all other refusals carry verbatim. (Income row of the refusals table: SUPERSEDED by this entry.)
- D-009 · 2026-07-17 · LOCKED — Monetization envelope: infra ≤ €25/mo; pricing model open until Phase 6; no nag walls, no feature hostage-taking carried verbatim.
- D-010 · 2026-07-17 · LOCKED — Koi 2.x: abandoned — zero further development or releases from today (unreleased "time as pages" build never ships); parity baseline fixed at spec + Phase 2 delta; end state replaced; existing JSON export is the migration bridge (re-import becomes load-bearing). (Owner clarified at gate: intent was stronger than freeze — forget 2.x entirely.)
- D-011 · 2026-07-17 · LOCKED — Biases & capacity: NestJS/Next.js/Expo learning bias declared, weight = tiebreaker only; TS strong/daily; solo, 10+ h/wk, no hard deadline.
- D-012 · 2026-07-17 · LOCKED — Non-negotiables: articles 1–6+8 verbatim; article 7 renegotiated within D-005/D-006; article 9 bar binds all clients, wording pends Spike 1. Park triggers (any one ⇒ park): invariants don't survive sync · privacy floor unaffordable · capture feel fails · roadmap exceeds solo capacity. (Owner amended at gate: invariants added as trigger.)

<!-- Phase 2 requirements delta — LOCKED 2026-07-17 at gate, no amendments. -->
- D-013 · 2026-07-17 · LOCKED — Phase 2 requirements delta (`02-requirements-delta.md`): sync semantics S-1…S-14 (record identity/versioning, derived-never-synced, flag-never-fix extended to merge, tombstones, erase-everywhere, idempotent recurrence/import, unknown-field preservation, offline-first capture), per-platform deltas (web companion, conditional Android, server as new platform), NFR deltas (privacy truth table, backup = export, sync torture tests). Owner signed at gate with no amendments.
- D-014 · 2026-07-17 · LOCKED — §G reopen verdicts per delta §6: income tracking IN (refusals-table income row formally SUPERSEDED — completes D-008); Koi-export re-import, record-level import dedup, and the accessibility completion pass REQUIRED; iCloud backup/sync SUPERSEDED by this investigation; multi-item services, history search, receipts, widgets, trip-computer cross-check, EV economics, trip flags, multi-currency, iPad/Mac all LATER; IA alternatives parked to the design track. All other refusals carry verbatim (D-012).
- D-015 · 2026-07-17 · LOCKED — Preference split (S-12): synced = units, economy format, currency; device-local = appearance, notification delivery, digest hour. Logged amounts never change regardless.
- D-016 · 2026-07-17 · LOCKED — Web-requires-sync stance: the "fully functional local-only, no account" floor is carried by the phone apps; the web companion is only meaningful with sync enabled and the privacy page says so plainly.
- D-017 · 2026-07-17 · LOCKED — Notification default: phone apps schedule and alert locally from synced state; web never notifies. Per-device scheduling, no push infrastructure required.

<!-- Phase 3 sync architecture — LOCKED 2026-07-19 at gate, with one owner amendment (maturity/community weight raised) that superseded the drafted rung-1 direction. -->
- D-018 · 2026-07-17 · SUPERSEDED → D-022 — Drafted direction: rung-1 E2EE op-log over blind self-hosted relay. Superseded at gate by the owner's popularity/maturity amendment; rung-1 designs remain on file as the fallback pair.
- D-019 · 2026-07-17 · SUPERSEDED → D-022 — Drafted engine: Evolu v7.4.1 primary, DIY op-log fallback. Superseded with D-018; Evolu is the small-community case the amendment exists to avoid.
- D-020 · 2026-07-19 · LOCKED (amended) — Landscape refusals stand: ElectricSQL, Zero, Jazz, Triplit, InstantDB, Supabase, Firebase, CloudKit per briefs; LiveStore/Automerge/Yjs documented-not-designed. Amendment: the drafted PowerSync refusal is reversed by D-022; Evolu and DIY op-log join the refused-for-primary list (small-community rule), retained as the rung-1 fallback pair. Evidence: `research/03-sync/`, as-of 2026-07-17.
- D-021 · 2026-07-17 · SUPERSEDED → D-023 — E2EE-specific spec tensions (inv. 30 ciphertext retention, blind-relay erase races, mnemonic-only recovery) dissolve at rung 3; replaced by the rung-3 obligation set.
- D-022 · 2026-07-19 · LOCKED — Owner amendment at gate: maturity/community weight raised — avoid small/small-community tools, prefer popular ones when right for the job and familiarizable (charter weights amended accordingly; original order had maturity 6th). With rungs priced per D-005, owner chose **rung 3**: PowerSync self-hosted (Open Edition) + bespoke TS write-path API + Postgres, single-tenant, account only when sync enabled, local-only floor intact; `@koi/domain` runs server-side on upload (accept-with-2xx + synced violation flags) and client-side on write; €8–13/mo; exit = plain Postgres. Per-field E2EE envelope parked as upgrade path. Phase 4 note: Swift SDK GA — iOS native option open again.
- D-023 · 2026-07-19 · LOCKED — Rung-3 obligations accepted as build/spike work: S-5 base_version per-column protocol (spike ⑤); S-7 erase = TRUNCATE + purge ledger + compaction cadence + ≤24 h token-revocation window + backup-rotation disclosure; S-9 two-device import car-id remap; engine-agnostic domain set (lineage swap, S-8 occurrence identity, S-9 dedup ordinal, settings singleton id, "keep both" semantics, post-flag validation); privacy page: no "no-account" claim, operator-can-read wording for growth users, Safari ITP disclosure. Spike list ①–⑤ pre-registered in `03-sync-architecture.md`.

<!-- Phase 4 stack & platform fit — LOCKED 2026-07-20 at gate, with one owner amendment (a11y deprioritized, D-028). -->
- D-024 · 2026-07-20 · LOCKED — Platform fork: Bundle A (Expo/RN unified TS stack, `@koi/domain` unmodified everywhere, Android near-free) primary; Bundle B (SwiftUI iOS + TS web/server via JavaScriptCore-embedded domain, explicit "Android = never" rider) contingency. Spike Ⓐ (capture feel on device, iOS + Android) decides; fails both → D-012 park trigger. Evidence: `research/04-stack/`.
- D-025 · 2026-07-20 · LOCKED — Shared substrate: Fastify 5 + zod + Drizzle (pinned, exit = raw pg); better-auth in-process (JWKS → PowerSync, passkey-primary + recovery codes, no email dependency); Hetzner CX23 Docker Compose ~€8–11/mo (PowerSync Postgres bucket storage GA — no MongoDB); Vite + React SPA + TanStack Router static behind Caddy; pnpm workspaces + Turborepo (local cache, telemetry off); `@koi/domain` nearly dependency-free pure ES (integer minor units, civil-date strings, code-point ordering, date-fns v4 only, ESLint bans); i18next + shared JSON catalogs; charts = Skia + Victory Native XL native / Recharts web, a11y overlays as scoped feature.
- D-026 · 2026-07-20 · LOCKED — Phase 4 refusals: KMP/Compose MP (wrong language for locked TS domain; revisit only if TS-domain reopens); NestJS and Next.js (declared biases, refused on evidence — tiebreaker only, races weren't ties); Nx, tRPC, TanStack Start, Prisma, Kysely, Lucia, Auth.js, Keycloak/Zitadel/Ory, Clerk/Auth0, Fly, Railway, dinero.js, Temporal-for-now, Lingui, react-intl, Skia-on-web. Niche-tool register with exit plans per D-022 in `04-stack.md` §5.
- D-027 · 2026-07-20 · LOCKED (amended) — Spike list amended for Phase 5: Phase 3's ④ folded into ① (Postgres bucket storage promoted to GA); added Ⓐ capture feel (platform-fork decider), Ⓑ chart bar feel/perf (a11y dropped per D-028), Ⓒ domain conformance incl. Hermes golden-vector, Ⓓ better-auth/passkey round-trip. Suggested pick: Ⓐ, ②, Ⓑ, Ⓒ.
- D-028 · 2026-07-20 · LOCKED — Owner amendment at gate: accessibility deprioritized for now — removed from spike kill criteria and near-term focus (chart a11y overlay subsystem + fontScale plumbing move to the build-phase backlog). End-state obligations stand unchanged in priority-later form: D-014 a11y completion pass and the article-9 bar remain product requirements, just not investigation/spike gating. Did not change the stack shortlist (a11y was a cost item, not a decider).

<!-- Phase 5 spikes — in progress from 2026-07-20. -->
- D-029 · 2026-07-20 · LOCKED — Spike Ⓐ (capture feel) result: WIN on structure/fidelity/build across iOS + Android (Expo SDK 57), no D-012 park trigger; k1 (native fitted sheet + custom keypad) and k2 (Android sheet fidelity — the headline risk) both PASS. Owner ran the on-device feel-check and signed off ("good enough"). **Platform fork (D-024) resolved: Bundle A (Expo/RN unified TS) confirmed as the build direction; Bundle B contingency retired.** k3 spring / k4 haptics / zoom motion accepted at the owner's feel bar. a11y unchanged (D-028/D-014). Evidence: `investigation/05-spikes/README.md`, `spikes/capture-feel/`.
- D-030 · 2026-07-20 · LOCKED — **Phase 5 (spikes) signed off at gate. All four picked spikes WIN:** Ⓐ capture feel (owner-signed), ② write-path round trip (atomic flag + no silent loss + queue-safe; Ⓓ-min + ① server-side pass), Ⓒ domain conformance (V8==JSC==Hermes byte-identical), Ⓑ chart bar (Skia + Victory Native XL 41.26 build/render/carousel/tap-to-read; owner signed the 60fps/feel check "good enough"). No D-012 park trigger fired; the Bundle-A stack + Phase-4 substrate survived contact with real code on device. **Obligations carried into Phase 6 / build backlog:** ⑤ base_version per-column protocol (D-023 — same-column overwrite silently LWWs without it); accept-with-2xx exhaustive op-handling (unhandled op = silent loss); Android-over-network initial-sync unmeasured; on-device (RN-bundled) Hermes golden-vector CI; Ⓑ §D4 ghost-bars + on-canvas peak label + iOS large-title layout fix. a11y unchanged (D-028 near-term-out, D-014 end-state stands). Evidence: `investigation/05-spikes/README.md`, `spikes/`.

<!-- Phase 6 decision — LOCKED 2026-07-21 at the gate (owner signed "lock"). Investigation closed. Doc: 06-decision.md. -->
- D-031 · 2026-07-21 · LOCKED — **Verdict: GO.** The replatform proceeds; the build phase opens. All four D-012 park triggers tested and clear (06-decision.md §2); no trigger fired in Phase 5 (D-030). Verdict rests on the no-hard-deadline mitigant (D-011) plus four winning spikes; build direction = Bundle A (§3).
- D-032 · 2026-07-21 · LOCKED — **Final architecture LOCKED** as the 06-decision.md §3 reference block: Bundle A (D-024/D-029) + shared substrate (D-025) + PowerSync self-hosted rung 3 (D-022) + dependency-free Ⓒ-verified `@koi/domain` (D-025/D-030) + Skia/Victory-XL native / Recharts web charts (D-025/D-030). Cost headline €8–13/mo all-in (D-022); CX23 box €8–11 (D-025); both under the €25 envelope (D-009). Consistency-checked against the ledger — no contradiction.
- D-033 · 2026-07-21 · LOCKED — **Build backlog adopted** (06-decision.md §4), compiled from all carried obligations. Scope correction: the sync layer is the **full S-1…S-14 set** (D-013), not just the rung-3 spike subset S-5/S-7/S-9 (D-023). Blockers: ⑤ base_version, accept-with-2xx exhaustive op-handling, S-14 household non-preclusion (schema-time), S-6 delete model, S-4 client review queue, ③ local→sync-on migration, passkey full round-trip, privacy-page pre-sync-ship release gate.
- D-034 · 2026-07-21 · LOCKED — **Repo-reset / git-init / naming + spike-teardown plan** (D-002; 06-decision.md §5): one pnpm+Turborepo monorepo (packages domain/mobile/web/server + infra); git-init carrying in `koi-core-spec.md` + the `investigation/` tree as the version-controlled decision record; neighbor repos (`../koi`, website) untouched by the assistant — owner archives read-only. Spike teardown: stop idle services + purge regenerable weight (`capture-feel/node_modules` 4.1 GB of the 6.4 GB), retain spike *source* as build seed, never git-add spikes. **Naming resolved at gate (2026-07-21):** product = Koi; monorepo = `koi` (npm scope `@koi/*`), fallback `koi-platform`; legacy iOS repo archived by owner to free the name.
- D-035 · 2026-07-21 · LOCKED — **Parking-lot final disposition** (06-decision.md §6): 11 items promoted into the §4 backlog; 5 left parked (design-track/watch); 5 now moot (superseded by rung-3 / abandoned-2.x / git-init). Lot retires at build start.
- D-036 · 2026-07-21 · LOCKED — **Investigation closed** at the Phase 6 gate; the six-phase workflow (`00-workflow.md`) is discharged. D-001 (workflow adoption) locks with this entry. OPEN carried into build: pricing model (D-009 — **owner deferred at gate 2026-07-21, stays OPEN**; does not block build kickoff, no-nag/no-hostage still bind). Naming resolved (see D-034).

<!-- Build phase — appended per the build ritual (koi/CLAUDE.md). -->
- D-037 · 2026-07-22 · LOCKED — **⑤ base_version per-column protocol semantics fixed and proven** (S-5/D-023, Build Session 2). Every synced row carries server-bumped `record_version` (S-2, synced down); the server keeps a per-column attribution ledger `column_versions {column:{v,by}}`. Clients echo their base via PowerSync `trackPrevious` (`CrudEntry.previousValues.record_version`). Conflict per changed column iff: base present AND column changed after base AND last writer is a different device AND values differ → apply the later arrival (deterministic convergence) + preserve the displaced value in a `flags` row committed in the same transaction — never silent LWW. Disjoint columns merge flag-free; same-device sequential edits (incl. baseless offline create-then-edit) never self-conflict; a base from the future (backup restore) degrades to a missing-base flag. Proven on the real stack by the torture tier (two `@powersync/node` clients): same-column conflict attributed, disjoint merge silent, ② same-date case graduated. Adversarially reviewed (2 runs, ~29 raw findings, 2-skeptic verify) — all confirmed findings fixed same session (lock-order deadlock, dead-letter idempotency, NUL sanitization, future-base clamp, spurious missing-base, source nullability, token-mint gate, bodyLimit, loopback binds, image pin, test isolation).
- D-038 · 2026-07-22 · LOCKED — **Exhaustive op-handling policy** (Spike ② rule → mechanism, Build Session 2). The write-path consults an explicit `(table, op)` handler registry; anything absent — unknown tables/ops, zod-strict schema failures (S-10 stance: unknown columns are never silently stripped), unknown parents, handler exceptions, and ALL DELETEs until S-6 — is dead-lettered with its full payload (server-only `dead_letters`) plus a synced fixed-copy flag, committed atomically in the same batch transaction (per-op SAVEPOINTs), always under 2xx. Dead-letter ids are content hashes → idempotent under retry. Malformed protocol bodies (not content) get 400 = client-build bug, visible retry. Interim scope stances recorded: `archived_at`/`resolved_at` exist in schema but stay out of sync rules until their write flows land (archive flow / S-4); `household_id`/`car_id` are not PATCHable (re-homing dead-letters loudly until a sharing/S-14 flow defines it); the dev token mint requires `KOI_DEV_AUTH=1` and dies with better-auth.
- D-039 · 2026-07-23 · LOCKED — **S-6 tombstone delete model** (D-013/§4.A, Build Session 3). A
  delete never removes a row — the DELETE handler writes a tombstone: `deleted_at` set +
  server-side attribution (`deleted_by`/`deleted_by_device`) + `deleted_via` ('direct' | 'cascade').
  Migration 0001 adds these four columns to `cars` + `odometer_readings` (+ a partial index on
  `deleted_at IS NOT NULL` for the future S-7 purge scan). `deleted_at` syncs down (sync_rules);
  clients keep tombstoned rows and filter `deleted_at IS NULL`, so a delete hides the row on every
  device. `deleted_at` is a first-class attributed column in the `column_versions` ledger, so
  delete-vs-edit and delete-vs-undo races reuse the D-037 base_version machinery (`planDelete`
  mirrors `planPatch`). DELETE on an already-tombstoned row = noop (idempotent replay / agreement);
  DELETE for an unknown row dead-letters; unknown tables/ops still dead-letter (DELETE is not
  blanket-handled — registry gained only `cars:DELETE` + `odometer_readings:DELETE`). Delete stays
  distinct from archive (inv.30) — `archived_at` untouched, archive write flow out of scope.
  Physical purge is S-7 (grace-window/purge-ledger), a distinct mechanism; spec inv.30 "purges" is
  discharged in two stages (tombstone now, purge at S-7). Server-managed columns clients mirror
  (`record_version`, `deleted_at`) are accepted-and-ignored by the PUT/PATCH zod schemas (known
  server columns, never client-writable via op data) — this closes the undo re-INSERT dead-letter
  trap without weakening the S-10 strict stance for genuinely unknown fields.
- D-040 · 2026-07-23 · LOCKED — **Undo-survives-sync (resurrection)** (inv.31, Build Session 3). The
  undo toast's sync-safe path: the deleting device re-INSERTs the row (INSERT OR REPLACE → a single
  PUT, upsert). The server resurrects ONLY when the PUT is a reading, the tombstone was written by
  the SAME device (`column_versions['deleted_at'].by === deviceId` — the toast lives only on the
  deleting device, mirroring D-037 law 3), and the parent car is live: it clears the tombstone,
  bumps `record_version` (clearing a tombstone is always a change), and resurrection propagates as
  ordinary row state so the row reappears on every device. A clean undo (no value change) is
  flag-free; a value-changing resurrection preserves the displaced snapshot (`resurrected` flag).
  Every OTHER PUT on a tombstoned row does NOT resurrect: cars never (inv.30 has no car undo — car
  restore is a future S-4 signal), and a foreign-device reading (stale replay/import) keeps the
  tombstone, applies-and-preserves the displaced values in a versioned `write-on-tombstone` flag,
  and never silently reverses a delete. Domain checks run only on rows left live. Adversarial code
  review (5 dimensions, 2-skeptic verify, Opus) found ONE blocker rooted here and in D-038's
  dead-letter path: the blanket handler-error catch dead-lettered TRANSIENT Postgres errors
  (deadlock 40P01, serialization, lock-not-available, connection-class) — for a DELETE that
  dead-letter is terminal (D-044), so a retryable contention failure became permanent data loss +
  divergence. Fixed: `upload.ts` classifies retryable SQLSTATEs and rethrows them so the batch
  aborts non-2xx and PowerSync retries idempotently; only deterministic-content errors dead-letter.
- D-041 · 2026-07-23 · LOCKED — **Atomic cascade** (inv.30, Build Session 3). `cars:DELETE`
  tombstones the car AND every live child reading in the SAME transaction (one `UPDATE … WHERE
  car_id=? AND deleted_at IS NULL`, `deleted_via='cascade'`, per-child `record_version` bump +
  `deleted_at` ledger entry attributed to the deleter) → one replication transaction → one
  checkpoint → peers observe car+children tombstoned together, never a deleted car with live
  children. This server cascade is the BACKSTOP; the pinned client contract is per-child DELETE ops
  (children first) then the car DELETE, so each known child's own base echo runs `planDelete`
  conflict analysis (a concurrent foreign edit the deleter didn't sync → `delete-conflict`) —
  order-independent for known children. Children the client never synced are cascade-tombstoned
  without per-child analysis; a genuine concurrent edit to them arrives as its own op →
  edit-after-delete (Order A). Cascade provenance is captured at write time (`deleted_via`) so S-4
  can scope the cohort without timestamp forensics — a non-retrofittable stance landed now like S-14
  in 0000. Lock discipline: the car is the per-car lock (taken first), so no op deadlocks against
  another op on the SAME car; two DIFFERENT cars are NOT globally ordered, so a multi-car batch can
  deadlock a concurrent opposite-order batch — a transient 40P01 handled by the retryable-SQLSTATE
  path (D-039/D-040), not a data problem. The module's earlier blanket "deadlock-free" claim was
  corrected.
- D-042 · 2026-07-23 · LOCKED — **Late child of a tombstoned parent** (Build Session 3). A reading
  PUT for a car that is tombstoned is inserted PRESERVED but already-tombstoned (`deleted_at=now()`,
  attribution INHERITED from the car's tombstone, `deleted_via='cascade'`) + a synced `late-child`
  flag. Never dropped (full data in the row), never resurrecting the parent, and the
  tombstoned-car ⇒ no-live-children invariant holds. A value-changing PUT onto an ALREADY-existing
  tombstoned reading takes the write-on-tombstone path instead (versioned flag carrying the
  displaced snapshot) — the un-versioned `late-child` id is reserved for the fresh-insert case where
  nothing is displaced, so no distinct event coalesces onto another via `onConflictDoNothing`. No
  domain checks on tombstone-born rows (out of the live trail, inv.11). S-4 is where the user decides
  (restore the car? keep the orphan?); this session guarantees preservation + flagging only.
- D-043 · 2026-07-23 · LOCKED — **Edit-vs-delete concurrency** (the silent-absorb hole, Build
  Session 3). The delete WINS VISIBILITY in both arrival orders; the edit is never silently absorbed
  — its value is preserved in the tombstoned row and surfaced by a flag; resurrection happens only
  via the explicit D-040 undo, never as a side effect of an edit. Order A (delete first, edit
  second): PATCH on a tombstoned row applies into the tombstoned data, stays tombstoned, one
  `edit-after-delete` flag (no column-conflict analysis — the deletion supersedes it; no domain
  checks). Order B (edit first, delete second): the DELETE's base echo is scanned per column
  (`planDelete`), any column changed after base by a different device → tombstone still applies + one
  `delete-conflict` flag preserving the concurrent value; `deleted_at` itself is scanned, so a stale
  delete that would reverse a concurrent undo is caught too. Missing/future base with an
  unattributable foreign change → `delete-conflict` with a missing-base message; a row only ever
  touched by the deleting device tombstones silently (offline create-then-delete never spams flags).
  New flag kinds S-4 must render: `delete-conflict` · `resurrected` · `write-on-tombstone` ·
  `late-child` · `edit-after-delete`.
- D-044 · 2026-07-23 · LOCKED — **Disposition of the D-038 DELETE dead letters** (Build Session 3).
  They are TERMINAL: no auto-replay, ever — mechanically replaying stale delete intents against the
  now-real DELETE handlers would execute data the user has since watched survive (surprise data
  loss, the exact class this architecture exists to prevent). Disposition = manual review via the
  existing `dead-lettered-op` flags + the S-4 queue; the operator may inspect server-only
  `dead_letters`; a re-issued op that dead-letters again coalesces on its content-hash id. No
  production users → accumulated DELETE dead letters exist only in dev/test databases (the torture
  teardown wipes its own). Retention until S-7 defines purge — S-7 MUST sweep `dead_letters` (they
  may hold erase-me content); recorded as an S-7 obligation.
- D-045 · 2026-07-23 · NOTE (owner gate) — **Tombstone sync stance carries an alternative worth a
  look.** S-6 ships sync-down-and-filter per the Session 3 brief (`deleted_at` in sync_rules;
  clients filter `deleted_at IS NULL`). The adversarial design review surfaced a cleaner alternative
  — filter the buckets themselves (`WHERE deleted_at IS NULL`) so a delete propagates as checkpoint
  ROW-REMOVAL: no filter-everywhere burden on clients, cascade atomicity preserved (one checkpoint
  removes car+children), undo still works (the toast closure re-INSERTs → the row re-enters the
  bucket), and — the load-bearing point — deleted content never ships to a device enrolled AFTER the
  delete (H1: "delete everything… no undo"). Kept as-is per the brief; recorded in
  `docs/build/spec-delta.md` for the owner to decide. Either way, S-7 acquires an obligation the
  current stance makes explicit: purge must stop shipping tombstone content to new devices (bucket
  filter or claw-back), plus sweep `dead_letters` (D-044). The flag payload does not yet carry the
  counterparty's identity (deleter on edit-after-delete, displaced writer on delete-conflict/
  column-conflict) — fine for single-user-multi-device, owed for the S-14 household review UI; the
  data is captured server-side and retrofittable, deferred to S-4/S-14.
- D-046 · 2026-07-25 · LOCKED — **Bucket-filter adopted for tombstone sync** (owner decision on the
  D-045 gate, Build Session 3 follow-up). Supersedes the D-039 sync-down-and-filter surface: the
  PowerSync buckets now carry only LIVE rows (`SELECT … FROM cars/odometer_readings WHERE deleted_at
  IS NULL`), so a delete sets `deleted_at` server-side, the row leaves the bucket, and PowerSync
  propagates the delete as a checkpoint ROW-REMOVAL. No tombstone content ever reaches clients:
  clients have no `deleted_at` column, no filter-everywhere burden, and a device enrolled AFTER a
  delete bootstraps only live rows — so deleted content never ships to it (H1: "delete everything…
  no undo"). Undo is a re-INSERT (the toast closure holds the row) → server clears `deleted_at` →
  the row re-matches the bucket → the checkpoint adds it back everywhere; the cascade is atomic here
  too (car+children leave the bucket in one replication transaction → one checkpoint). Server-side
  S-6 logic is UNCHANGED — planDelete/resurrection/cascade/late-child/edit-vs-delete all run on the
  canonical Postgres rows, which still keep tombstones; only the sync surface changed. `deleted_at`
  stays accepted-and-ignored on upload (a client that mirrors it must not dead-letter). This
  DISCHARGES the D-039/D-045 S-7 obligation "stop shipping tombstone content to new devices" (now
  structurally true); S-7 still owes the `dead_letters` sweep (D-044). Proven on the real stack —
  the full torture tier (13 scenarios, two `@powersync/node` clients) passes with row-removal
  semantics: propagation, atomic cascade removal, late child never reaching clients as data, undo
  round-trip re-entry, foreign-device re-create staying removed.

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
- D-047 · 2026-07-25 · LOCKED — **S-4 client review queue + the `resolved_at` write flow** (⛔ blocker
  of D-033, Build Session 4). The queue lives in `@koi/mobile` and is where every flag this
  architecture produces lands: all nine sync kinds (column-conflict · missing-base-version ·
  put-on-existing · dead-lettered-op · delete-conflict · resurrected · write-on-tombstone ·
  late-child · edit-after-delete) and all seven `@koi/domain` kinds, each named, explained in plain
  words, and resolved by the user — nothing auto-repaired (the import "Review now" pattern, §B3/
  D-013). A kind an older build does not know is still rendered, with the server's own message doing
  the explaining; a flag is never silently dropped by the surface that exists to show it.
  **The write flow:** `flags:PATCH` accepts `resolved_at` and NOTHING else about a flag, and
  `resolved_at` joined `sync_rules.yaml` in the same change — a synced column with no accepting
  handler is a dead-letter trap, the `archived_at` lesson (D-038), and `archived_at` still waits for
  its own flow. `flags:PUT`/`flags:DELETE` stay OUT of the registry and dead-letter loudly: a client
  must not author a flag the server never raised, nor destroy the record of one. The server stamps
  its own clock and reads the client value as intent only (non-null = resolve, null = re-open, which
  is how the undo toast reverses a mis-tap); resolution never touches `record_version`, which on a
  flag row is the version of the FLAGGED record. The latch deliberately carries NO base_version
  machinery, and that is not an exception to "never silent LWW" (D-037): the latch holds no user
  content, its two states are both user intents, both visible, both one tap apart, and two devices
  resolving the same flag agree by construction.
  **Honesty rules the UI enforces** (§D5, and they are tested): a review screen never offers what
  the architecture cannot deliver — a car never resurrects via PUT (inv.30) and only the deleting
  device's own undo resurrects a reading (D-040), so for a DELETED record the queue offers "enter it
  again as a new reading" (a new id, honestly a new record), never "restore". A restore of a
  displaced value is an ordinary PATCH, analysed like any other, and drops columns the server would
  strict-reject (`household_id`/`car_id`) so the act of reviewing can never itself dead-letter.
  Because bucket-filter (D-046) means a deleted row is absent from the device, the queue names such
  records from the flag payload (`displaced_value`/`incoming_value`) — the payload's reason to exist.
  Proven end-to-end from the app (scenario tier): latch → server stamp → re-open, no dead letters.
- D-048 · 2026-07-25 · LOCKED — **Expo SDK pinned + Phase-4 stack re-confirmed** (BOARD bucket H,
  Build Session 4). Pin: **Expo SDK 57 (`expo ~57.0.8`) = React Native 0.86.0 + React 19.2.3**, with
  every companion taken verbatim from `expo@57.0.8`'s `bundledNativeModules.json` rather than
  npm-latest (react-native-screens ~4.26.0, safe-area-context ~5.7.0, gesture-handler ~2.32.0,
  reanimated 4.5.0 with react-native-worklets 0.10.0 — a strict pair, worklets 0.11.x breaks it,
  get-random-values ~1.11.0). `expo-doctor` 20/20. **PowerSync client: `@powersync/react-native`
  2.0.0 + `@op-engineering/op-sqlite` 17.1.2, exact pins**, and `@powersync/node` bumped 0.19.4 →
  0.20.0 so client and the reference test client sit on ONE `@powersync/common` (2.0.0) API — the
  13-scenario torture tier re-greened unchanged on it. This pin bends the popular/mature rule
  (D-022) knowingly: RN 0.82+ is bridgeless-only, and the 1.35.x line's only drivers are
  legacy-bridge quick-sqlite and an adapter capped at op-sqlite ^15 — there is no mature path on
  RN 0.86, and the only "safe" alternative would be re-litigating the whole Expo pin downward. Exit
  plan unchanged (data is plain SQLite; engine swap = the Phase-3 exit to plain Postgres), plus a
  standing check that `@powersync/common` resolves to exactly one copy. **Scaffold stances:** CNG —
  `app.json` + `expo prebuild`, `ios/` and `android/` generated and gitignored, local builds only,
  no EAS, no OTA (`expo-updates` not installed at all); no `metro.config.js` and no
  `babel.config.js` (SDK 57's defaults already derive monorepo watch folders and inject the worklets
  plugin — hand-written monorepo boilerplate is now an anti-pattern); `EXPO_NO_TELEMETRY=1` is the
  live switch (`DO_NOT_TRACK` is a no-op for Expo, kept for other tools); TypeScript stays on the
  workspace catalog (5.x) with `expo.install.exclude: ["typescript"]` — SDK 57's tooling *expects*
  ~6.0.3 but nothing requires it, and fragmenting the single-version rule costs more than it buys
  (a later catalog bump to ~6.0.3 is its own decision; TS 7 is blocked by typescript-eslint 8.x).
  **pnpm's isolated node_modules SURVIVED contact** — Expo's guide and PowerSync's own reference app
  both reach for `nodeLinker: hoisted`, and it proved unnecessary: `pod install` autolinked 294 pods
  through `.pnpm/` paths, Metro resolved `@koi/domain` through its exports map with no alias, and the
  app built and ran. D-025's stance stands unchanged. **Phase-4 charts re-confirmed on paper, not
  installed:** Skia 2.6.2 + Victory Native XL 41.26.0 are the SDK-57-blessed pair and their peers
  accept the pin; XL's Phase-4 "quiet spell" ended (8 releases in a month) but it stays the niche
  exception, and its exit (rebuild two chart types on raw Skia + d3-scale) got cheaper — d3-scale and
  d3-shape are already its transitive deps. Neither is installed until the chart work, so this
  session ships no unused native pods.
- D-049 · 2026-07-25 · LOCKED — **The S-6 client contract, built and proven from the real app**
  (Build Session 4). `@koi/mobile` holds the client half of D-039..D-046 exactly as the server
  pinned it: client schema mirrors `sync_rules.yaml` with `trackPrevious` ON (the base_version echo
  is what makes D-037 work at all), `record_version` as a column, and **no `deleted_at` column
  anywhere** — under bucket-filter a delete arrives as a checkpoint row-removal, so there is nothing
  to filter. A delete is a SQL DELETE; an undo is a re-INSERT of the row captured by the toast
  closure (inv.31/D-040), never an `UPDATE deleted_at`; a car delete sends per-child DELETEs FIRST
  then the car's own, all in ONE client transaction (D-041) so each known child gets its own
  base-echo conflict analysis and peers still see car + children leave together; a car has no undo
  and the confirmation is typed (inv.30/§C4). The connector maps `CrudEntry` →
  `{op, type, id, data: opData, old: previousValues}`, posts `{deviceId, batch}`, and **throws on
  non-2xx** so PowerSync retries — the server's retryable-error path (D-040) depends on it. Auth is
  the `KOI_DEV_AUTH` mint until better-auth. **Proof, not assertion:** nine scenarios (versioned
  round trip · delete removes the row · undo restores it flag-free · atomic cascade · column-conflict
  from a peer · write-on-tombstone · late-child · a domain violation reaching the queue · the S-4
  latch round trip) run from ONE module in two places — under Node in CI against the real stack with
  the app's own schema/connector/write functions (`@koi/mobile` sync tier, `turbo run test:sync
  --concurrency=1` alongside the server's 13), and on the iOS simulator through real Hermes +
  op-sqlite + the RN SDK. The second device in those races is a direct POST to `/upload` with another
  `deviceId`: not a shortcut around the protocol but the protocol itself, indistinguishable
  server-side from another phone. Ordering lesson worth keeping: a local DELETE leaves the local
  database instantly, long before it is uploaded, so a race scenario must gate on "the server has my
  write" (an empty CRUD queue) — gating on "the row is gone here" tests a different, also-correct
  code path and quietly proves nothing.
- D-050 · 2026-07-25 · LOCKED — **The Ⓒ proxy-Hermes caveat is discharged** (BOARD bucket C, Build
  Session 4). The standalone Hermes `jsvu` installs is NOT the engine React Native ships: jsvu tracks
  the newest facebook/hermes GitHub *release* (v0.13.0, self-reporting Hermes 0.12.0, **HBC bytecode
  96**) while RN 0.86 ships **HBC 98** — hand that VM bytecode from RN's own compiler and it refuses
  to run it (exit 5, "Wrong bytecode version"). RN 0.86 also ships no `sdks/hermesc` any more: the
  compiler is the npm package `hermes-compiler` (a direct react-native dependency, hermesc-only) and
  the engine tag lives in `sdks/.hermesv1version`. New CI job `conformance-rn-hermes`: read the tag
  from the INSTALLED react-native (a drifted pin fails loudly rather than testing the wrong engine),
  build a Hermes VM from that exact tag with Meta's release flags plus the two RN itself passes for
  Hermes V1 (`HEAP_HV_PREFER32`, Intl), cache it per tag, then assert **compiler identity**
  (byte-identical bytecode from RN's hermesc and the VM's own, same HBC version) before running the
  golden vectors twice — from source and as bytecode emitted by RN's own hermesc. Both hold at md5
  `f93b1d6b1717043d97f16b0a17416681`. The jsvu job stays as a cheap cross-engine canary and now logs
  its own version so the gap is visible in the log. **Stated honestly, what is still NOT covered:**
  the per-OS Unicode provider (host Linux Hermes uses PlatformUnicodeICU, Android
  PlatformUnicodeJava, Apple PlatformUnicodeCF) and `@koi/domain`'s ordering calls
  `normalize('NFC')` — only a device/emulator vector run closes that, and it stays owed as a narrow
  follow-up rather than being quietly folded into this discharge. Also not covered: the Metro
  transform pipeline for the vectors specifically (Metro DOES bundle `@koi/domain` for the app, and
  that path is exercised by the app build and the on-simulator scenario run). `@koi/domain` itself
  was not touched: the new script lives in `@koi/mobile`, which is where the RN dependency belongs.
- D-051 · 2026-07-26 · LOCKED — **Adversarial review of Session 4, self-adjudicated after the
  workflow's verify pass hit a token-quota wall mid-run** (6 review lenses launched, 4 completed
  raw findings — sync-protocol/ui-honesty/server-latch/privacy-safety — before verification died;
  build-ops/test-integrity never ran). With the machine-verify pass unavailable, findings were
  read against the actual code by hand instead of trusted at face value. **Fixed, same session:**
  (1) `packages/server/sync-tests/helpers.ts` — the reference client schema was missing
  `resolved_at` and its comment still claimed the column was unsynced, contradicting D-047; (2) a
  real evidence-display + restore bug in the S-4 payload reader — `column-conflict`'s bare-scalar
  `displaced_value`/`incoming_value` and `delete-conflict`'s always-object snapshot were
  disambiguated only by "does `column_name` contain a comma", so a single-column `delete-conflict`
  got its snapshot nested a second time under its own key (silently breaking the restore write) and
  `column-conflict`'s evidence rendered as "carries no values of its own" (silently hiding it before
  offering a blind overwrite); fixed by keying the shape on `kind` (`namedPayloadEntries`,
  `packages/mobile/src/review/kinds.ts`), used by both the restore write and the display so they
  cannot drift apart again; (3) `restoreDisplaced` reported success whenever a value was
  restorable, never checking whether the `UPDATE` actually matched a row — a restore attempted on a
  record gone by the time the write lands (a race, not the common case) latched the flag resolved
  on a write that did nothing; fixed to confirm presence inside the same transaction and report
  honestly; (4) the "enter it again as a new reading" honesty affordance (D-047) could itself lie:
  for `late-child` specifically, the reading's own car is *always* deleted, so re-entering under it
  hits `insertLateChild` again and the new row is born tombstoned — vanishing from the device a
  second time with no explanation. Fixed: re-enter only offers when the target car is confirmed
  live (via the existing join), otherwise the screen says plainly why it cannot act — the honest
  fix (a car picker) is app-surface work, not built here; (5) the undo/success toast's 6 s window
  could reset on any unrelated parent re-render (a live query firing elsewhere on the same screen),
  because the dismiss timer's effect depended on an inline closure recreated every render;
  fixed by reading it through a ref so only an actual new toast restarts the clock; (6)
  `PATCHABLE_COLUMNS` moved from a plain object to a `Map` — `record_table` arrives as synced data,
  and a value like `"constructor"` would otherwise resolve through the prototype chain instead of
  missing cleanly. Eight regression tests added (38 mobile unit tests total, up from 30); both sync
  tiers re-verified green against the real stack after the fixes (server 13 + mobile 9 scenarios).
  **Recorded, not fixed — architectural tradeoffs, not bugs:** the S-4 resolve latch carries no
  base_version echo by design (D-047), which leaves one named race (a device offline at a
  deliberate re-open can later replay its own stale resolve and silently re-close it — cost is one
  extra tap, never lost content); `flags:PATCH` has no household scope check yet, consistent with
  the existing household_id/car_id-re-homing deferral (D-038) until a sharing flow (S-14) makes it
  reachable; flag payloads carrying a deleted record's values necessarily reach every device
  including ones enrolled after the delete, an H1 tension inherent to reviewing delete-related
  conflicts at all — S-7 needs a sibling retention policy for flag payloads, not just
  `dead_letters` (spec-delta.md). **Left unreviewed by the workflow** (quota, not signal): CI/build
  correctness and deeper test-integrity questions beyond what this pass covered by hand — a
  narrower follow-up pass on those two lenses is owed, not urgent enough to block the gate.
- D-052 · 2026-07-27 · LOCKED — **③ local-only → sync-on migration: no migration write path exists,
  because none is needed** (the last ⛔ blocker in bucket A before auth, Build Session 5). Verified
  from the PowerSync source, not assumed: `init()` has always applied the full synced schema
  (`powersync_replace_schema`), and its native triggers queue every INSERT/UPDATE/DELETE into the
  local `ps_crud` table the instant it happens — with or without a connection, and independent of
  `connect()` ever being called. "Local-only" is therefore not a separate schema, a separate
  database, or a copy-forward step: it is simply **never having called `connect()`**. Turning sync
  on is exactly one call (`db.connect(connector)`); every write the user ever made while local-only
  is already sitting in the queue, in FIFO order, and drains through the SDK's own upload loop —
  naturally one small POST per original local transaction, never one giant body (no bodyLimit or
  chunking work was needed). The wire shape of a backlogged create-then-edit (or create-then-delete)
  is byte-for-byte identical to one made live: an INSERT with no base, then a PATCH/DELETE whose
  base is null but whose displaced column was last written by THIS device — exactly the "baseless
  offline create-then-edit flow" D-037 law 3 already promises never self-conflicts, whether the gap
  was three seconds or three months. **Proven, not just reasoned**
  (`packages/mobile/sync-tests/local-first.test.ts`, 3 new scenarios, all green against the real
  stack): (1) a single device's full offline backlog — plain create, offline create-then-edit,
  offline create-then-delete — drains with correct final `record_version`s and zero flags or dead
  letters; (2) two devices, each with their OWN independent offline backlog and no shared history,
  both connect (one concurrently with the other) and join the same household with no loss, no id
  collisions, and — recorded, not solved — if both independently added "the same" conceptual car,
  the honest outcome is two car rows (S-9 import-remap territory, not this migration's job); (3) the
  pinned children-first-one-transaction car-delete cascade (D-041) survives being made entirely
  offline before ever connecting. **Client-side (D-006/§C8):** `app_meta.sync_enabled`
  (`packages/mobile/src/sync/mode.ts`) is local-only, device-local, defaults false — `KoiProvider`
  never constructs a connector or reaches `apiUrl` while it is false, so local-only mode makes
  **zero network calls**, matching the constitutional floor exactly. The garage screen's sync card
  (a stand-in for the real §C8 settings surface, bucket D) offers a reversible toggle: "Turn on
  sync" / "Turn off sync" (a pause — future writes stop uploading, nothing already sent is clawed
  back), a live pending-count from `ps_crud` (`SELECT count(*)`, no polling needed — a real table,
  reactive like any query), and copy that is honest in both states without touching the
  release-gated privacy-page rewrite (exact strings in spec-delta.md). No confirmation dialog either
  direction: enabling costs nothing undoable, disabling cannot lose data.
- D-053 · 2026-07-28 · LOCKED — **better-auth mounted for real, replacing the dev mint** (⛔ blocker of
  D-033, Build Session 6). `betterAuth()` runs in-process (`packages/server/src/auth/instance.ts`),
  Drizzle-backed on the SAME Postgres connection and the SAME `db:generate`/`db:migrate` flow as the
  rest of the schema: `@better-auth/cli generate` emits its table definitions
  (`src/db/auth-schema.ts` — `user`/`session`/`account`/`verification`/`jwks`/`passkey`/
  `recovery_code`), drizzle-kit does the actual migration (`0002_gorgeous_mantis.sql`) — no separate
  migration mechanism, answering the brief's open question directly. Single-tenant (D-023
  settings-singleton pattern, not a real multi-user table): one pre-seeded owner row
  (`DEFAULT_OWNER_USER_ID = 'user-owner'`, `db/client.ts`'s `ensureDefaultOwnerUser`, mirroring
  `ensureDefaultHousehold`'s existing pattern) — the simplest thing that doesn't foreclose a real
  S-14 sharing flow (`resolveUser`'s callback is exactly where a future invite flow would branch).
  `user.email` exists only because better-auth's core schema requires a non-null unique value there;
  it is never sent anywhere (`owner@koi.invalid`) — D-025's "no email dependency, EUR 0" is about not
  depending on an email *service*, not the column being absent. Passkey plugin: passwordless
  registration (`requireSession: false` + `resolveUser`) lets the FIRST-ever passkey attach to the
  owner account with no prior session; `resolveUser` throws `FORBIDDEN` on every registration
  attempt after the first (checked by querying for an existing `passkey` row, not a separate flag),
  so the sessionless bootstrap path is one-time, not a standing hole — every later device must sign
  in on an already-registered device first, matching how passkeys are meant to multiply (this guard
  is the load-bearing security property of the whole passwordless-bootstrap design). JWT plugin:
  EdDSA (default), `aud`/`iss` from env.ts's existing `JWT_AUDIENCE`/`JWT_ISSUER` (unchanged names,
  unchanged PowerSync contract), `exp` 24h. `GET /api/auth/jwks` lands at the SAME default path the
  dev shim used — `infra/powersync/config.yaml`'s `jwks_uri` needed no edit. Mounted in Fastify via
  a catch-all `/api/auth/*` route (`app.ts`) that rebuilds a Web-standard `Request` from the raw
  Node request (the documented better-auth Fastify pattern) — bypasses Fastify's own plugin
  lifecycle (no `@fastify/cors` would fire here), moot today since the client is React Native, not a
  browser. One non-obvious fix needed: the reconstructed `Request` must carry
  `content-type: application/json` unconditionally on every non-GET/HEAD call, regardless of what
  the ORIGINAL caller declared — a bare `POST` with no body and no content-type (any no-input
  endpoint, e.g. the test bootstrap) otherwise reconstructs into a request better-auth 415s before
  the handler ever runs; found via a genuinely hung `test:sync` run, not by inspection. `/upload`'s
  bearer check calls `auth.api.verifyJWT` in-process — the exact same check PowerSync itself
  performs against the exact same tokens, so "valid" has one definition across both consumers, never
  two implementations to drift apart. `KOI_DEV_AUTH` and `createAuthShim` are deleted (`auth.ts`
  itself is gone) per D-038's own words ("dies with better-auth"); `tokenBodySchema` (its zod body
  schema) removed as dead code; `jose` dropped from `@koi/server`'s own dependencies now that
  nothing there imports it directly (still present transitively, inside better-auth). All three sync
  tiers re-proven green against the real stack under this real auth, run twice each for stability:
  server torture (13 protocol scenarios + 4 new recovery-code scenarios, D-054, = 17), mobile
  app-semantics (9) + local-first (3) — both unit tiers (42 + 38) unaffected. See D-055 for the
  client passkey ceremony itself and D-056 for how the test tiers authenticate now that the dev mint
  is gone.
- D-054 · 2026-07-28 · LOCKED — **Recovery codes built as a standalone break-glass credential, NOT
  better-auth's `two-factor` plugin** (Build Session 6, D-025's "passkey-primary + recovery codes").
  Investigated first, built second: better-auth ships backup codes only inside `two-factor`, and that
  plugin's shape is genuine 2FA, not a passkey-loss fallback — enabling it flips
  `user.twoFactorEnabled`, and a hook then challenges EVERY subsequent sign-in via a signed
  pending-cookie handshake set by a prior FIRST-factor attempt (`verify-two-factor.ts` — read from
  the installed package source, since the docs don't state this plainly). There is no supported path
  in that plugin to verify a backup code from nothing, which is exactly what a device with no
  reachable passkey has. That is the wrong shape here: passkey sign-in has to stay one tap, not gain
  a mandatory second step on every sign-in. A second, purely mechanical finding closed off reusing
  the plugin's internals even as a shortcut: `generateBackupCodes`/`verifyBackupCode`/
  `encodeBackupCodes` are exported as TYPES ONLY from the public `better-auth/plugins/two-factor`
  entry point (confirmed by a boot-time `SyntaxError` — better-auth's own `.d.mts` re-exports them
  as `type` without a matching runtime export at that path; the real functions exist one module
  level deeper, at a path nothing in the package's `exports` map exposes). So `src/auth/recovery.ts`
  is fully self-contained instead, built on the same PUBLIC primitives `two-factor`'s own
  `enableTwoFactor` handler uses internally (`better-auth/crypto`'s `generateRandomString` +
  `symmetricEncrypt`/`symmetricDecrypt`, keyed on the instance secret) against a small table of its
  own (`recoveryCode`, declared via the plugin's own `schema` field — not `two-factor`'s table, no
  dependency on that plugin being installed at all). Two endpoints, both bypassing
  `user.twoFactorEnabled` and the pending-cookie machinery entirely: `POST /api/auth/recovery/
  generate` (session-required, rotates — old codes invalidated on every regenerate, matching
  better-auth's own semantics) and `POST /api/auth/recovery/verify` (no session — single-owner
  lookup by the fixed bootstrap id, an S-14 sharing flow would need a real claimant-identification
  step before this could serve more than one account) which redeems a code single-use and
  establishes a real session via `internalAdapter.createSession` + `setSessionCookie`, the same
  primitives better-auth's own first-party `anonymous` plugin uses for its sessionless sign-in —
  not a hack, the documented pattern for a custom credential. Proven end-to-end, not just reasoned:
  `sync-tests/11-recovery-codes.test.ts` (4 scenarios) — 10 distinct codes generated; a valid code
  signs in with no session and no prior identification, and the resulting session mints a real
  PowerSync token exactly as a passkey sign-in would; a redeemed code cannot be redeemed twice; an
  invalid code is rejected outright. **Client-side, built vs stubbed (Goal 5's own allowance):** code
  GENERATION and the one-time reveal ARE built (`app/index.tsx`'s post-registration card, `auth/
  flow.ts`'s `generateRecoveryCodes`); a client screen for ENTERING a recovery code to sign in is
  NOT — the server-side proof stands in for it this session. A device that can produce no passkey at
  all (lost device, no iCloud Keychain reach) therefore has no in-app way back in yet; this is a
  stated gap, not a hidden one.
- D-055 · 2026-07-28 · LOCKED (**Ⓓ discharged — the full native passkey round-trip WORKS on device**)
  — **Native passkey on Expo/iOS proven end-to-end, plus four real preconditions nothing had
  priced.** Ⓓ's kill criterion ("native passkey dead-ends AND password flow also fights the SDK")
  did NOT fire; no password fallback was needed. **Proven on the iOS simulator, owner-driven taps,
  verified server-side rather than from the screen:** a real Face ID ceremony registered a passkey
  (`passkey` row: `Koi (ios)`, `multiDevice`, `backed_up=t`, attached to `user-owner`), signed in
  (a live `session` row), generated 10 encrypted recovery codes (`recovery_code`, 342-byte blob),
  and the resulting session minted a PowerSync JWT that **PowerSync itself accepted and synced
  with** — its own log: `Sync stream started user_id: user-owner`, `New checkpoint: 0 | buckets: 1
  | ["1#household[]"]`, `checkpoint_complete`, `user_agent: powersync-react-native react-native/0.86
  ios/26.5`. That last line is the whole point of the session: the passkey→session→JWT→PowerSync
  chain closed with real components at every link. Getting there surfaced four findings, each of
  which cost a real debugging round-trip and none of which is in any doc:
  **(1) Associated Domains requires a PAID Apple Developer Program membership** — free "Personal
  Team" signing (D-048's baseline until now) cannot add the capability at all, independent of
  anything Koi-specific. The owner's team (`AB72ZGY444`) is enrolled; the build signs clean with the
  entitlement present. Note the team id is NOT the `TK6Z94M3S5` visible on the keychain's
  "Apple Development: accounts@gariasf.com" certificate — the identifier Apple actually matches
  against came from the failure log itself (`Application with identifier AB72ZGY444.tv.titanos.koi
  is not associated with domain ...`); trusting the certificate string cost one wrong AASA file.
  **(2) The dev loop needs a resolvable domain serving `/.well-known/apple-app-site-association`
  over TLS** — a placeholder (`koi.example`) builds fine and fails only at ceremony time with an
  opaque `ASAuthorizationError 1004`. What worked, and is the reusable recipe: `?mode=developer` on
  the entitlement + `sudo swcutil developer-mode -e true` + an `/etc/hosts` override pointing a real
  domain (`koi-dev.gariasf.com`) at 127.0.0.1 + a self-signed cert trusted via
  `xcrun simctl keychain booted add-root-cert` + a local HTTPS server serving the AASA. swcd accepts
  a self-signed cert in developer mode — confirmed in its own log (`TLS handshake complete`,
  `status 200`, `finished successfully`). No public DNS, no router changes. Production needs the
  real thing, which Caddy + real TLS already covers (D-025).
  **(3) `@better-auth/expo`'s client and SERVER plugins are a matched pair, and the failure mode of
  installing only the client is invisible until the first POST.** A React Native request carries no
  `Origin` header at all; better-auth rejects every state-changing POST without one (403
  `MISSING_OR_NULL_ORIGIN`) while GET option-fetches sail through, so registration appeared to
  "almost work" for several attempts. The Expo client stamps the app scheme into a custom
  `expo-origin` header, and ONLY the server-side `expo()` plugin reads it back and rewrites the
  request origin. Adding `expo()` to the server plugin list fixed it outright.
  **(4) Registering a passkey does NOT sign you in.** better-auth's passkey plugin calls
  `createSession` in exactly one place — the AUTHENTICATION path; `verify-registration` only stores
  the credential (verified by reading the plugin source: one `createSession` occurrence, in
  `verify-authentication`). The first implementation returned success straight after registration,
  so the passkey row existed while every later token mint 401'd against a session that was never
  created. `auth/flow.ts` now always follows a registration with a sign-in — which means first-time
  setup shows TWO Face ID prompts (register, then authenticate); a returning device shows one.
  Recorded as known UX roughness for the bucket-D app surface to smooth, not a correctness issue.
  Niche-tool register (D-022): the native bridge is `expo-better-auth-passkey` (kevcube, MIT, 33★,
  pinned `1.4.3`) — a drop-in `expoPasskeyClient()` wrapping
  `ASAuthorizationPlatformPublicKeyCredentialProvider` (iOS) / Credential Manager (Android) behind
  better-auth's own `passkeyClient` API surface; its declared peer range (`expo: ^55.0.0`) is stale
  against our pinned SDK 57 but pnpm's peer check is advisory-only and the real build/run works —
  known metadata lag, not a functional gap. Exit plan: the primitive underneath
  (`react-native-passkeys`, peer range `expo: >=53.0.0`, no conflict) is the real dependency
  surface; if the wrapper stops working, a thin `expoPasskeyClient`-shaped adapter directly over it
  is a contained rewrite. **Owner-driven, not scripted:** the taps and Face ID approvals were the
  owner's — scripted iOS UI is still blocked (bucket H: no Accessibility grant, no `idb`, no
  Maestro), so every claim above is backed by a server-side or database check rather than by
  screen-reading, matching the precedent Session 5 set (D-052).
- D-056 · 2026-07-28 · LOCKED — **How the sync-torture tiers authenticate now that `KOI_DEV_AUTH` is
  gone, chosen to structurally exclude the exact hole it was gated against (D-038: "a server that
  reaches a network without better-auth must not silently hand out tokens").** No WebAuthn
  authenticator exists in a headless Node test process, so a torture-tier "device" cannot complete a
  real passkey ceremony, and a fresh stack's first boot has no recovery codes either (they need a
  passkey registration to exist first). Chosen: a dedicated `testBootstrapAuth` better-auth plugin
  (`packages/server/src/auth/test-bootstrap.ts`) mounted ONLY when a caller passes `testBootstrap:
  true` to `createAuth` — a source-code decision at the call site, not a runtime one. `main.ts`
  (the real server) calls `createAuth(env, db)`, two arguments, structurally never passing the flag;
  only `sync-tests/global-setup.ts` (server) and `packages/mobile/sync-tests/global-setup.ts` do.
  Unlike `KOI_DEV_AUTH`, there is no environment variable that could be left set by an ops mistake —
  enabling the hole requires editing `main.ts` itself, a reviewable diff, not a misconfigured
  deploy. Defense in depth on top of that structural exclusion: `createAuth` throws at construction
  if `testBootstrap: true` is ever combined with `NODE_ENV=production`. Verified directly, not just
  reasoned: `curl -X POST http://localhost:4000/api/auth/test/bootstrap-session` against the REAL
  dev server (`main.ts`, no flag passed) returns 404 — the endpoint is structurally absent, not
  merely unauthorized. The endpoint itself mints a session for the pre-seeded owner row only (no
  user creation — a test stack that forgot to seed `ensureDefaultOwnerUser` fails loudly instead of
  minting a session for nothing). Test harnesses (`TestConnector` in `packages/server/sync-tests/
  helpers.ts`, `KoiConnector`'s test callers via `packages/mobile/sync-tests/test-auth.ts`) cache the
  resulting session cookie rather than re-bootstrapping per upload call — first written to
  re-bootstrap every time, which surfaced as a genuine intermittent failure (`04-dead-letter.test.ts`
  flaked once under the added latency) before the cache fix; caching is both faster and more honest,
  since a real client signs in once and only re-mints the short-lived PowerSync JWT per upload, never
  re-establishes a whole session.
- D-057 · 2026-07-28 · LOCKED — **The S-4 review queue joins Home's state machine** (bucket D's
  wireframe pass, Build Session 7). The queue was invented in Session 4 (D-047) and is absent from
  `koi-core-spec.md` §C entirely; it has been sitting on a scaffold route behind a permanent card at
  the top of the garage screen. Resolved: **Home selects its state on both counts** — `Needs you`
  fires on an overdue reminder **or** an open review item, and `All clear` requires zero overdue
  **and** zero open flags, so the one surface that promises "Everything OK" cannot say it while two
  devices disagree in a drawer. The band renders **only** when the queue is non-empty (the calm
  owner who never has a conflict never meets it, so article 2 is intact — Home does not grow a fifth
  always-present thing); it sits under the reminder hero when both exist and **becomes** the hero
  when nothing is overdue (an overdue ITV has a date in the real world, a data disagreement does
  not). A flag gets no `Snooze` and no `Mark done` — the only honest action is to go look. The queue
  page is **pushed inside the Home tab**, and a second always-present door lives in Settings ›
  `Review notes` so resolved items stay reachable (D-047: a decision is part of the record, not a
  deletion). Zero cars wins the screen: with no live car the queue's real action ("enter it again")
  has nowhere honest to put the record, so `Add your car to begin` stays the hero and the queue gets
  a quiet row beneath it. Cap reminders never drive the state (`mileageCap` never notifies by
  design; §I use case 3 insists nothing flashes) — over-cap surfaces in the garage chip and the
  car-page gauge per inv.26. Cost: one reactive query over both counts, half of which already exists
  and is already live-queried (`OPEN_FLAG_COUNT_SQL`). Wireframes: `docs/build/wireframes.md` §2,
  §14.1; amendment recorded in `spec-delta.md`.
- D-058 · 2026-07-28 · LOCKED — **Sync, account and the privacy card live in §C8's Settings sheet**
  (Build Session 7). Sessions 5 and 6 put the sync toggle, passkey sign-in and the one-time
  recovery-codes reveal on the garage screen and said in writing it was a stand-in until the real
  app surface existed. Resolved: a pushed **`Sync`** page inside the Settings sheet owns the
  reversible toggle, connection status, pending-upload count, device alias, `Recovery codes ›` and
  the failure sentence. Named `Sync`, **not** "Sync & devices" — there is no device registry, only
  this device's id, and a title promising a list Koi cannot produce would be a §D5 violation in the
  surface whose whole job is trustworthiness. Four substantive changes to what the build ships, each
  because the current version is not true: (1) **the privacy card keeps its always-true claims in
  both sync states** — D-006's floor (no ads, no trackers, no analytics, free complete export, sync
  strictly opt-in) does not change when sync comes on, and Session 5's card dropped the whole line
  wholesale, letting a user infer analytics might now exist; the sync-on sentence itself stays
  spec-delta's exact reviewed wording. (2) **No pending count in the sync-off state** — the number
  came from `ps_crud`, an upload *queue*, so a created-then-edited record counts twice and "N records
  kept here so far" over-reports (§D5: sums that would lie are withheld). (3) **`Erase everything`
  becomes `Erase this device` while sync is on, and turns sync off first**, saying so — with sync on
  a local wipe re-bootstraps from the checkpoint and the records come straight back, S-7 is not
  built, and a mislabelled destructive button is the worst possible place to break §D5. (4) **the
  two-Face-ID stutter gets a sentence now** ("twice the first time, once after that."), with the real
  fix (registration establishing a session) left as a server obligation. Recovery-code **entry** is
  wireframed and marked NOT BUILT (D-054), reachable only from the failed-sign-in banner — never as
  an always-present row that invites burning one-use codes. Sync is never offered in onboarding
  (opt-in from Settings only). No sync badge anywhere in the shell — accepted and recorded: a
  long-broken sync is discovered on a visit to Settings, and a dot on four roots would nag about
  something the car does not need. The release-gated privacy **page** is untouched (bucket F, ⛔,
  carrying D-023/D-016's obligations). Note for the record: article 7 was already renegotiated at
  the investigation gate (D-012 → D-005/D-006), so these surfaces bind to D-006's floor rather than
  to article 7's original wording. Wireframes: `wireframes.md` §12, §14.2.
- D-059 · 2026-07-28 · LOCKED — **Dark mode: the wireframes carry colour ROLES; the authored dark
  palette is its own follow-up item** (Build Session 7, discharging the Session 4 "dark mode is
  owed" note into a plan). §D3 makes dark co-primary and explicitly not an inversion pass; the
  scaffold ships the light pair only. Resolved: every element in the wireframe pass names its colour
  **role** (`{fuel}` `{service}` `{expense}` `{contract}` `{ink}` `{attention}` `{critical}`
  `{paper}`), which is palette-independent and is the part ASCII can actually settle — and the
  authored palette becomes a **new bucket-D board item**, sequenced **before History's build
  session** (History is the surface a bad dark palette breaks worst: dimmed archived rows over
  faint-ink metas). Two hex columns in a text file would have been unreviewable as colour and would
  have read as decided. The same item carries three defects the light pair already has, found while
  drawing: `positive === accent === domain.fuel` in `theme.ts` (a positive state and fuel money are
  literally the same pixel, which §D3 forbids — "semantic colors … never used as 'series 4'");
  `inkFaint` is the exact faint-ink contrast risk §H4 lists as debt, and archived rows plus every
  degraded meta depend on it; and the app declares `"userInterfaceStyle": "automatic"` while
  `_layout.tsx` hard-codes `<StatusBar style="dark" />`, so in dark mode that status bar is dark on
  dark. **The `Appearance` control (System / Light / Dark) has its slot in Settings and ships in the
  same increment as the palette, not earlier** — a Dark option that selects a palette nobody drew is
  worse than no control. Wireframes: `wireframes.md` §0.3, §12.1, §14.3.

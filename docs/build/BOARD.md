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

- **NEXT (Session 4, owner-approved 2026-07-25): scaffold @koi/mobile → S-4 review queue.**
  S-4 (where this session's flags land) has no home until the client app exists, so Session 4
  is: Expo SDK pin + Phase-4 re-confirm (bucket H) → scaffold @koi/mobile (Bundle A) → PowerSync
  client connector honoring the S-6 client contract (delete=DELETE, cascade=children-first,
  undo=re-INSERT; NO deleted_at column per D-046; trackPrevious ON) → S-4 review queue → on-device
  Hermes CI step (bucket C). Full paste-ready brief in `docs/build/next-session.md`. Then ③
  local→sync migration → passkey (order per §4.A). S-6 shipped (Session 3).
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
| todo | ⛔ | S-4 client post-merge review queue ("Review now" pattern; where flags land) |
| todo | ⛔ | ③ local-only → sync-on first-enable migration, lossless |
| todo | ▲ | S-7 erase-everywhere (truncate + purge ledger + compaction + ≤24 h revocation) |
| todo | ▲ | S-9 import remap + dedup ordinal |
| todo | ▲ | S-1/S-2/S-3/S-8/S-10/S-11 (ids · versioning · derived-never-sync · recurrence idempotency · unknown-field round-trip · offline-first capture) — S-2/S-3 schema stances landed in Session 2 (record_version everywhere; no current_odo column, derived via domain); server-side S-10 stance = strict-reject→dead-letter, client half still owed |
| todo | ▲ | S-12 preference split (synced vs device-local) |
| todo | ▲ | S-13 per-device notification scheduling (no push infra) |
| todo | ▲ | engine-agnostic domain set: lineage swap, occurrence identity, dedup ordinal, settings singleton, "keep both", post-flag validation |
| doing | ▲ | sync torture-test suite (Spike ② scenarios graduate into it) — Session 2 seeded 5; Session 3 grew it to 13 (S-6 tier: tombstone propagation · edit-vs-delete both orders · atomic cascade · late child · undo round-trip + foreign-reject · DELETE replay idempotency) on two @powersync/node clients + CI job; grows with S-4/③ |

### B · Backend / infra / auth
| st | sev | item |
|---|---|---|
| todo | ⛔ | better-auth passkey-primary + recovery codes + no-email FULL round-trip |
| todo | ▲ | Android-over-network initial-sync measurement |
| todo | ▲ | self-hosting ops: WAL-slot alert, compaction cron, disk alert, ~6-mo SDK windows |
| todo | ▽ | server discipline: no user content in logs, no analytics, no 3rd-party processors |

### C · Domain / CI
| st | sev | item |
|---|---|---|
| todo | ▲ | on-device (RN-bundled) Hermes golden-vector CI step — needs @koi/mobile app; CI's standalone-Hermes (jsvu) job is the spike proxy, not the discharge |
| done | ▽ | @koi/domain primitives build-out — Session 1: money/civil-date/ordering/ids/economy, ESLint bans, vectors byte-identical tri-engine (md5 f93b1d6b…). date-fns v4 stays the sanctioned calendar dep; primitives needed none of it (hardening calls delegated to assistant at gate; kept) |
| todo | ▽ | i18n setup: i18next + shared JSON catalogs (@koi/i18n); adopt the Selector API from the start — i18next v27 plans to drop type-level string keys (parking-lot promotion, D-035) |

### D · Clients (mobile + web)
| st | sev | item |
|---|---|---|
| todo | ▲ | full Bundle A app build (capture + ledger + record + Insights) |
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
| todo | ▲ | Expo SDK pin + Phase-4 re-confirmation (before @koi/mobile scaffold) |
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

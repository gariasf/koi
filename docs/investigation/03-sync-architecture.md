# Phase 3 — Sync & data architecture

**Question:** how does a private ledger sync? Landscape → shortlist 2–3 → paper-design Koi's data flow on each → recommendation + refusals.

**Inputs:** charter carry-forward (criteria weights, privacy rungs), Phase 2 delta (S-1…S-14), `koi-core-spec.md` §B on demand.

**Working hypothesis (validated in Phase 4):** clients are TypeScript (RN + web). A bounce-back rewrites via SUPERSEDED, not silently.

## Evaluation criteria (from locked gates — not renegotiated here)

Privacy fit (rungs: E2EE-no-accounts > E2EE+account > server-readable; floor per D-006) ≻ invariant preservation under merge (flag-never-fix, S-4/S-5) ≻ offline depth (S-11) ≻ solo maintainability (TS-strong) ≻ cost ≤ €25/mo (D-009) ≻ maturity/bus factor ≻ learning value (tiebreaker, D-011).

## Landscape (as of 2026-07-17)

15 briefs in `research/03-sync/2026-07-17-*.md`; every non-refused brief carries an appended adversarial `## Verification` section. Scores 0–5 against the weighted criteria (privacy · invariant-merge · offline · client TS/RN/web · solo · cost · maturity):

| Candidate | Verdict | Best privacy rung | Scores (p·i·o·c·s·€·m) | One-liner |
|---|---|---|---|---|
| **DIY op-log** (Actual Budget model) | **shortlist** | E2EE-no-accounts | 5·5·4·4·2·5·3 | Only route to top rung; you own the apply loop, so flag-never-fix is native. Cost: it's a second product to maintain. |
| **Evolu** (via sweep) | **shortlist** | E2EE-no-accounts (native) | 5·4·4·4·4·5·2 | Only *engine* that ships the top rung out of the box (mnemonic owner, blind MIT relay, record-level TS, RN/web). Bus factor ~1. |
| **PowerSync** (self-hosted) | **shortlist** | server-readable (self-host); E2EE+account DIY | 3·5·5·5·3·4·4 | Server-authoritative pole: every write hits your TS backend → invariant checks server-side, "accept with 2xx + flag" is the documented pattern. Strongest vendor-death exit (plain Postgres). |
| E2EE approaches (cross-cutting) | layer, not engine | — | — | Blind-relay E2EE (Evolu/Actual model) is the only route to rung 1; forces all invariant checks client-side. Feeds all designs. |
| LiveStore | possible | server-readable | 3·5·5·4·3·5·2 | Event-sourcing = best native idiom for flag-never-fix, but pre-1.0, bus factor ~1; its idiom is captured by the DIY design at a better rung. |
| Automerge | possible | server-readable | 3·5·5·2·3·5·4 | Merge-observation hooks excellent; RN support weak (wasm), record-vs-document granularity awkward. |
| Yjs | possible | E2EE-no-accounts (via beta secsync) | 4·3·5·3·2·5·4 | Mature and vendor-death-proof; structured-ledger fit awkward, Koi-shaped sync = bespoke layer anyway. (Researcher live-tested `observeDeep` remote-merge hooks.) |
| ElectricSQL | refuse | server-readable | 1·4·2·4·2·4·3 | Read-path sync only; entire write path DIY; E2EE architecturally impossible (reads Postgres logical replication plaintext). |
| Zero (Rocicorp) | refuse | server-readable | 1·4·0·4·3·4·3 | Online-first by design: offline writes rejected, offline support explicitly deprioritized. Fails S-11 outright. |
| Jazz | refuse | E2EE+account (v1 only) | 2·4·4·4·3·5·1 | v1 fit was unusually good, but vendor moved to v2 dropping the E2EE track; 5-person no-funding bus factor on a legacy branch. |
| Triplit | refuse | server-readable | 2·2·4·4·1·4·0 | Vendor dead: YC lists Aspen Cloud inactive, triplit.dev returns HTTP 410, no release since 2025-07. |
| InstantDB | refuse | server-readable | 1·3·2·4·3·3·2 | CEL permissions need server plaintext; silent server-authoritative merge; local-only-no-account floor unsupported. |
| Supabase | refuse | server-readable | 2·2·1·4·2·3·5 | Not a sync engine — no first-class offline story as of 2026-07; using it = DIY-oplog plus a ~€23/mo dependency. |
| Firebase/Firestore | refuse | server-readable (Google-hosted) | 1·2·2·4·5·5·4 | Fails privacy floor: no self-host ever, LWW with no merge hooks, real account required. |
| CloudKit | refuse | E2EE+account (per-user ADP opt-in) | 2·3·3·1·2·5·4 | No credible Android path; CloudKit JS frozen pre-Promises and breaks against Advanced Data Protection — E2EE and the web client are mutually exclusive. |

## Shortlist

Three paper designs, spanning the architecture space: **DIY op-log** (blind relay, rung 1, max build cost) · **Evolu** (rung 1 off the shelf, max vendor risk) · **PowerSync self-hosted** (server-authoritative, best invariant home + exits, rung 3). E2EE brief feeds all three. LiveStore/Automerge/Yjs documented as "possible", not designed — each is dominated inside the shortlist's span (see one-liners).

## Paper designs (2026-07-17)

Full designs in `research/03-sync/2026-07-17-design-*.md`, each with an appended adversarial review (Evolu got two passes). All three verdicts: **sound-with-fixes** — nothing fatal anywhere; every hole has a fix inside its architecture.

| | Evolu | DIY op-log (Actual model) | PowerSync self-hosted |
|---|---|---|---|
| Privacy rung | **1 — E2EE-no-accounts**, native (flat BIP39 mnemonic, no KEK→DEK; relay sees IPs) | **1 — E2EE-no-accounts** (KEK→DEK, recovery code; relay sees IPs/timing) | **3 — server-readable**, softened by single-tenant self-host; E2EE variant forfeits its main advantage |
| Odometer flagship | Works, verified in v7.4.1 source: apply → `refreshQueries` → domain watcher → derived review queue, deterministic flag ids | Works, cleanest: `applyMessages()` is Koi-owned code — post-merge hook is a function call | Works, verified: server runs `@koi/domain` on upload, flag committed atomically with data, "accept with 2xx + flag" |
| Invariant home | Client-only, structural (blind relay) | Client-only, structural | Server + client — the only design with a server-side home |
| Sync-layer effort (10 h/wk) | **10–14 wk** — engine free, S-machinery bespoke | **15–25 wk** — everything bespoke; `@actual-app/crdt` (MIT, alive 2026-06) reuse shaves only ~30–40 h | **12–18 wk** — whole write path bespoke anyway |
| Cost | €7–10/mo | €7–9/mo | €8–13/mo (4 containers) |
| Bus factor / exit | **Worst**: solo author, v7 frozen (fork-patches from day one), v8 incomplete, RN peer-dep drift; exit OK (data = local SQLite, sync swappable behind KoiStore) | No vendor — risk transposes into solo-owned silent convergence bugs, unaudited crypto composition | **Best**: healthy vendor, plain-Postgres exit |
| Review majors | S-5 edit-vs-delete silent absorb · blob-GC/cascade collision · erase residual races · frozen-line maintenance | relay auth unspecified (ERASE = unauthenticated remote wipe) · snapshot-restore resurrects erase · S-5 push-before-pull silent LWW · S-9 collapse | S-5 column attribution impossible on row versions · erase leaves plaintext in bucket history until compaction · S-9 two-device import wedges queue · rung-3 privacy-page truth |

**Engine-agnostic findings** (recur in all three reviews — domain-model work owed regardless of engine): `Plan.carIDs` lineage under LWW needs its own concurrent-swap treatment; S-8 next-occurrence identity must not depend on resolution *day* (inv. 32 catch-up makes it today-dependent); S-9 natural-key dedup collapses legitimate duplicate money-only fills (spec §B3 says common-and-kept) — needs an ordinal or source-row component; synced-settings singleton needs a well-known deterministic id; "keep both" on a flagged non-monotonic pair needs defined downstream semantics (proposal: enclosing interval yields no number, mirroring `missedPrevious`); post-flag entry validation must not dead-lock backdated entries between conflicting readings.

## Gate amendment (2026-07-19)

At the gate the owner raised the weight of maturity/community: **avoid small/small-community tools; prefer popular ones when right for the job and familiarizable.** With the rungs priced (Phase 3's mandate under D-005), rung 1 exists only via small tools (Evolu bus-factor-1, bespoke DIY, or niche glue on Yjs). Presented the trade explicitly; **owner chose PowerSync self-hosted at rung 3.** The original rung-1 recommendation below the ledger trail (D-018/D-019) is SUPERSEDED → D-022; this section records the standing decision.

## Refusals (as amended at gate)

- **Evolu** and **DIY op-log**: refused as primary under the amended weights — Evolu is the small-community case in its purest form (solo author, frozen v7 line, fork-patches from day one); DIY is a bespoke solo-owned protocol with no community at all. Both remain the documented rung-1 fallback pair if PowerSync fails its spikes *and* the owner re-raises the rung.
- **Landscape refusals** (briefs on file, unchanged): ElectricSQL (read-path only), Zero (offline writes rejected — fails S-11), Jazz (E2EE track abandoned in v2), Triplit (vendor dead), InstantDB (server-plaintext permissions, no local-only floor), Supabase (no offline story — it's DIY-oplog plus a dependency), Firebase (privacy floor fail, no self-host), CloudKit (no Android; E2EE and web mutually exclusive).
- **Documented, not designed:** LiveStore, Automerge, Yjs — each dominated inside the shortlist's span (see landscape table).

## Recommendation (locked at gate, 2026-07-19)

**Direction: PowerSync self-hosted (Open Edition) + bespoke TS write-path API + Postgres — privacy rung 3, self-hosted server-readable.** Single-tenant on the owner's VPS, no third parties, account exists only once sync is enabled, local-only floor fully intact (D-006). Mainstream stack throughout: Postgres, SQLite, TS API server (NestJS is a natural fit — D-011 learning bias), Docker. €8–13/mo, 4 containers + a monitoring sidecar, ~½ day/month steady-state ops. Vendor healthy (releases a week old at research time); exit = plain Postgres, strongest in the field. Server components FSL (fair-source), converting to Apache-2.0 per release after 2 years.

**Invariant home (the design's unique strength):** `@koi/domain` runs server-side on every upload against canonical Postgres — "accept with 2xx, write violations to a synced flags table, never reject" is the documented engine pattern — *and* client-side on write. Flag committed atomically with the data. The flagship odometer walkthrough survives mechanical scrutiny (see design doc).

**Per-field E2EE envelope** remains a documented upgrade path (rung ~2) — priced, and knowingly cannibalizes the server-side validation that justifies PowerSync. Parked, not planned.

**Obligations carried out of adversarial review** (design fixes owed, none fatal):
1. S-5: `base_version` echo protocol needs per-column attribution work — spike ⑤; as drafted it can't distinguish same-column overwrites from disjoint-field merges.
2. S-7: erase = server TRUNCATE + purge ledger (distinguish purged from never-existed) + compaction cron (bucket op-history holds plaintext until compaction — tighten cadence) + token-revocation window ≤24 h + privacy-page disclosure that backups rotate out over ~30 days.
3. S-9: two-device CSV import needs a car-id remap step (MyCar rows carry no source ids; as drafted it wedges the upload queue or mints orphans).
4. Engine-agnostic domain set (identical across all three reviews): lineage swap under concurrency, S-8 occurrence identity must not depend on resolution day, S-9 dedup ordinal for legit duplicate money-only fills, settings singleton = well-known id (owner id), "keep both" downstream semantics (enclosing interval yields no number, mirroring `missedPrevious`), post-flag entry validation must not dead-lock backdated entries.
5. Privacy page truth (H1): no "no-account" claim; "a server you run" is true only for the owner — growth users get honest wording (their data readable by the operator unless they self-host); Safari ITP web unpair (~7 idle days) disclosed in web onboarding.

**Spike list feeding Phase 5** (pre-registered candidates; phase picks ≤4): ① one-VPS reality — full stack on 4 GB + 5k-record initial sync on mid-range Android (kill: OOM or minutes-plural); ② write-path round trip on two simulators — offline conflicting odometers → upload → atomic violation flag → checkpoint down (kill: flag not atomic as observed, or API errors wedge the queue); ③ local-only → sync-on migration of a real dataset via the documented table-move (kill: data loss or forced wipe); ④ Postgres bucket storage (Beta) under restarts/compaction/slot recovery (kill: corruption or forced MongoDB fallback, which breaks the 4 GB budget); ⑤ `base_version` concurrent-edit protocol (kill: PATCH granularity can't attribute same-field overwrites). Capture-feel spike (D-012 park trigger) is Phase 5 canonical and unaffected by the engine choice.

## Carry-forward

- Direction LOCKED at gate 2026-07-19 (owner amendment: maturity/community weight raised — popular tools preferred; D-022): **PowerSync self-hosted + bespoke TS write-path API + Postgres; rung 3, single-tenant; account only when sync on; local-only floor intact.**
- Invariants: `@koi/domain` runs server-side on every upload (accept-with-2xx + synced violation flags, atomic with data) and client-side on write; "flag, never fix" holds.
- Cost €8–13/mo; ops ~½ day/mo (4 containers + monitoring, WAL-slot alert, compaction cron); FSL server → Apache-2.0 after 2 yrs/release; exit = plain Postgres.
- Per-field E2EE envelope = parked upgrade path (rung ~2); cannibalizes server validation — revisit only on explicit rung re-raise.
- Obligations owed (see Recommendation): S-5 base_version protocol, S-7 erase mechanics + disclosures, S-9 import car-id remap, engine-agnostic domain set, privacy-page truth items.
- Phase 4: iOS native option **open again** (PowerSync Swift SDK GA) — RN vs SwiftUI is now a free choice; RN + web JS SDKs GA; NestJS natural candidate for the write-path API.
- Spikes ①–⑤ pre-registered above; sync-torture and capture-feel remain Phase 5 canonical.
- Evidence: 15 landscape briefs + 3 adversarially-reviewed paper designs in `research/03-sync/` (claims as-of 2026-07-17); rung-1 alternative pair (Evolu / DIY op-log) fully designed and reviewed — reusable if bounced back.

## State (session log)

- **Session 1 (2026-07-17):** phase opened, fan-out approved at Phase 2 gate. Ran full method in one session (ultracode): 15-brief landscape workflow (each non-refused brief adversarially verified; 1 verify agent lost to session limit, re-run later) → shortlist DIY-oplog/Evolu/PowerSync → paper-design workflow (Evolu re-verified, 3 designs, 3 adversarial reviews; Evolu reviewed twice). All designs sound-with-fixes. Rung-1/Evolu recommendation drafted, refusals written, spike list pre-registered. Status: gate. Known debt: brief filenames normalized to `2026-07-17-*` after agents drifted.
- **Session 2 (2026-07-19, gate):** owner amendment — maturity/community weight raised (popular tools preferred; recorded in memory + D-022). Rung trade presented with rungs priced; owner chose PowerSync self-hosted rung 3. Recommendation, refusals, carry-forward, spike list rewritten; D-018/D-019/D-021 superseded, D-022/D-023 locked. **Status: locked.**

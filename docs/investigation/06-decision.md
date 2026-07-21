# Phase 6 — Decision

**Question:** should Koi become a multiplatform product (iOS, Android, web, syncing server), and on what architecture? This phase renders the verdict, fixes the final architecture, compiles the build-phase backlog, and plans the repo reset that opens the build.

**Method:** synthesis only — no new research, no new code. Every claim traces to a LOCKED decision (`decisions.md`, D-001…D-030), a Phase 5 spike verdict (`05-spikes/README.md`), or a carry-forward block. Product truth stays `../koi-core-spec.md`, amended only via `02-requirements-delta.md`. The draft verdict + architecture block + backlog + parking-lot dispositions were run through an adversarial pass before writing (four skeptics attacking the D-012 park triggers, a backlog-completeness critic, an architecture-consistency checker, a parking-lot triage) — findings folded in below, most consequentially the sync-scope correction in §4.

**Status: LOCKED 2026-07-21 — owner signed "lock". Investigation closed.** D-031…D-036 are LOCKED; the verdict is GO; the ~4 GB spike teardown is authorized (scheduled into Build Session 1 per §5, so the seed can be mined into the new repo first). Naming resolved (product Koi, repo `koi`); pricing model carried OPEN into build (D-009). Next: Build Session 1 — the repo reset (§5).

---

## 1 · Verdict — GO

**Build it.** The replatform is a go: Koi becomes a multiplatform product (iPhone daily driver + conditional-now-confirmed Android peer + read-mostly web companion + single-tenant self-hosted syncing server), on the Bundle A architecture fixed in §3.

The go rests on a clean pass of the D-012 park test (§2): all four park triggers are decisively **clear** on LOCKED evidence, and no trigger fired anywhere in Phase 5 (D-030). Every technical bet that could have hit a hard wall was de-risked by a winning spike — capture feel on both platforms (Ⓐ), the write-path round trip + server footprint (②/①), domain cross-engine purity (Ⓒ), chart perf (Ⓑ). What remains is bounded, known-pattern build work with the owner in control of every conflict decision (exit = plain Postgres, no vendor CRDT black-box), not architectural uncertainty.

**Honest qualifier (does not change the verdict):** the build surface is larger than the session brief's backlog summary implied — the sync layer is the full S-1…S-14 set (D-013), not just the rung-3 spike subset S-5/7/9 (see §4). This enlarges the build; it does not threaten it. The decisive mitigant is D-011: solo, TS-strong, 10+ h/wk, **no hard deadline**. A long build at a sustainable rate is not an over-capacity roadmap. The single most important build discipline that follows: treat the still-open sync-correctness obligations (⑤ base_version, exhaustive op-handling, S-6 deletes, S-4 review queue, ③ migration) as first, blocking work — silent data loss is the one failure mode a solo dev with no second reviewer is least equipped to catch late.

---

## 2 · Park-trigger test (D-012)

The four park triggers, each tested explicitly against its evidence. Verdict on each: **clear** (does not fire). Residual risk is carried into the build backlog (§4), not left latent.

| # | Park trigger (D-012) | Deciding evidence | Verdict | Residual risk carried to build |
|---|----------------------|-------------------|---------|-------------------------------|
| ① | Invariants don't survive sync | Spike ② WIN (atomic flag, no silent loss, queue-safe) + Ⓒ WIN (byte-identical convergence substrate) | **Clear** | ⑤ base_version + exhaustive op-handling + S-4/S-6/S-7/S-8/S-9/S-10 unspiked → §4.A |
| Ⓐ | Capture feel fails | Spike Ⓐ WIN across iOS+Android; owner on-device sign-off "good enough" (D-029); k1+k2 (headline Android-sheet risk) PASS | **Clear** | Android tactile (spring/haptics) felt only on emulator; per-surface feel re-check as built → §4.D/G |
| € | Privacy floor unaffordable | Rung 3 €8–13/mo (D-022) under €25 envelope (D-009); ① footprint ~470 MiB vs 4 GB ceiling | **Clear** | Privacy-page rewrite is a pre-sync-ship release gate; growth-scale infra economics unpriced → §4.F, §7 |
| ⏱ | Roadmap exceeds solo capacity | D-011 no-deadline; all-TS single-language stack; one RN codebase for two platforms; port not greenfield | **Clear** | Least-evidenced trigger — no spike measured it; judgment resting on the no-deadline mitigant → §4 as a whole |

**① Invariants survive sync — clear.** A park trigger fires only if the architecture is *incapable* of preserving invariants; the evidence shows the opposite. The load-bearing mechanism was proven end-to-end on real code (② WIN): offline concurrent writes → bespoke Fastify write-path → `@koi/domain` server-side validation → violation flag committed **atomically** with the data → 2xx accept (never reject) → checkpoint down → both clients converge and observe the flag, queue not wedged. Rung 3 is server-authoritative with a *bespoke* write-path (D-022): the owner's own code sees every op and decides, so the interception point where base_version compare-and-flag lives is architecturally guaranteed and was already exercised by the append-row case. Ⓒ removes the deepest failure mode — non-deterministic convergence — by proving V8 == JSC == Hermes byte-identical on the exact collation/NFC/date/money/economy risks, so a merge resolved server-side and recomputed on any client yields the same answer. The still-open ⑤ (same-column overwrite) is a missing PATCH handler in throwaway spike code, not a discovered incapacity — a mechanical optimistic-concurrency add. **Clear, conditional on ⑤ and exhaustive-op-handling being carried as blocking build gates — which §4.A does.**

**Ⓐ Capture feel passes — clear.** The trigger sits at a deliberately high threshold: "feel fails on *both* platforms broadly," with Bundle B and per-surface fixes as escape hatches *below* it (D-024). The evidence is the opposite of broad failure: Ⓐ WIN on structure/fidelity/build across iOS+Android, k1 (iOS sheet+keypad) and k2 (Android sheet fidelity — the headline 16-open-issue risk) both PASS, Expo-UI escape hatch not needed, owner ran the on-device feel-check and signed "good enough" (D-029). Residual: the Android tactile refinements (k3 spring calmness, k4 UIKit-matching haptics) were felt only on the owner's physical iPhone — Android was emulator-only (no haptic motor). Carried as a build-phase per-surface re-check against the standing article-9 feel bar; the trigger is clear.

**€ Privacy floor affordable — clear.** Two things kept deliberately distinct in the ledger: the **floor** (D-006 — no ads/trackers/analytics, free complete export, sync strictly opt-in, fully-functional local-only no-account) and the **rung** (D-005 — the E2EE-vs-server-readable *preference* ordering, a priced choice). All four floor elements survive rung 3: account only when sync is enabled, the local-only no-account path carried by the phone apps (D-016), export unchanged, no telemetry. The owner chose rung 3 (operator-can-read accepted) with eyes open at gate D-022. Affordability is settled by measurement: €8–13/mo all-in (D-022) / €8–11/mo for the CX23 box (D-025), well under the €25 envelope (D-009); Spike ① measured 432 MiB idle / 470 MiB at 5k rows against a 4 GB ceiling; the budget-risk MongoDB fallback was retired (Postgres bucket storage GA). **Clear.** Two obligations ride on it: the privacy-page honesty rewrite is a hard pre-sync-ship release gate (§4.F), and growth-scale infra economics are unpriced (single-tenant single-user footprint only) — a §7 pricing/scaling question, not a floor breach.

**⏱ Roadmap within solo capacity — clear (by judgment, not measurement).** This is the one trigger no spike measured — flagged honestly. "Exceeds capacity" is a rate-vs-deadline claim, and there is **no hard deadline** (D-011) — the decisive mitigant. The roadmap is structured to be about as capacity-efficient as this ambition allows: all one language (RN + Fastify + domain + web all TS, D-025); one mobile codebase for two platforms, Android near-free (D-024→D-029), roughly halving the mobile surface; web a deliberately narrower read-mostly companion (D-004/D-016); a port against a canonical spec, not greenfield discovery (D-010). Ongoing ops is ~½ day/mo (D-022) — a small fraction of the budget; the rest is one-time build work that takes as long as it takes. **Clear.** The fuller backlog (§4) reinforces "long build," not "over capacity"; the honest watch-item is a sustained drop below 10 h/wk or loss of motivation on a multi-year solo effort — a human risk, not an architectural one.

---

## 3 · Final architecture (reference block)

The one canonical statement of what gets built. Every line traces to a LOCKED decision; the adversarial consistency check found no contradiction with the ledger.

> **Client platform — Bundle A** (D-024, D-029; Bundle B retired). One Expo / React Native app in TypeScript serving **iOS + Android** from a single codebase (Android near-free). Capture surface validated on device (Spike Ⓐ WIN, owner-signed).
>
> **Shared substrate** (D-025). Backend: **Fastify 5 + zod + Drizzle** (Drizzle pinned; exit = raw `pg`). Auth: **better-auth in-process** — JWKS → PowerSync, **passkey-primary + recovery codes, no email dependency**. Host: **Hetzner CX23, Docker Compose, ~€8–11/mo**. Web: **Vite + React SPA + TanStack Router**, static behind **Caddy**. Monorepo: **pnpm workspaces + Turborepo** (local cache, telemetry off). i18n: **i18next + shared JSON catalogs**.
>
> **Sync & data — PowerSync self-hosted, rung 3** (D-022). PowerSync **Open Edition** with **Postgres bucket storage** (no MongoDB) + a **bespoke Fastify write-path API** + **Postgres**, single-tenant. Account only when sync is enabled; the local-only, no-account floor stays intact (carried by the phone apps, D-016). `@koi/domain` runs **server-side on every upload** (accept-with-2xx + synced violation flags, atomic with data) **and client-side on write** ("flag, never fix"). Exit = plain Postgres.
>
> **Domain — `@koi/domain`** (D-025; Ⓒ-verified, D-030). Nearly dependency-free pure ES: integer minor units, civil `YYYY-MM-DD` date strings, code-point ordering, injected IDs, **date-fns v4 only**, ESLint bans on `Intl`/`Date`/tz/`crypto`. Cross-engine purity **verified byte-identical across V8 / JSC / Hermes** (Spike Ⓒ, md5 `f93b1d6b…`).
>
> **Charts** (D-025; Ⓑ-verified, D-030). Native: **`@shopify/react-native-skia` + Victory Native XL** (render / carousel / tap-to-read verified on device). Web: **Recharts**, sharing selector logic only (Skia-on-web is refused, D-026).

**Cost headline (reconcile note).** Two in-ledger figures coexist: **€8–13/mo** is the rung-3 all-in figure (D-022) — the one the park test is measured against; **€8–11/mo** is the CX23 box alone (D-025). Headline the €8–13/mo all-in figure; both are well under the €25/mo envelope (D-009).

**Three architecture claims carry unspiked build obligations** (accurate as decisions, not yet fully spike-proven — all land in §4): passkey-primary auth (only a min-scope password JWT was spiked in ②); accept-with-2xx + base_version attribution (⑤ left open); the Ⓒ byte-identical result (proxy Hermes v0.13.0, not the RN-bundled engine — on-device CI still owed).

---

## 4 · Build-phase backlog

Compiled from **every** obligation carried across Phases 1–5 — the LOCKED ledger, the delta S-requirements, the spike carry-forwards and gotchas, and the parking-lot promotions (§6). Severity: **⛔ blocker** (unspiked correctness/data-loss surface, or a schema-time constraint that cannot be cheaply retrofitted, or a release gate) · **▲ important** · **▽ later/low-urgency**.

> **Scope correction — read this first.** The session brief summarized the sync backlog as "⑤ base_version + the full S-5/S-7/S-9 rung-3 set (D-023)." That is a **subset**. D-013 LOCKED **all fourteen** sync semantics S-1…S-14 as build requirements; S-5/S-7/S-9 were singled out by D-023 only because they are the rung-3-specific *spike* work. A backlog "from every obligation carried forward" must carry the full set. The buckets below reflect the full set; this expansion is the main substantive delta the adversarial pass produced and is the primary reason §1 flags a larger-than-summarized build.

### A · Sync protocol & data model (the core of the build)
- **⛔ ⑤ base_version per-column protocol** (S-5, D-023) — same-row same-column overwrite silently LWWs without compare-and-flag attribution; the one core sync obligation *no* spike verified. **Run first, before sync ships.**
- **⛔ accept-with-2xx exhaustive op-handling** (Spike ②) — any op the write-path does not explicitly handle-and-persist is silently lost once the client clears its queue on 2xx. The API must exhaustively handle every op/table or **dead-letter/flag** unrecognized ops, never skip them.
- **⛔ S-14 household non-preclusion** (D-007) — the record/schema model must **not hard-code single-actor** assumptions (the way `revision` hard-codes single-writer). The one obligation that is expensive-to-impossible to retrofit — honor it in the schema from the first migration. Single-user still; extension, not rewrite.
- **⛔ S-6 delete model** (D-013) — tombstones + undo-survives-sync (resurrection on any device) + atomic cascade as observed by peers + late-child-of-tombstoned-parent flagged (not dropped/resurrected). Distinct mechanism from S-7; unspiked.
- **⛔ S-4 client-side post-merge review queue** (D-013) — "flag, never fix" at merge, reusing the import "Review now" pattern; named records, user decides, nothing auto-repaired. Spike ② proved the *server* writes flags atomically; this is where those flags **land** on the client. Without it the validated flags have no home.
- **⛔ Spike ③ local-only → sync-on first-enable migration** (D-027) — never run; deferred to the build backlog. Existing local-only records must move into the synced/PowerSync tables **without loss** on first sync-enable. Data-loss class.
- **▲ S-7 erase-everywhere** (D-023) — TRUNCATE + purge ledger + compaction cadence + ≤24 h token-revocation window + backup-rotation disclosure; durable vs late-returning devices.
- **▲ S-9 import remap + dedup** (D-023, D-014) — two-device import car-id remap; record-level import dedup ordinal.
- **▲ S-1/S-2/S-3/S-8/S-10/S-11** — S-1 global stable ids; S-2 per-record versioning replacing `revision` (remote edits invalidate equality like local); **S-3 derived-never-sync** (economy, totals, cap state, synthesized reminders recompute locally; the car's current odometer becomes purely derived — deletes a whole conflict class); S-8 recurrence-materialization + occurrence-identity idempotency; **S-10 unknown-field round-trip on the wire** (stale client never strips unknown fields — load-bearing the moment two app versions sync); S-11 offline-first capture identical with no network.
- **▲ S-12 preference split** (D-015) — synced = units, economy format, currency; device-local = appearance, notification delivery, digest hour; logged amounts never change (units are display conversion).
- **▲ S-13 per-device notification scheduling** (D-017) — phones schedule/alert locally from synced state; web never notifies; no push infra.
- **▲ Engine-agnostic domain set, enumerated** (D-023) — discrete tasks, not one label: lineage swap (ordered-list merge), S-8 occurrence identity, S-9 dedup ordinal, settings singleton id, "keep both" semantics, post-flag validation.
- **▲ Sync torture-test suite** (D-013 / H5) — a permanent regression tier for the S-requirements (offline conflicting odometers, backdated edits, double import, double recurrence, tombstone + late child, erase with an offline device); Spike ②'s scenarios graduate into it.

### B · Backend / infra / auth
- **⛔ better-auth passkey-primary + recovery-codes + no-email FULL round-trip** — Spike ② deliberately folded Ⓓ to *min* scope (password JWT), explicitly excluding native passkey. The actual chosen auth mechanism (passkey on Expo, recovery-code flow, JWKS → PowerSync) is unbuilt and unvalidated end-to-end.
- **▲ Android-over-network initial-sync measurement** — only localhost (~325 ms) and server-side footprint proven; mid-range Android over network unmeasured.
- **▲ Self-hosting ops** (D-025) — WAL-slot alert, compaction cron, disk alert, ~6-month SDK upgrade windows, no OTA, telemetry off. ~½ day/mo.
- **▽ Server discipline** (delta §4) — no user content in server logs, no server-side analytics/3rd-party processors, optional-forever.

### C · Domain / CI
- **▲ On-device (RN-bundled) Hermes golden-vector CI step** (Ⓒ caveat) — Ⓒ used proxy Hermes v0.13.0; re-run the golden vectors on the RN-0.86-bundled engine in CI.
- **▽ `@koi/domain` build-out** — integer minor units, civil-date, code-point order, date-fns v4, ESLint bans; Ⓒ-verified purity holds as the foundation.

### D · Clients (mobile + web)
- **▲ Full Bundle A app build** — capture surface + ledger + record + Insights, from the Ⓐ-validated foundation.
- **▲ Chart §D4 finish** (Ⓑ deferred) — ghost bars past window edges + on-canvas peak label; **iOS large-title vs nested-ScrollView content-inset fix** (renders fine on Android).
- **▲ Recharts web charts** (D-025) — unspiked (Ⓑ validated native only); share selector logic; lower-risk but a real target.
- **▲ Web companion scope** (D-016, delta §4) — read + edit, **no capture**; import console + full export + occasional edits; WCAG 2.2 AA.
- **▲ Safari-ITP web key-custody recovery UX** (parking lot, promoted) — ITP evicts the PowerSync web sync DB after ~7 idle days → silent unpair → re-auth/re-sync flow; disclosure half already locked (D-023).
- **▲ Expo build gotchas** (parking lot) — `Link.AppleZoom` needs `<Link asChild>` + `StyleSheet.flatten` (array styles throw at the `<Slot>` boundary; without `asChild` the Android row press doesn't wire); `expo-symbols` falls back to emoji on Android → domain glyphs need `@expo/vector-icons` / bundled SVGs.

### E · Migration & data portability
- **▲ Koi JSON export re-import** (D-010) — load-bearing migration bridge; **record-level import dedup** (D-014).
- **▲ Free complete export feature + backup=export path** (D-006, delta H2) — client-side JSON + per-table CSV, no server; the guaranteed backup story. The brief carried only the import side.
- **▲ Income tracking** (D-014) — §G reopen verdict; IN.

### F · Privacy & product copy
- **⛔ Privacy-page rewrite BEFORE any sync ships** (D-006 sequencing) — a hard **release gate**, not a content task: the two-part page (untouched local default + rung-3 truth table) must land before sync ships.
- **▲ Privacy-page wording** (D-023, D-016) — drop the "no-account" claim; operator-can-read wording for growth users; Safari-ITP eviction disclosure; state plainly the web companion is only meaningful with sync.

### G · Accessibility — end-state, deprioritized near-term (D-028), required at end-state (D-014)
- **▽ A11y completion pass + article-9 bar** — dynamic type, VoiceOver/TalkBack, Koi-grade a11y across clients.
- **▽ Chart a11y overlay subsystem** — per-datapoint VoiceOver/TalkBack on Skia via transparent views from d3 scales; in-canvas fontScale/reflow plumbing.
- **▽ Article-9 wording finalization** — "pended Spike 1"; Spike Ⓐ resolved (D-029), so it can now be finalized.

### H · Build kickoff / project
- **▲ Repo reset + git-init + new naming + pnpm/Turborepo monorepo scaffold** (D-002; plan in §5) — the literal first build action.
- **▲ SDK pin + Phase-4 re-confirmation** (parking lot) — pin the Expo SDK; re-verify SDK-version-sensitive Phase 4 claims (Expo UI maturity, `formSheet` open-issue count, New-Architecture state) against the pinned SDK before relying on them (the spike ran SDK 57, one major ahead of the SDK-56 evidence).
- **▽ Niche-tool exit-plan register** (D-022/D-026) — maintain exits for PowerSync-RN, op-sqlite, Victory XL, TanStack Router, better-auth, Drizzle, Turborepo (popular-tools rule).
- **▽ Dev tooling** (parking lot) — install `idb` / grant macOS Accessibility for scripted iOS UI driving (needed for E2E; the Simulator refuses scripted taps otherwise).
- **▽ Deletion grace-window undo semantics** (parking lot, promoted) — hard-delete after grace + "resurrect vs metadata-only row" undo-after-grace; refines the S-6/S-7 delete model.

---

## 5 · Repo reset, git-init & naming plan (D-002)

D-002 defers "all repos get reset with new naming when building starts" to Phase 6. The workspace is still a plain no-git folder. Recommended plan (owner confirms at the gate — the neighbor-repo and deletion steps in particular):

**Topology — one monorepo.** D-025 already locked pnpm workspaces + Turborepo, so the build is a single monorepo, not multiple repos. Proposed package layout:
```
<new-repo>/
  packages/
    domain/     # @koi/domain — pure ES, the Ⓒ-verified core
    mobile/     # Expo/RN app (iOS + Android) — Bundle A
    web/        # Vite + React SPA + TanStack Router
    server/     # Fastify write-path API + better-auth
  infra/        # docker-compose (Postgres + PowerSync + Caddy), config
  docs/
    investigation/   # this whole investigation/ tree, carried in as the decision record
  koi-core-spec.md   # product truth, carried in
  README.md  CLAUDE.md  turbo.json  pnpm-workspace.yaml
```

**git-init.** `git init` the new monorepo; **first commit carries in `koi-core-spec.md` + the full `investigation/` tree** (as `docs/investigation/`) so the decision trail is version-controlled from commit one. This is also what moots the parking-lot "zip-snapshot" and "no-VC-window" items (§6).

**Naming — RESOLVED at gate (2026-07-21).** Product name stays **Koi** (owner). Repo: single monorepo named **`koi`**, aligning with the already-locked npm scope `@koi/*` (`@koi/domain`, D-025) — packages become `@koi/domain`, `@koi/mobile`, `@koi/web`, `@koi/server`. This requires the legacy iOS repo (currently `koi`) to be archived/renamed first to free the name — owner action (e.g. `koi-ios-legacy`); I do not touch neighbors. Fallback if the owner would rather not rename the legacy repo: **`koi-platform`** (signals the multiplatform + server scope), scope still `@koi/*`. Recommendation: `koi`.

**Neighbor repos — I do not touch them.** `../koi` (shipping iOS app) and the website repo are read-only per the ground rules; I will not rename, archive, or modify them. The "reset with new naming" for those is the **owner's** action — recommendation: archive them read-only (e.g. `koi-legacy-ios`, `koi-legacy-web`) rather than delete, since Koi 2.x is abandoned (D-010) but the code is historical reference and the JSON export bridge (D-010) still matters. Owner executes; I flag.

**Spike teardown decision (goal 5) — reclaim regenerable weight now, retain source as seed, never git-add spikes.** Measured state: `spikes/` = **6.4 GB**, dominated by `capture-feel/node_modules` (4.1 GB); `write-path` 67 MB; `domain-conformance` 32 KB. Still running: the `write-path` Docker stack (`write-path-powersync-1` :8080, `write-path-postgres-1` :5433, up ~40 min) + lingering Gradle/Kotlin daemons; Fastify :4000 not currently up. (The `devcontainer-*` containers are unrelated to this project — leave untouched.)

Recommendation:
1. **Stop the idle services now** — the `write-path` Docker stack + the Gradle/Kotlin daemons are consuming RAM for nothing; they rebuild fresh on demand.
2. **Purge regenerable weight** — delete `capture-feel/node_modules` (4.1 GB, `pnpm install` regenerates); reclaims the bulk of the 6.4 GB.
3. **Retain spike *source* read-only as build seed** — `write-path/` (working docker-compose + Fastify + JWKS stack), `domain-conformance/vectors.js` (the Ⓒ golden vectors → seed the on-device Hermes CI), `capture-feel/src` (the Ⓐ capture surface + Ⓑ Insights chart). These are directly reusable patterns worth a few hundred MB during early build.
4. **Never git-add spike code into the new repo** — spikes are throwaway (CLAUDE.md); mine the reusable bits into the clean packages deliberately, then delete `spikes/` entirely. The learnings are already durably captured in `05-spikes/README.md` + the parking lot, so full teardown is low-risk whenever the seed is spent.

Because step 2 is a ~4 GB deletion, it is presented as a recommendation to confirm, not executed this session.

---

## 6 · Parking-lot disposition (final gate review)

Every parking-lot item reviewed one last time — this is the final gate before the lot is retired at build start.

**Promote to build plan** (folded into §4 at the noted bucket):
- Web key-custody UX under Safari ITP → §4.D. · Blob-channel GC grace-window undo semantics → §4.H (refines S-6/S-7). · i18next v27 Selector-API watch → §4.C/i18n setup note + dependency watch. · Chart a11y overlay + fontScale → §4.G (already D-028/D-014 build work). · `Link.AppleZoom` asChild+flatten → §4.D. · `expo-symbols` Android fallback → §4.D. · SDK-57 re-confirmation → §4.H. · `idb` / Accessibility for scripted iOS UI → §4.H. · accept-with-2xx exhaustive-op rule → §4.A. · ⑤ base_version open → §4.A. · Ⓑ iOS large-title inset + ghost bars → §4.D.

**Leave parked** (still off-plan / watch / design-track, not committed build work):
- Accountless web viewer (both 2026-07-17 + the 2026-07-20 "got cheaper" note) — explicit non-requirement, design-track future feature. · Per-field E2EE envelope (rung ~2 upgrade path) — parked by D-022, revisit only on explicit rung re-raise. · Expo UI SwiftUI/Compose drop-ins — a fallback for any build surface that misses the feel bar without dropping to Bundle B. · Self-hosted expo-updates OTA — contingency against the locked "no OTA" stance. · Temporal API revisit ~2027 — far-future migration; Temporal-for-now refused (D-026), civil-date discipline Ⓒ-verified.

**Now moot** (superseded by a LOCKED decision):
- `/phase` ritual skill — investigation closes; no more phase sessions. · Zip-snapshot of docs — git-init (§5) gives real version control. · Export-nudge backup hygiene — the rung-1 passphrase-loss premise is gone (rung 3 has passkey + recovery codes). · Relay metadata hardening (PADMÉ/Tor) — no blind relay at rung 3. · Household sharing *crypto* details — Evolu refused (D-020), rung 3 has no shared-key E2EE (household sharing itself survives as a D-007 extension needing a rung-3-native row-level design).

---

## 7 · Open decisions surfaced for owner (Phase 6 sign-off)

Two items the ledger leaves for this gate, neither of which I should decide unilaterally:

- **Pricing model — DEFERRED by owner at gate (2026-07-21).** D-009 marked it "open until Phase 6"; owner is not ready to decide. Explicitly **carried OPEN into the build** (D-009 stays open). The floor forecloses conventional revenue (D-006 bans ads/trackers/analytics; D-009 bans nag walls + feature hostage-taking) and growth-scale infra economics are unpriced — but neither blocks build kickoff. The no-nag-walls / no-feature-hostage guarantees bind build-time product design regardless of when pricing lands.
- **Repo/product naming — RESOLVED (§5):** product = **Koi**; repo = **`koi`** (scope `@koi/*`), fallback `koi-platform`.
- **Confirmations still owed for lock:** the go verdict (§1); the architecture block (§3); the fuller S-1…S-14 backlog scope (§4); the repo-reset plan + the ~4 GB spike teardown (§5). On the owner's "lock/approve," D-031…D-036 flip to LOCKED and the teardown is authorized.

---

## Proposed ledger entries (lock on owner sign-off)

- **D-031 — Verdict: GO.** The replatform proceeds; build phase opens. All four D-012 park triggers tested and clear (§2); no trigger fired in Phase 5 (D-030). Bundle A architecture (§3).
- **D-032 — Final architecture LOCKED** as the §3 reference block: Bundle A (D-024/D-029) + substrate (D-025) + PowerSync self-hosted rung 3 (D-022) + dependency-free Ⓒ-verified `@koi/domain` (D-025/D-030) + Skia/Victory-XL native / Recharts web charts (D-025/D-030).
- **D-033 — Build backlog adopted** (§4), compiled from all carried obligations, with the scope correction that the sync layer is the full **S-1…S-14** set (D-013), not just the rung-3 spike subset S-5/S-7/S-9 (D-023). Blockers: ⑤ base_version, exhaustive op-handling, S-14 household non-preclusion, S-6 deletes, S-4 review queue, ③ migration, passkey full round-trip, privacy-page pre-sync release gate.
- **D-034 — Repo-reset / git-init / naming + spike-teardown plan** (§5): single pnpm+Turborepo monorepo; git-init carrying in the spec + investigation tree; neighbor repos untouched by the assistant (owner archives); reclaim regenerable spike weight + stop idle services, retain spike source as seed, never git-add spikes.
- **D-035 — Parking-lot final disposition** (§6): promotions folded into §4; leaves and moots recorded; parking lot retired at build start.
- **D-036 — Investigation closed** at the Phase 6 gate; workflow (`00-workflow.md`) discharged.

OPEN carried into build: pricing model (D-009); repo/product naming (§5).

---

## State (session log)

- **Session 1 (2026-07-20):** Phase 6 opened. Loaded status board + carry-forwards of LOCKED phases 1–5 (Phase 5 carry-forward = spike verdicts + open obligations, not spike code) + the ledger + parking lot. Ran an adversarial hardening pass before drafting (7 agents: four D-012 park-trigger skeptics, a backlog-completeness critic, an architecture-consistency checker, a parking-lot triage). All four skeptics returned the triggers clear; the consistency checker found the architecture block clean (one cost-figure reconcile note); the **backlog critic caught the S-5/7/9-vs-full-S-1…S-14 scope gap** (folded into §4 as the headline correction). Measured the spike footprint (6.4 GB) + running services for the teardown decision. Drafted this doc: GO verdict (§1), park-trigger test (§2), final architecture (§3), full build backlog (§4), repo-reset plan (§5), parking-lot disposition (§6), owner-decision surface (§7), proposed ledger entries.
- **Gate (2026-07-21):** owner resolved the two open items — product name stays Koi, repo = `koi` (§5); pricing model deferred, carried OPEN into build (D-009). Owner then signed **"lock"**: D-031…D-036 (and D-001) LOCKED, verdict GO confirmed, architecture + full S-1…S-14 backlog + repo-reset & teardown approved. **Investigation CLOSED.** Next: Build Session 1 (repo reset) — prompt handed off.

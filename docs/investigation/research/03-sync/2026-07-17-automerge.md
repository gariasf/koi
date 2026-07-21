# Automerge (+ automerge-repo) — Phase 3 sync landscape brief
As-of: 2026-07-17

## What it is
JSON-like CRDT library (Rust core, wasm/JS bindings) plus **automerge-repo**, the "batteries-included" networking/storage layer (DocHandles, WebSocket + storage adapters). Library, not a service: you run your own sync server (reference: `automerge-repo-sync-server`, a self-described "unsecured Express app… partly for demonstration purposes"). MIT license throughout. Maintained by Ink & Switch — Alex Good and Orion Henry full-time plus other maintainers; lab/grant-funded, no VC. Very active: Automerge 3.0 shipped Jul/Aug 2025 (~10x memory cut by keeping the columnar storage format in memory; same file format as v2), automerge-repo 2.0 shipped 2025-05-13, latest core release v3.3.2 on **2026-07-14**. ~6.4k GitHub stars. Vendor-death story is the best in class: MIT code, documented open file format, everything self-hosted — the app keeps working forever.

## Client support
- **TS/web: excellent.** First-class TS types, React hooks (`@automerge/react`), IndexedDB storage adapter.
- **React Native: the weak leg.** Core is wasm; Hermes (RN's default engine) still cannot run wasm — facebook/hermes#429 open since 2020, latest activity (Feb 2025) points at the experimental Callstack Polygen incubator, and the official RN 0.84 release notes (2026-02-11) say nothing about wasm. The documented path is the "escape hatch": `@automerge/automerge/slim` + `initializeBase64Wasm` + Metro `unstable_enablePackageExports` — which needs a wasm-capable engine (JSC; historically iOS-only reliability). The official `automerge/react-native-automerge` Turbo-module repo is an **empty placeholder** ("There's nothing here yet", checked 2026-07-17). Third-party UniFFI native bindings (`react-native-automerge-generated`) exist: v0.1.0, one release, one maintainer, published 2026-02-07, and they bypass wasm but don't slot into the automerge-repo JS ecosystem.
- **Swift: official `automerge-swift` bindings exist** — a native-iOS fallback if the RN hypothesis dies.

## Sync model
Sync/sharing unit is the **document**, but merge granularity inside a doc is per-key/per-field, so Koi's record-level identity (S-1) is satisfied by modeling records as UUID-keyed map entries inside one doc per user (or per car — a cleaner unit for later household sharing). Doc-per-record is possible but wrong-shaped: automerge-repo pays per-doc sync round-trips and storage chunks; thousands of tiny docs make initial sync chatty. Full history syncs; devices returning after months converge deterministically; concurrent inserts merge losslessly; concurrent edits to the same field resolve LWW **but the losing value is preserved and surfaceable via `getConflicts`** — no silent loss. Concurrent delete-vs-update: the update survives. Deletes are CRDT ops; undo/tombstone UX is app-level (soft-delete flag, later purge) — standard, fine. Schemaless docs mean unknown fields round-trip **provided clients mutate fields, never replace whole record objects** (needs code discipline). Deterministic record IDs make recurrence/CSV import idempotent (same key ⇒ converges). No blob/attachment story: putting MB images in a doc embeds them in history forever; blobs must go out-of-band (bespoke store + reference by hash).

**Where app logic runs (the odometer question, concretely):** when synced changes arrive, a DocHandle fires a `change` event whose payload includes `doc`, `patches`, and `patchInfo` (before/after snapshots) — verified in automerge-repo source. Client-on-merge invariant checking is therefore direct: filter patches touching `cars/<id>/logs/*/{odometer,date}`, re-run the shared TS monotonicity validator on the merged trail, queue violations for review. Automerge never rejects or auto-fixes a write, so "flag, never fix" falls out naturally. Server-side hook: run a headless Node automerge-repo peer subscribed to the same docs, reusing the identical TS invariant package. Both placements work.

## Fit vs Koi criteria
1. **Privacy: rung 3 achievable now** — server-readable, but on *your* self-hosted VPS, no accounts required, local-only mode trivially fine, open-format export free. E2EE rungs are not realistically available: Keyhive/Beelay (Ink & Switch's E2EE + access-control sync layer) is **pre-alpha, unaudited, unstable APIs as of mid-2026**. DIY E2EE (encrypted change-log on dumb storage) forfeits automerge-repo and is months of bespoke protocol work. Also: **history is immutable — deleted records/blobs remain recoverable inside the doc file** (issue #799, open since Nov 2023: no history removal without minting a new document identity). "Erase everything durably" requires an app-level epoch/doc-tombstone protocol so a months-offline device doesn't resurrect the old doc. Real gap.
2. **Invariant merge: best-in-class.** Post-merge observation via change events + patches; nothing dropped, nothing auto-fixed. 5/5.
3. **Offline depth: full.** Local-first by construction; months-offline convergence is the design center.
4. **Solo maintainability: middling.** The CRDT is turnkey; everything around it isn't — sync server hardening + auth (reference server is demo-grade), blob store, erase-epoch protocol, and above all the RN integration gamble.
5. **Cost: easy.** €5–10/mo Hetzner-class VPS runs sync server + blob endpoint for 2–4 devices. Public sync.automerge.org exists but is third-party-readable, no SLA — fails privacy floor.
6. **Maturity: good, bus factor moderate.** Two funded FTEs + lab, shipping steadily for 8+ years; MIT + open format means vendor death is an inconvenience, not a data loss.

## Cost sketch
Self-host: ~€5–10/mo VPS (sync server, Caddy, blob store on disk or +€1–3 object storage). Total well under €25.

## Red flags
- RN/Hermes wasm gap; official RN module is vaporware, third-party bindings v0.1.0 — the TS-everywhere hypothesis rests on an escape hatch.
- No E2EE today; Beelay pre-alpha and unaudited.
- Immutable history vs. durable-erase requirement; blob-in-doc is a trap.
- Reference sync server is demo-grade; auth entirely DIY.
- History grows forever (Automerge 3 makes it cheap, never reclaimable).

## Verdict
**Possible** — top marks on merge semantics, offline depth, cost, and openness; held out of the shortlist by the unresolved React Native story, no realistic E2EE rung, and the immutable-history/erase clash.

## Sources
- https://automerge.org/blog/automerge-3/ (accessed 2026-07-17)
- https://github.com/automerge/automerge (license, v3.3.2 2026-07-14, maintainers; accessed 2026-07-17)
- https://automerge.org/blog/2025/05/13/automerge-repo-2/ (accessed 2026-07-17)
- https://automerge.org/docs/reference/library-initialization/ (RN slim/base64 guidance; accessed 2026-07-17)
- https://github.com/automerge/automerge/discussions/893 (RN wasm pain; last activity 2024-04-24; accessed 2026-07-17)
- https://github.com/facebook/hermes/issues/429 (Hermes wasm unsupported; latest comments Feb 2025; accessed 2026-07-17)
- https://github.com/automerge/react-native-automerge (empty placeholder; accessed 2026-07-17)
- npm registry: react-native-automerge-generated v0.1.0, published 2026-02-07 (queried 2026-07-17)
- https://www.inkandswitch.com/project/keyhive/ and https://github.com/automerge/beelay (pre-alpha E2EE sync; accessed 2026-07-17)
- https://github.com/automerge/automerge/issues/799 (no history removal; opened 2023-11-12; accessed 2026-07-17)
- https://github.com/automerge/automerge-repo-sync-server (README: "unsecured Express app"; accessed 2026-07-17)
- https://raw.githubusercontent.com/automerge/automerge-repo/main/packages/automerge-repo/src/DocHandle.ts (change event payload: doc/patches/patchInfo; accessed 2026-07-17)

## Verification (adversarial, 2026-07-17)

Method: independent re-check of load-bearing claims against primary sources (GitHub API, official repos/blogs/docs, npm registry), deliberately trying to refute the verdict's pillars. Checked 2026-07-17.

**Confirmed**
- **MIT license, ~6.4k stars, active** — GitHub API: license MIT, 6,423 stars, last push 2026-07-16, not archived. https://api.github.com/repos/automerge/automerge
- **Latest core release v3.3.2 on 2026-07-14** — GitHub releases API: tag `js/automerge-3.3.2` published 2026-07-14T21:38:03Z; two more releases that same week (3.3.0, 3.3.1). https://api.github.com/repos/automerge/automerge/releases
- **Automerge 3.0 shipped Jul 2025; ~10x memory; same file format** — official blog: ">10x" memory reduction (Moby Dick 700MB→1.3MB), "uses the same file format as Automerge 2". https://automerge.org/blog/automerge-3/
- **automerge-repo 2.0 shipped May 2025; still maintained** — blog index lists "Automerge Repo 2.0" (May 2025; URL date 2025-05-13); repo releases continue through v2.5.6 (2026-05-18) and v2.6.0-alpha.2 (2026-06-05). https://automerge.org/blog/ , https://api.github.com/repos/automerge/automerge-repo/releases
- **Maintainers/funding** — automerge.org/contributors: Alex Good and Orion Henry full-time (Ink & Switch), "not VC-backed"; sponsors (Fly.io, Prisma, GoodNotes, Bowtie) + grants (NLNet, ARIA, Endless Foundation). Page may predate 2026 — headcount is as-of-publication, not re-verified for July 2026. https://automerge.org/contributors/
- **Hermes cannot run wasm; #429 open since Dec 2020; last activity Feb 2025 pointing at Polygen** — issue open, created 2020-12-04, updated 2025-02-11, 75 comments; final comment (2025-02-11) links Callstack Polygen. Polygen README (checked today): "still under active development… use at your own risk", major features (threads, GC, exceptions) incomplete. https://github.com/facebook/hermes/issues/429 , https://github.com/callstackincubator/polygen
- **RN 0.84 release notes (2026-02-11) say nothing about wasm** — official post confirmed: Hermes V1 default on iOS+Android, zero mentions of WebAssembly/wasm. Note: a Callstack *event page* ("React Native 0.84: Hermes v1, WebAssembly, and Ecosystem Shifts") implies wasm is landing — that is ecosystem-talk marketing (Polygen), not the official release; the brief's claim stands. https://reactnative.dev/blog/2026/02/11/react-native-0.84 , https://www.callstack.com/events/react-native-0-84-and-other-news
- **`@automerge/automerge/slim` + `initializeBase64Wasm` + Metro `unstable_enablePackageExports` is the documented RN path** — official docs show exactly this. https://automerge.org/docs/reference/library-initialization/
- **`automerge/react-native-automerge` is an empty placeholder** — README: "There's nothing here yet"; 1 commit, 0 releases. https://github.com/automerge/react-native-automerge
- **`react-native-automerge-generated` v0.1.0, one release, one maintainer, 2026-02-07** — npm registry: sole version 0.1.0 published 2026-02-07, one maintainer (Karsten Lehmann), Apache-2.0, "Native Automerge bindings for React Native via compiled Rust + UniFFI". https://registry.npmjs.org/react-native-automerge-generated
- **`automerge-swift` exists, official, alive** — MIT, 318 stars, last push 2026-04-02. https://api.github.com/repos/automerge/automerge-swift
- **`@automerge/react` hooks exist** — npm package present ("quick-import React package for Automerge Repo", wraps `automerge-repo-react-hooks`). https://registry.npmjs.org/@automerge/react
- **LWW winner + losing value via `getConflicts`** — official docs: deterministic winner by operation ID, "multi-value" register semantics, losers retrievable via `Automerge.getConflicts()`. https://automerge.org/docs/reference/documents/conflicts/
- **Concurrent delete-vs-update: update survives** — documented in Automerge CRDT-concepts material (update takes precedence over concurrent delete; tombstones for seen ops). https://posit-dev.github.io/automerge-r/articles/crdt-concepts.html
- **DocHandle `change` event payload** — source confirms `DocHandleChangePayload<T> = { handle, doc, patches, scopeReplaced, patchInfo }`, patchInfo with before/after snapshots. https://raw.githubusercontent.com/automerge/automerge-repo/main/packages/automerge-repo/src/DocHandle.ts
- **Keyhive/Beelay pre-alpha, unaudited, unstable as of mid-2026** — inkandswitch/keyhive README (current, 2026): "early preview… expect bugs, inconsistencies, and unstable APIs", "not been through a security audit"; pre-alpha code release Mar 2025, no audit or stable release since. https://github.com/inkandswitch/keyhive , https://www.inkandswitch.com/keyhive/notebook/
- **Issue #799: no history removal, open since 2023-11-12** — confirmed open, about eliminating document history; no shipped feature contradicts the "new document identity required" reading. https://github.com/automerge/automerge/issues/799
- **Sync server "unsecured Express app… partly for demonstration purposes"** — exact quote in README; no auth mechanism documented. https://github.com/automerge/automerge-repo-sync-server
- **sync.automerge.org public, no SLA** — official docs: "experimental service has no reliability or data safety guarantees… run your own sync server for production apps"; and no E2EE means server-readable by definition. https://automerge.org/docs/

**Corrected / nuanced**
- **"Third-party UniFFI bindings… don't slot into the automerge-repo JS ecosystem" — overstated as written.** The package README positions it as a drop-in replacement for the wasm backend, hooking into `@automerge/automerge/slim` via `UseApi(nativeApi)` — the same API layer automerge-repo builds on. The *practical* conclusion still stands, though: several methods are stubbed (`unmark()`, `spans()`, `getBlock()` throw/return empty), `getChanges()` returns concatenated bytes, `decodeChange()` returns partial data — so automerge-repo/sync-protocol compatibility is unproven, and at v0.1.0/single-maintainer it remains a gamble, just via a different mechanism than the brief implies. https://registry.npmjs.org/react-native-automerge-generated
- **Beelay citation points at a stale repo.** `github.com/automerge/beelay` last pushed 2024-11-22; active Keyhive/Beelay development lives in `github.com/inkandswitch/keyhive` (Rust workspace incl. Beelay). Strengthens rather than weakens the "pre-alpha, don't count on it" conclusion, but the cited repo isn't where the status should be read from.
- **"Reference sync server is demo-grade" — one-sided quote.** The same README sentence continues: "…but it's also a reasonable way to run a public sync server." The DIY-auth point is accurate (none documented), but the maintainers do not frame it as demo-only.

**Unverifiable / not independently checked**
- €5–10/mo Hetzner-class VPS figure — not re-priced; even at 2–3x it stays far under the €25 ceiling, so nothing rests on it.
- "Two funded FTEs" as of *July 2026* specifically — contributors page confirms the roster but its as-of date is unclear; release cadence (3 releases in the week before 2026-07-17) independently evidences active maintenance.
- Discussion #893 (RN wasm pain, last activity 2024-04-24) — not re-checked; redundant with the verified hermes#429 evidence.

**Net effect on verdict:** none. Every pillar of the "Possible" verdict survived adversarial checking — RN/Hermes gap real as of RN 0.84, E2EE genuinely unavailable (Keyhive pre-alpha/unaudited), immutable-history/erase clash real (#799 open), while the positives (MIT, active releases through 2026-07-14, merge semantics, self-host cost) also held. The two corrections are citation-level nuances that do not move the shortlist judgment in either direction.

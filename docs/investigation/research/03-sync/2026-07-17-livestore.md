# LiveStore — Phase 3 sync landscape brief
As-of: 2026-07-17

## What it is
Client-centric local-first data layer by Johannes Schickling (Prisma founder): apps commit **events** to an append-only eventlog; **materializers** (pure TS functions) fold events into a local reactive SQLite db; UI subscribes to reactive SQL queries. Sync is git-inspired: the sync backend enforces a **global total order** of events; clients pull, **rebase unpushed local events client-side** on top of upstream, then push. Apache-2.0, monorepo `livestorejs/livestore`, ~3.6k stars, 151 releases. Current: **v0.4.0 (2026-06-02)** — added Cloudflare Workers/Durable Object adapter, S2 sync backend, schema-first tables, multi-store React API, `unknownEventHandling`. Docs explicitly: **beta, breaking changes still possible, no 1.0 timeline**. Bus factor ≈ 1–2: schickling 2,422 of ~3,809 commits, #2 (IGassmann) 796. Funding = GitHub Sponsors (59 active; devtools gated behind the $20/mo tier) plus partner sponsorships (Expo, RedwoodSDK). No company, no VC product to die — but also no team.

## Client support
TypeScript-native (built on Effect — real learning curve). First-party adapters: **web** (wa-sqlite, OPFS, shared/web workers), **Expo/React Native** (expo-sqlite; Expo wrote a promo post), Node, Electron, Tauri, Cloudflare DO. React + Vue integrations; React overhauled in 0.4 (StoreRegistryProvider, multi-store). **No Swift-native client** — RN-only on iOS, which matches the RN hypothesis but forecloses a native fallback.

## Sync model
- **Granularity:** the event, not the record or document. State is never synced — only the eventlog; every device rematerializes identical SQLite state (deterministic replay). Three "heads": client session → client leader → sync backend.
- **Conflicts:** total order + client-side rebase; no field-level merge. Richer detection ("facts system") is still *upcoming* in docs. Materializers may read current state via `ctx.query` and must be deterministic.
- **Where app logic runs:** in the client materializer/reactive layer — exactly where Koi needs it (see below). Server is a dumb ordered log; sync-cf exposes payload-validation hooks (auth) but isn't meant to run domain logic.
- **Backends:** first-party `@livestore/sync-cf` (Cloudflare Worker + Durable Object, WebSocket/HTTP/DO-RPC transports, events in DO SQLite or D1); ElectricSQL provider; S2 stream-store backend; documented **build-your-own sync provider** interface.
- **Deletes:** events; tombstone + undo = ordinary domain events, cascades atomic (one event → several SQL writes). But the *eventlog itself never forgets*: **compaction is an open roadmap item (issue #136)** — deleted data remains in history on server and every device.
- **Blobs:** not synced. Docs pattern = metadata in LiveStore, file content elsewhere (e.g. R2/S3). Koi document scans need a separate bespoke blob channel.

## Fit vs Koi criteria
1. **Privacy** — floor fully met: sync optional (library runs pure local-only, no account, no server, no known telemetry; free export = local SQLite). Self-hostable on your own Cloudflare account, or fully custom via the provider interface; "no accounts" works (single shared secret in the auth payload). Best realistic rung: **server-readable, self-hosted**. No E2EE; encrypting event payloads client-side is "almost possible" (HN discussion) but bespoke, blinds devtools, and fights schema-typed events. Worse: no compaction ⇒ **"erase everything" is weak** — an erase *event* hides data but full history persists everywhere; true erasure means destroying the store + re-bootstrapping, and a device returning months later against a recreated store risks resurrection unless you build store-generation/epoch handling yourself.
2. **Invariant preservation** — best-in-class. Rebase replays materializers over the merged total order; a deterministic materializer can `ctx.query` the per-car odometer trail and write to a `violations` review-queue table — every device converges on the identical queue, nothing is ever dropped or auto-fixed (events are immutable inputs). "Flag, never fix" is the *native idiom*: answer to the flagship question is **yes, client-side, at merge/rebase time, deterministically**. Derived values never sync by construction. `unknownEventHandling` (0.4) lets old clients warn/ignore future event types while the eventlog keeps them intact — unknown data round-trips. CSV-import idempotency stays app-level (content-hash dedup before committing events).
3. **Offline depth** — full offline-first is the design center; months-offline device pulls, rebases, pushes; no expiry (the never-compacted log cuts both ways). Trivial at Koi scale.
4. **Solo maintainability** — TS end-to-end, tiny infra (one Worker), but: Effect idioms, beta churn (0.3→0.4 broke React API, subscribe, shutdown), bespoke blob channel + erasure epochs on you.
5. **Cost** — sub-€5/mo (below).
6. **Maturity** — beta, one core maintainer, sponsor-funded. Vendor-death case is decent: Apache-2.0, local data, self-hosted backend keeps running, pin versions — but you inherit a complex Effect codebase.

## Cost sketch
Self-host sync on Cloudflare: Workers Free plan includes SQLite-backed Durable Objects (storage free on free plan even after Jan-2026 billing change); Workers Paid $5/mo (~€4.6) for headroom. Blobs on R2 free tier (10 GB). **Infra ≈ €0–5/mo.** Optional $20/mo (~€18) sponsorship for devtools during development. Well under €25/mo.

## Red flags
- Pre-1.0 beta with acknowledged breaking changes; no 1.0 timeline (docs, 2026-07).
- Bus factor ~1; sponsorship-scale funding.
- Eventlog permanence: no compaction (#136 open) → hard-erase requirement only met with bespoke epoch machinery; residual history conflicts with privacy posture.
- No E2EE path short of DIY payload crypto.
- No blob/attachment sync; Effect learning curve; devtools paywalled.

## Verdict
**Possible** — the single best answer in the field to the odometer/review-queue problem and near-zero cost, but pre-1.0 churn, bus factor ≈1, a server-readable ceiling, and event-log permanence undermining "erase everything" keep it off an automatic shortlist.

## Sources
- https://github.com/livestorejs/livestore (license, v0.4.0 2026-06-02, stars, commits — accessed 2026-07-17)
- https://api.github.com/repos/livestorejs/livestore/contributors (accessed 2026-07-17)
- https://docs.livestore.dev/reference/syncing/ + https://dev.docs.livestore.dev/evaluation/how-livestore-works/ (push/pull, rebase, heads, facts system "upcoming" — accessed 2026-07-17)
- https://docs.livestore.dev/reference/state/materializers/ (ctx.query, determinism — accessed 2026-07-17)
- https://docs.livestore.dev/changelog/ (0.4.0 contents, unknownEventHandling, "still in beta" — accessed 2026-07-17)
- https://docs.livestore.dev/evaluation/state-of-the-project/ (beta, no 1.0 timeline — accessed 2026-07-17)
- https://docs.livestore.dev/sync-providers/cloudflare/ (sync-cf transports, DO SQLite/D1 — accessed 2026-07-17)
- https://docs.livestore.dev/patterns/file-management/ (blob pattern — accessed 2026-07-17)
- https://github.com/livestorejs/livestore/issues/136 (eventlog compaction, open — accessed 2026-07-17)
- https://github.com/sponsors/schickling (tiers, $20/mo devtools, 59 sponsors — accessed 2026-07-17)
- https://developers.cloudflare.com/durable-objects/platform/pricing/ + 2025-12-12 changelog (free-plan SQLite DOs, storage billing — accessed 2026-07-17)
- https://expo.dev/blog/local-first-application-development-with-livestore (Expo adapter — accessed 2026-07-17)
- https://news.ycombinator.com/item?id=44105412 (E2EE payload discussion — accessed 2026-07-17)
- https://rwsdk.com/blog/rwsdk-x-livestore (RedwoodSDK sponsorship — accessed 2026-07-17)

## Verification (adversarial, 2026-07-17)

Method: independent re-check against primary sources (GitHub API, repo docs source on `main`, npm registry, Cloudflare docs, HN). Note: docs.livestore.dev returned HTTP 502 throughout this pass, so all docs claims were verified against the docs *source* in the monorepo (`docs/src/content/docs/…`), which is what the site renders.

**Confirmed**
- License Apache-2.0; ~3.6k stars (3,636); 151 releases; v0.4.0 latest stable, published 2026-06-02; repo actively pushed (2026-07-16) — https://api.github.com/repos/livestorejs/livestore, https://api.github.com/repos/livestorejs/livestore/releases
- Bus factor: schickling 2,422 commits, IGassmann 796 (top-10 sums ≈3.7k, consistent with ~3,809 total). #3 contributor is `schickling-assistant` (124), a bot account of the same maintainer — reinforces bus factor ≈1. — https://api.github.com/repos/livestorejs/livestore/contributors
- Beta status verbatim: "currently in **beta**… there might still be some breaking changes"; "no specific timeline for a 1.0 release"; three kinds of breaking changes incl. storage-format — `docs/src/content/docs/misc/state-of-the-project.md`
- 0.3→0.4 breaking changes as claimed: `<LiveStoreProvider>` → `<StoreRegistryProvider>`/multi-store React API, `store.subscribe` signature, `store.shutdown` now Effect-returning; 0.4.0 highlights (Cloudflare adapter, S2 backend, schema-first tables, `unknownEventHandling` #353) all in CHANGELOG.md — https://github.com/livestorejs/livestore/blob/main/CHANGELOG.md
- Sync model: push/pull, client-side rebase, global total order, three heads (session/leader/backend) — `docs/…/building-with-livestore/syncing.mdx`. Even stronger than the brief: "Merge conflict handling isn't implemented yet" (#253); facts system is the *future* basis (#254).
- Eventlog compaction open: issue #136 open (since 2024-08), labeled long-term roadmap, "will be unlocked by #254" — https://github.com/livestorejs/livestore/issues/136
- Blobs not synced; official pattern = metadata in LiveStore, content in e.g. S3; example code block is literally `// TODO (contribution welcome)` — `docs/…/patterns/file-management.md`
- Materializers: `ctx.query` supported; docs say side-effect-free/deterministic is "strongly recommended" (not enforced) — `docs/…/building-with-livestore/state/materializers.mdx`
- sync-cf: WebSocket/HTTP/DO-RPC transports, DO SQLite default with explicit D1 option, `validatePayload` auth hook — `docs/…/sync-providers/cloudflare.mdx`, CHANGELOG 0.4.0
- Funding: 59 active sponsors; $20/mo tier = "access to the LiveStore Devtools and other sponsor-only benefits"; devtools docs confirm sponsor-only — https://github.com/sponsors/schickling, `docs/…/building-with-livestore/devtools.mdx`
- Cost sketch: Workers Free plan includes SQLite-backed DOs (100k req/day, 5 GB storage hard cap, no billing on free plan; storage billing enabled ~Jan 2026 affects paid usage); Workers Paid = $5/mo minimum; R2 free tier 10 GB-month + free egress — https://developers.cloudflare.com/durable-objects/platform/pricing/, https://developers.cloudflare.com/workers/platform/pricing/, https://developers.cloudflare.com/r2/pricing/
- Expo promo post exists (expo.dev/blog, "LiveStore: SQLite-based data layer for local-first apps"); RedwoodSDK post confirms it funded the Cloudflare adapter work — https://expo.dev/blog/local-first-application-development-with-livestore, https://rwsdk.com/blog/rwsdk-x-livestore
- E2EE: HN thread checks out — schickling: DIY event encryption "should already be possible, though I haven't done this myself yet"; encrypted payloads would force *client-side* compaction — https://news.ycombinator.com/item?id=44105412. Additionally (missed by brief): an official docs page `patterns/encryption.md` states "LiveStore doesn't yet support encryption but might in the future" and suggests DIY via a custom Effect Schema transformation; tracking issue #70 (open, about SQLCipher at-rest) — https://github.com/livestorejs/livestore/issues/70. Substance of the brief's claim (no built-in E2EE, DIY only) stands.
- No Swift-native client: confirmed; platform-adapter docs cover web, Expo/RN, Node, Cloudflare DO only.

**Corrected**
- "First-party adapters: … Node, **Electron, Tauri**" — overstated. There is **no native Electron adapter** (docs: use the web adapter inside Electron; native adapter is tracked in #296) and **no Tauri adapter** (docs: "doesn't yet support a native Tauri adapter", #125; web adapter works). Both are *long-term roadmap* items in state-of-the-project. — `docs/…/platform-adapters/electron-adapter.md`, `docs/…/platform-adapters/tauri-adapter.md`
- "React + **Vue** integrations" — Vue is not first-party: docs point to community package `vue-livestore` by slashv, "currently in beta" aiming for parity with React. No `@livestore/vue` on npm. — `docs/…/framework-integrations/vue-integration.mdx`, https://registry.npmjs.org/@livestore/vue (404)
- Repo structure shift the brief missed: as of ~2026-06 the **Expo/RN adapter, Node adapter, sync-electric, sync-s2, Solid/Svelte integrations, CLI and devtools-expo moved out of the core monorepo** into `livestorejs/livestore-contrib` (created 2026-06-01), self-described as "Community packages … that live outside the core engine repository." Still `@livestore/*` on npm at 0.4.0 and in practice still maintained by schickling (contrib commits: schickling-assistant 37, schickling 5, IGassmann 1), but the core engine repo now owns only web + Cloudflare adapters. Mild negative signal for RN-adapter support tier. — https://github.com/livestorejs/livestore-contrib
- RN caveats worth adding: Expo adapter **requires Expo New Architecture (Fabric)** and **Expo Web is not supported** (#130) — an Expo RN app cannot also target web from the same adapter; the web client must be a separate app on `@livestore/adapter-web`. Matches Koi's RN + separate web plan, but rules out a single Expo universal codebase. — `docs/…/platform-adapters/expo-adapter.mdx`

**Unverifiable**
- "No known telemetry" in the library — nothing in docs/changelog suggests phoning home, but no audit of package code was performed; devtools license-gating mechanics not inspected.
- Exact total commit count (~3,809) — top-10 contributors sum to ~3,697; total is plausible but the commits API pagination could not be re-checked this pass.

**Net effect on verdict:** none. The verdict's load-bearing negatives (pre-1.0 beta churn, bus factor ≈1, no compaction → weak hard-erase, no built-in E2EE, sponsor-scale funding) and positives (invariant-preservation fit, ≤€5/mo self-host) all held up; corrections concern platforms Koi doesn't target (Electron/Tauri/Vue) plus a mild support-tier nuance on the Expo adapter. "Possible" remains the right call.

# InstantDB — Phase 3 sync landscape brief
As-of: 2026-07-17

## What it is
Firebase-successor realtime graph database: clients speak InstaQL (GraphQL-ish relational queries) over websockets to a sync server written in **Clojure** backed by Postgres, with a client-side triple store for optimistic updates. **Apache-2.0**, whole monorepo open source (10.4k stars, ~2.4k commits, active, as of 2026-07-17). Company: YC S22, **$3.4M seed (Oct 2024** — TechCrunch) from SV Angel, Paul Graham, Greg Brockman, James Tamplin (Firebase founder). Team is tiny: ~3–5 people (YC/Crunchbase profiles, 2026). Marketing has pivoted to "the best backend for AI-coded apps" — chasing the vibe-coding wave, which says something about where product energy goes. Hosting: their managed cloud (AWS) is the primary path; a `self-hosting/` directory exists in the repo and community guides/templates exist (Dokploy template; Ubuntu 24.04 Docker/Traefik walkthrough dated 2026-06-16), but one 2026 comparison flatly calls self-hosting "not a supported path" — accurate in spirit: possible, second-class.

## Client support
First-class TypeScript. `@instantdb/react`, `@instantdb/react-native` (last publish May 2026, actively maintained), `@instantdb/core` for vanilla/web, `@instantdb/admin` for Node backends. Typed schema via `instant.schema.ts`. RN storage uploads work via Expo. **No Swift/native iOS SDK** — RN-only on mobile, which matches the Koi hypothesis. Early-2025 field reports complained about weak types and slow client queries (200–500ms vs 2–5ms for WatermelonDB in one production account, marcoapp.io, Dec 2025); typing has improved since, query perf claim unverified but concerning.

## Sync model
Sync unit is the entity/attribute (triple store) — per-record identity and per-attribute updates, so S-1-style record-level sync and unknown-field round-tripping are natural (updates set only named attrs). Writes are atomic multi-op transactions (`update`, `merge`, `delete`, `link`). Offline: pending mutations queue locally; previously-subscribed query results are cached to IndexedDB (web) / AsyncStorage (RN) and remain readable offline, including across restarts. This is an **optimistic cache, not a replica**: only data you've subscribed to is available offline (workable at Koi scale — subscribe to everything), and the caches are evictable/size-limited (AsyncStorage on Android notoriously so). Conflict handling: **server-authoritative, last-arrival-wins**; a rejoining device's replayed mutations overwrite per-attribute with no conflict detection, no surfacing API, no custom merge hooks. Docs are silent on tombstone internals, resurrection of deleted entities by queued offline updates, and months-offline reconciliation. Blobs: built-in Storage (S3-backed), path-based permissions, links to entities — fine for Koi's document scans; offline upload queuing undocumented. Server-side app logic: `@instantdb/admin` `db.subscribeQuery` lets a Node process subscribe to queries and react to changes; docs now also list webhooks/streams (new — a 2025 field report cited their absence).

## Fit vs Koi criteria
1. **Privacy (weight 1): fails the ladder.** No E2EE at any rung and none plausible — permissions are CEL expressions evaluated server-side over plaintext; the whole query model requires a readable server. Best achievable rung: **server-readable**, softened only by self-hosting (your server, your AWS/VPS — at the cost of operating a Clojure/JVM stack). The locked floor is also awkward: the SDK is designed around an app ID and a backend; "fully functional local-only forever, no account, sync strictly opt-in" is not a supported mode, it's an accident of the offline cache.
2. **Invariant preservation: half yes.** The odometer question, concretely: yes, app code can observe merged state — client InstaQL subscriptions re-fire when server-merged data lands, so a shared-TS invariant checker can recompute per-car monotonicity post-merge and queue violations ("flag, never fix" is implementable client-side); a server hook via admin `subscribeQuery`/webhooks also works. But the engine's own merge is silent last-arrival-wins: two offline edits to the same record → later replay clobbers per-attribute with **no loss surfacing**, violating the locked "no silent loss" requirement. Mostly-append-only fuel logs dodge this in practice, not in principle.
3. **Offline depth: shallow for Koi's bar.** Day/week offline is fine; "device returns after months" is unspecified — cache eviction, tombstone retention, erase-everything durability against a long-offline device are all undocumented. Third-party assessments consistently rate it "partial local-first."
4. **Solo maintainability:** SaaS mode is genuinely low-effort with excellent TS DX. Self-hosting means running Clojure+Postgres you can't read — bad place for a solo TS dev when something breaks.
5. **Cost:** Free tier 1GB DB, unlimited API requests, never paused, commercial use OK — records fit trivially; years of document scans could push past 1GB. Pro is **$30/mo (~€28) — above the €25 cap**. Self-host VPS ~€6–12/mo fits.
6. **Maturity/bus factor:** seed-stage, ~3–5 people, one pivot already. Apache-2.0 + Postgres storage means vendor death isn't data death (export is real), but "community maintains the Clojure sync server" is not a plan a solo TS dev can lean on.

## Cost sketch
SaaS: €0 while under 1GB, else ~€28/mo (over budget). Self-host: Hetzner-class 4GB VPS €7–12/mo incl. Postgres + S3-compatible blob storage — within budget, but buys the Clojure ops burden.

## Red flags
- Silent LWW overwrite with no conflict surfacing — direct conflict with locked S-requirements.
- No E2EE path at all; server-readable is structural, not a missing feature.
- Months-offline return semantics (resurrection, tombstone retention, erase-everything propagation) undocumented.
- 3–5-person seed-stage company, marketing pivot to AI-app builders; self-hosting second-class; backend in a language the maintainer doesn't write.
- Field report of 100x slower client queries vs local-DB alternatives (Dec 2025, unverified since).

## Verdict
**Refuse** — built for realtime collaboration on a trusted server, not private local-first; it lands on Koi's lowest privacy rung with no ladder up, and its silent-LWW merge violates the locked no-silent-loss requirement.

## Sources
- https://github.com/instantdb/instant — license Apache-2.0, stars, Clojure backend, self-hosting dir (accessed 2026-07-17)
- https://www.instantdb.com/pricing — tiers (accessed 2026-07-17)
- https://www.instantdb.com/docs/backend — admin `subscribeQuery` (accessed 2026-07-17)
- https://www.instantdb.com/docs/storage — blob storage, RN uploads (accessed 2026-07-17)
- https://www.instantdb.com/product/sync + /docs/instaml — offline/optimistic model, transaction semantics (accessed 2026-07-17)
- https://techcrunch.com/2024/10/02/instant-harkens-back-to-a-pre-google-firebase/ — $3.4M seed (accessed 2026-07-17)
- https://www.ycombinator.com/companies/instant + Crunchbase — team size, YC S22 (accessed 2026-07-17)
- https://marcoapp.io/blog/offline-first-landscape — production field report, Dec 2025 (accessed 2026-07-17)
- https://www.pkgpulse.com/guides/convex-vs-instantdb-vs-electricsql-real-time-sync-2026 — "partial" local-first, server authority (accessed 2026-07-17)
- https://earezki.com/ai-news/2026-06-16-deploying-instant-open-source-firebase-alternative-on-ubuntu-2404/ + https://docs.dokploy.com/docs/templates/instantdb — self-host guides (accessed 2026-07-17)
- https://www.npmjs.com/package/@instantdb/react-native — last publish May 2026 (accessed 2026-07-17)

# PowerSync — Phase 3 sync landscape brief
As-of: 2026-07-17

## What it is
Server-authoritative sync engine: your Postgres (or MySQL/MongoDB) stays the single source of truth; the PowerSync Service (Node, Docker image `journeyapps/powersync-service`) tails the replication stream, partitions rows into "sync buckets" via SQL-like sync rules, and streams them into a client-side SQLite replica. Writes never go through the service — clients queue them locally and upload to **your own backend API**, which writes to Postgres; changes then flow back down. Not a CRDT: convergence is trivial because the server DB is authoritative.

Licensing (as-of 2026-07-17): client SDKs Apache-2.0/MIT; server Service + CLI under Functional Source License (fair source), each release auto-converting to Apache-2.0 after 2 years — the original May-2024 Open Edition release is already Apache-2.0 as of May 2026. Self-hosting is free with no commercial restrictions since the Open Edition (2024-05-31). Vendor: spun out of JourneyApps (Denver, >10 years in business, Fortune 500 industrial offline-sync deployments), ~27 employees across 3 continents (Feb 2026), active releases through May 2026.

## Client support
TS-first. GA SDKs (as-of 2026-07-17): **React Native & Expo** (v1.35.x), **JavaScript Web** (v1.39.0; wa-sqlite/OPFS, multi-tab), **Swift**, **Kotlin**, Flutter. Node.js SDK beta. Matches the RN + web TS hypothesis exactly, with a native Swift escape hatch.

## Sync model
- **Granularity:** row-level with per-record ids (satisfies S-1); partial replication via bucket sync rules.
- **Conflict handling:** none imposed. Every write reaches your backend as a CRUD batch — UPDATEs upload as **PATCH (row id + changed columns only)**, so an old client's edit doesn't strip columns it doesn't know (unknown-fields round-trip holds server-side; new fields need a client schema bump to be *visible*, not to survive). DELETE uploads the row id; tombstone/undo semantics are yours to implement in Postgres.
- **Custom merge/validation logic:** two hook points. (1) Your backend processes uploads synchronously — arbitrary TS runs on every write against canonical state. Docs explicitly prescribe: accept with 2xx even on validation failure and surface errors via a synced table (4xx blocks the whole upload queue) — i.e. "flag, never fix" is the *documented* pattern. (2) Client-side watch queries fire after downloaded changes apply, so app code observes merged state.
- **Months-offline device:** reconciles against current bucket state via checkpoints; worst case a full resync after bucket compaction (bandwidth, not data loss). "Erase everything" propagates durably because the server is authoritative.
- **Blobs:** attachments helper now built into RN/web/node SDKs (standalone `@powersync/attachments` deprecated in its favor); persistent queue with background retry; you supply the remote store (S3/Supabase/B2). Blobs bypass the PowerSync service — no quota impact, and they can be client-side encrypted before upload.

## Fit vs Koi criteria
1. **Privacy:** default rung is **server-readable** (softened by easy self-hosting — your Postgres, no analytics, plain-SQL export). **E2EE-with-account is achievable** via the official pattern (blog, 2025-10-08): encrypt envelopes client-side, sync ciphertext columns, decrypt into local raw/mirror tables (raw-table APIs stable in JS/web SDKs as of 2026). Cost: DIY key vault, mirror plumbing, raw-table migrations require local wipe + resync — and server-side validation of encrypted fields becomes impossible. **E2EE-no-accounts: not achievable** (sync authenticates via JWT against your endpoint).
2. **Invariants (odometer):** best-in-class answer. Server: shared TS invariant package runs in your upload endpoint against canonical Postgres; violations written to a `violations` table that syncs to all devices for review — accept-and-flag, never reject. Client: watch query re-runs the per-car monotonicity check whenever merged rows land. Under E2EE only the client-side path survives, but it does survive.
3. **Offline depth:** full — local SQLite is the app's database; capture identical offline; sync is additive background behavior; months-offline handled.
4. **Solo maintainability:** medium. PowerSync solves only the download path turnkey; you build the whole write path (auth, upload endpoint, validation) plus run service + Postgres containers. All plain TS/SQL though — no CRDT exotica, and the invariant code you'd write is code Koi needs anyway.
5. **Cost:** self-host on one 2–4 GB VPS (service + Postgres + backend) ≈ €5–12/mo + ~€1–2 blob storage — well under €25. Cloud free tier (2 GB synced/mo, 500 MB hosted, 50 connections) fits the scale on paper but **free projects deactivate after 1 week of inactivity**; next tier $49/mo breaks the budget. Realistic path: self-host.
6. **Maturity/bus factor:** solid mid-size: profitable-parent lineage, industrial customers, steady 2026 release cadence. If the vendor dies: clients are Apache/MIT, server converts to Apache-2.0 on a rolling 2-year clock, self-hosted stack keeps running, and data is ordinary Postgres — near-zero lock-in.

Household sharing later: natural (buckets keyed per household), permissions again your backend's job.

## Cost sketch
Self-host: Hetzner CX22-class VPS €5–12/mo (PowerSync service wants Node memory headroom), Postgres co-located, B2/Hetzner object storage for scans ~€1–2/mo. Total ≈ €7–14/mo. Cloud: $0 (deactivation risk) or $49/mo (over budget).

## Red flags
- E2EE and server-side invariant checking are mutually exclusive per encrypted field; the E2EE pattern is documented but entirely DIY.
- Free cloud tier deactivates after 1 week idle — wrong shape for a personal app.
- Postgres bucket storage for the self-hosted service still Beta (default is MongoDB — an extra container if you avoid the beta).
- Whole write path is bespoke; PowerSync ships no server-side write framework for Postgres users.
- Current server releases are fair-source (FSL), not OSI open source, for their first 2 years.

## Verdict
**Shortlist** — the writes-through-your-backend design is the cleanest home in the landscape for "flag, never fix" invariant enforcement, TS SDKs for RN+web are GA, and self-hosting fits the budget; the trade-off is that privacy realistically lands at self-hosted server-readable unless you fund a heavy DIY E2EE build.

## Sources
- https://www.powersync.com/blog/new-open-era-for-powersync (Open Edition + FSL, 2024-05-31; accessed 2026-07-17)
- https://powersync.com/legal/fsl and https://powersync.com/open-source (license split; accessed 2026-07-17)
- https://www.powersync.com/pricing (Free/Pro/Team tiers, deactivation policy; accessed 2026-07-17)
- https://docs.powersync.com/handling-writes/writing-client-changes (PATCH uploads, 2xx-on-validation-error guidance; accessed 2026-07-17)
- https://docs.powersync.com/client-sdks/overview (SDK GA/beta matrix; accessed 2026-07-17)
- https://docs.powersync.com/client-sdks/advanced/data-encryption and https://powersync.com/blog/building-an-e2ee-chat-app-with-powersync-supabase (E2EE pattern, 2025-10-08; accessed 2026-07-17)
- https://github.com/powersync-ja/powersync-js/blob/main/packages/attachments/README.md (attachments deprecation → built-in SDK helpers; accessed 2026-07-17)
- https://releases.powersync.com/announcements/introducing-postgres-for-sync-bucket-storage (Postgres bucket storage Beta; accessed 2026-07-17)
- https://powersync.com/company and https://www.powersync.com/blog/powersync-changelog-may-2026 (vendor status, team size, activity; accessed 2026-07-17)

## Verification (adversarial, 2026-07-17)

Independent fact-check against primary sources (official docs, license text, pricing page, GitHub releases). Each load-bearing claim listed as confirmed / corrected / unverifiable.

**Confirmed**

- **FSL license + 2-year Apache-2.0 conversion.** License text is FSL-1.1-ALv2 (Journey Mobile, Inc.): "irrevocably grant you an additional license to use the Software under the Apache License, Version 2.0 that is effective on the second anniversary of the date we make the Software available." Conversion is per-release, as the brief says. Source: https://www.powersync.com/legal/fsl
- **License split.** All client SDKs listed Apache-2.0 (MIT only for the supporting `sqlite_async.dart` lib); PowerSync Service and CLI under FSL. Source: https://www.powersync.com/open-source
- **Open Edition, 2024-05-31, free self-hosting.** Announcement confirms date and "free self-hosted and source-available version" with core functionality of Cloud/Enterprise (minus Dashboard). Source: https://www.powersync.com/blog/new-open-era-for-powersync
- **Pricing.** Free tier: $0, 2 GB synced/mo, 500 MB hosted, 50 peak connections, and verbatim "Free projects are deactivated after 1 week of inactivity." Pro from $49/mo. All figures in the brief match exactly. Source: https://www.powersync.com/pricing
- **SDK maturity.** Docs matrix: React Native & Expo GA, JavaScript Web GA, Kotlin GA, Swift GA, Flutter GA; Node.js and .NET Beta; Tauri/Rust Alpha. GitHub releases: @powersync/react-native 1.35.9 and @powersync/web 1.39.0, both released 2026-07-10 — release activity is *fresher* than the brief's "through May 2026." Sources: https://docs.powersync.com/client-sdks/overview, https://github.com/powersync-ja/powersync-js/releases
- **Write path semantics.** Docs confirm PATCH uploads "contains the row `id`, and value of each changed column"; explicit guidance to avoid 4xx on validation errors "since it will block the PowerSync client's upload queue"; recommended pattern of writing errors "into a separate table/collection that is synced to the client." Source: https://docs.powersync.com/handling-writes/writing-client-changes
- **E2EE pattern.** Blog dated 2025-10-08 confirms the cipher-envelope + raw-table + local mirror-table pattern. Raw tables are documented as production-ready (not experimental) in JS SDKs: Web 1.35.0+, React Native 1.31.0+, Node 0.18.0+ — supports "stable as of 2026." Sources: https://www.powersync.com/blog/building-an-e2ee-chat-app-with-powersync-supabase, https://docs.powersync.com/usage/use-case-examples/raw-tables
- **E2EE-no-accounts not achievable.** Docs: "PowerSync clients authenticate against the server-side PowerSync Service using JWTs"; no anonymous/no-account mode documented. Source: https://docs.powersync.com/installation/authentication-setup
- **Attachments deprecation.** README verbatim: "This package is deprecated in favor of using the built in attachments functionality in each web, node and react-native SDKs." Source: https://github.com/powersync-ja/powersync-js/blob/main/packages/attachments/README.md
- **Vendor lineage.** Company page: "PowerSync is a product of JourneyApps," spun off as standalone product in 2022, Denver HQ, "in business for more than a decade," Fortune 500 production use in energy/manufacturing/mining. Source: https://powersync.com/company

**Corrected / nuanced**

- **"Self-hosting is free with no commercial restrictions"** — overstated. The FSL explicitly prohibits "Competing Use" (offering the Software, or a substitute for PowerSync's own products, as a commercial product/service). Irrelevant to Koi (a personal app is not a competing sync service), but the blanket "no commercial restrictions" is wrong as written. Source: https://www.powersync.com/legal/fsl
- **"raw-table migrations require local wipe + resync"** — wipe-and-resync is one of *three* documented migration strategies; official docs also describe triggering resyncs with optimistic defaults and an `_extra`-column pattern that avoids the wipe. The blog author's harsher "no re-sync with new columns mechanism" statement is real but predates/coexists with these documented workarounds. Directionally the friction claim stands; the "require" is too strong. Source: https://docs.powersync.com/usage/use-case-examples/raw-tables
- **Postgres bucket storage "still Beta (default is MongoDB)"** — the Beta label comes from the Jan 2025 announcement ("production-ready, provided you've adequately tested your use case"); no GA announcement found as of 2026-07-17, so "not GA" holds, but the current self-hosting setup docs present Postgres as a plain alternative with no Beta label and no explicit MongoDB-default statement (demo configs do default to MongoDB). Red flag is mildly stale, not wrong. Sources: https://releases.powersync.com/announcements/introducing-postgres-for-sync-bucket-storage, https://docs.powersync.com/self-hosting/installation/powersync-service-setup

**Unverifiable (plausible, not primary-sourced)**

- **~27 employees across 3 continents (Feb 2026)** — not on the company page; corroborated only via secondary aggregator data surfaced in search. Treat as approximate.
- **Self-host cost €5–12/mo VPS + €1–2 blob** — an estimate, not a vendor figure; consistent with Hetzner CX22-class pricing but memory headroom needs for service + Postgres + backend on one 4 GB box were not independently load-tested.
- **"Blobs bypass the PowerSync service — no quota impact"** — consistent with the documented attachment architecture (files live in developer-supplied storage), but the "no quota impact" phrasing was not verified against a billing-docs statement.

**Verdict check:** no correction touches the pillars the Shortlist verdict rests on (writes-through-your-backend fit for flag-never-fix, GA RN+web TS SDKs, self-hosting within budget, documented-but-DIY E2EE, healthy maintenance). Verdict stands.

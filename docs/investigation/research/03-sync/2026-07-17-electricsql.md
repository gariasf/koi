# ElectricSQL — Phase 3 sync landscape brief
As-of: 2026-07-17

## What it is
Electric is a **read-path Postgres sync engine**: an Elixir service that tails Postgres logical replication and streams filtered table views ("shapes") to clients over plain HTTP, with long-polling for live updates. The 2024 rewrite ("Electric Next") deliberately dropped the old bidirectional local-first stack; **writes are explicitly not its job**. v1.0 GA shipped 2025-03-17; v1.1 (new storage engine) 2025-08-13; releases still landing weekly (e.g. `@electric-sql/experimental@6.0.24`, 2026-07-08). License **Apache-2.0**, ~10.3k stars, TypeScript 52.9% / Elixir 28.3% (github.com/electric-sql/electric, 2026-07-17).

Company: VC-backed startup (~21 employees per Tracxn, 2026-03-31; seed-stage, amounts not public). In **April 2026 it rebranded from electric-sql.com to electric.ax as "Electric — Agents on sync"**, repositioning around multi-agent infrastructure (Postgres Sync + Durable Streams + TanStack DB + PGlite as "primitives for multi-agent systems"). Electric Cloud self-serve pricing went live 2026-04-02. The Postgres sync engine remains the foundation and is actively maintained, but the marketing center of gravity has moved to agents.

## Client support
TypeScript-first: `@electric-sql/client` is a plain HTTP/JSON shape consumer, runs anywhere fetch runs (web, React Native, Node). The recommended app layer is **TanStack DB** (built with the Electric team): reactive client collections with optimistic mutations over Electric shapes. TanStack DB **0.6 (2026-03-25)** added SQLite-backed persistence for browser, **React Native/Expo (op-sqlite)**, Electron, Capacitor, etc. — still 0.x, not 1.0. A community Swift client exists (paulharter/ElectricSync, persists shapes to SwiftData) but is not vendor-supported.

## Sync model
- **Granularity:** row-level. A shape = one table + where-clause; clients hold an offset into the shape log and resume from it. Server compaction or shape invalidation triggers HTTP 409 `must-refetch` → client does a full resync (normal recovery path; also how a months-offline device catches up on the read side).
- **Writes: 100% DIY.** Docs state plainly: "Electric does not do write-path sync. It doesn't provide (or prescribe) a built-in solution for getting data back into Postgres." Four documented patterns: online writes; ephemeral optimistic state; shared persistent optimistic state (your own local store + merge/rebase code); through-the-database (PGlite + triggers + your own change-log uploader — docs call this "significant complexity"). No built-in outbox, retry, idempotency, or rejection/rollback handling: "If an offline write is rejected by the server, the local application needs to find some way to revert the local state."
- **Conflicts:** none in the engine — Postgres is the single serialization point; your API decides everything. Tombstones, cascades, undo, "erase everything": all your schema/API design. Deletes do propagate on the read path (delete ops in the shape log; full refetch covers long-offline devices).
- **Blobs:** no attachment story. Postgres bytea through shapes is metered per 10KB chunk on Cloud; realistically you build object storage + signed URLs yourself.

## Fit vs Koi criteria
1. **Privacy:** best achievable rung is **server-readable, self-hosted**. E2EE is architecturally impossible — Electric must read the Postgres WAL in plaintext. No-accounts sync impossible (your write API needs auth). Floor items are salvageable only because Electric is optional: the app can run local-only with no account, sync opt-in. Still the bottom rung on Koi's #1 criterion.
2. **Invariant preservation:** actually its strongest card. Every write funnels through your own TS API, so the shared invariant package runs **server-side at replay time**: accept the write, re-validate the car's odometer trail post-commit, write violations to a `violations` table that syncs down as a shape — clean "flag, never fix". Clients can also observe merged state via shape/TanStack DB change callbacks. But note this isn't the engine helping you — it's the engine staying out of the way while you build the entire write pipeline in which that hook lives.
3. **Offline depth:** read path is genuinely offline-capable since TanStack DB 0.6 persistence (resume from offset, refetch after compaction). Write path offline is where it breaks down: a device offline for months must queue writes in a bespoke outbox and replay them with your own idempotency/dedup — exactly the S-6/S-9/S-13 surface, all hand-rolled, none battle-tested.
4. **Solo maintainability:** heavy. You operate Postgres + the Elixir sync service + your write API, and you build auth, outbox, tombstones, undo, erase propagation, and blob storage. That's most of a sync engine minus the read fan-out, on 10 h/week.
5. **Cost:** fine. Self-host: one Hetzner VPS (Electric + Postgres + API) ~€6–12/mo. Cloud PAYG: $1/1M writes +$2/1M Postgres Sync, $0.10/GB·mo retention, reads/egress free, and **charges under $5/mo are waived** — effectively $0 at Koi scale, though you still host Postgres + API.
6. **Maturity:** engine is real (1.0 GA 2025, production users, active repo), Apache-2.0 so vendor death leaves runnable OSS — but the April 2026 agent pivot signals the local-app sync use case is no longer the business; expect roadmap drift.

## Cost sketch
Self-host: €6–12/mo VPS. Cloud: ~$0 (sub-$5 waiver) + ~€5 for Postgres/API hosting. Comfortably under €25/mo either way.

## Red flags
- April 2026 rebrand/pivot to an agents platform — Koi's use case is now off-strategy.
- No write-path sync by design; the hardest 60% of Koi's S-requirements are DIY.
- TanStack DB persistence is 0.x (0.6, 2026-03-25) and moving fast.
- E2EE permanently impossible; docs/domain churn (electric-sql.com → electric.ax) during evaluation.

## Verdict
**Refuse** — server-readable is the only reachable privacy rung, and the entire offline write path (outbox, idempotency, tombstones, undo, erase) is bespoke work a 10 h/week solo dev shouldn't own; the good server-side invariant story doesn't offset that.

## Sources
- https://electric.ax/docs/guides/writes (write patterns, "does not do write-path sync") — accessed 2026-07-17
- https://github.com/electric-sql/electric (license, stars, activity, "agent platform" tagline) — accessed 2026-07-17
- https://electric.ax/pricing (PAYG $1/1M writes, +$2/1M Postgres Sync, <$5 waived) — accessed 2026-07-17
- https://electric-sql.com/blog/2026/04/02/electric-cloud-pricing (Cloud pricing launch) — accessed 2026-07-17
- https://electric-sql.com/blog/2025/03/17/electricsql-1.0-released (1.0 GA) — accessed 2026-07-17
- https://electric.ax/blog/2025/08/13/electricsql-v1.1-released (v1.1 storage engine) — accessed 2026-07-17
- https://tanstack.com/blog/tanstack-db-0.6-app-ready-with-persistence-and-includes (0.6 persistence, RN/Expo via op-sqlite, 2026-03-25) — accessed 2026-07-17
- https://electric.ax/ and https://electric.ax/agents/ ("Agents on sync" repositioning) — accessed 2026-07-17
- https://electric-sql.com/docs/guides/troubleshooting (409 must-refetch behavior) — accessed 2026-07-17
- https://github.com/paulharter/ElectricSync (community Swift client) — accessed 2026-07-17
- https://tracxn.com/d/companies/electricsql/ (employee count, 2026-03-31) — accessed 2026-07-17

# @koi/server

The bespoke write-path API (D-022): Fastify 5 + zod + Drizzle (pinned; exit =
raw `pg`) against canonical Postgres, with `@koi/domain` running on every
upload — accept with 2xx, flag atomically with the data, never reject, never
silently skip. better-auth (passkey-primary + recovery codes, no email) is
deferred; a jose/JWKS shim mints dev tokens for PowerSync until it lands.
Server discipline (delta §4): no user content in logs, no analytics, no
third-party processors.

## The sync protocol in one paragraph

Every synced row carries `record_version` (S-2, server-bumped, synced down)
and a server-only `column_versions` ledger `{column: {v, by}}`. Clients
enable PowerSync `trackPrevious`, so every PATCH echoes the row it was based
on (`old.record_version` = the base_version, S-5/D-023). Per changed column:
changed after the base by a *different* device with a *different* value →
column-conflict — the incoming value is applied (arrival order, so replicas
converge) and the displaced value is preserved in a `flags` row committed in
the same transaction. Disjoint-column edits merge silently; a device's own
sequential edits never self-conflict (including the baseless offline
create-then-edit flow); identical values agree; a base from the future
(backup restore) degrades to the missing-base flag, never silent LWW. Any
(table, op) without a registered handler — including all DELETEs until S-6
lands — is dead-lettered with its full payload + flagged, never skipped
(Spike ② rule); dead-letter ids are content hashes, so retries after a lost
2xx land on the same rows instead of duplicating flags. The parent car row
is the per-car lock, always taken first — one consistent order, no
deadlocks. Client content is NUL-sanitized before it touches jsonb; raw
error text stays in server-only `dead_letters`, never on the synced flag
surface.

S-3: there is no `current_odo` column anywhere; derive it with
`deriveCurrentOdometerKm` from `@koi/domain`. S-14: every record carries
`household_id` + actor attribution from the first migration.

## The delete model in one paragraph (S-6)

A delete never removes a row on the server — the DELETE handler writes a
tombstone (`deleted_at` + `deleted_by`/`deleted_by_device`/`deleted_via`). The
PowerSync buckets carry only live rows (`WHERE deleted_at IS NULL`, D-046), so
the tombstone drops the row out of the bucket and every device sees the delete as
a checkpoint **row-removal** — no tombstone content ever reaches clients, and a
device enrolled after a delete never receives it (H1). `deleted_at` is a first-class column
in the `column_versions` ledger, so delete-vs-edit and delete-vs-undo races reuse
the base_version machinery (`planDelete` mirrors `planPatch`). The delete wins
visibility in both arrival orders and the losing edit is never silently absorbed:
an edit landing on a tombstone is kept and flagged `edit-after-delete`; a delete
over a concurrent foreign edit tombstones and flags `delete-conflict` (its base
echo is scanned per column, `deleted_at` included). Undo (inv.31) is the deleting
device re-INSERTing the row — a same-device, parent-live reading resurrects
flag-free; every other PUT on a tombstone keeps it (a car never undoes via PUT —
inv.30; a foreign replay/import is preserved-and-flagged `write-on-tombstone`,
never a silent resurrection). Deleting a car cascade-tombstones its readings in
one transaction (peers see car + children gone in one checkpoint); a reading
arriving for a deleted car is kept tombstone-born and flagged `late-child`, never
dropped, never resurrecting the parent. DELETE replay on a tombstone is a noop;
the D-038 DELETE dead letters are terminal (no auto-replay, D-044). Physical purge
is S-7, a distinct mechanism. Server-managed columns are accepted-and-ignored by
the strict PUT/PATCH schemas (`record_version`, which clients mirror, and
`deleted_at` for robustness), so the undo re-INSERT never dead-letters. A multi-car batch can deadlock
a concurrent opposite-order batch (the car lock orders a car before its own
children, not two cars); such a transient error is retried, never dead-lettered —
`upload.ts` classifies retryable SQLSTATEs so a valid op is never lost to
contention.

## Commands

The credential-less dev token mint (`POST /api/auth/token`) only exists when
`KOI_DEV_AUTH=1` — a server reaching a network without better-auth must not
silently hand out tokens.

```sh
KOI_DEV_AUTH=1 pnpm --filter @koi/server dev   # API on :4000 (stack up first — see infra/README.md)
pnpm --filter @koi/server db:generate # regenerate Drizzle migration SQL after schema edits
pnpm --filter @koi/server db:migrate  # apply migrations + ensure default household
pnpm --filter @koi/server test        # unit tier (pure protocol core)
pnpm --filter @koi/server test:sync   # torture tier — orchestrates docker compose itself
```

`test:sync` brings the infra stack up (and DOWN, volumes included, when done —
set `KOI_SYNC_KEEP_STACK=1` to keep it) and runs real two-client scenarios:
same-date append conflict (Spike ② graduate), ⑤ same-column PATCH conflict,
disjoint-column merge (no flag), unknown-table dead-letters (DELETE is not
blanket-handled), and the S-6 delete tier — tombstone propagation, edit-vs-delete
(both arrival orders), atomic cascade, late child, undo round-trip (same-device
resurrection + foreign-device rejection), and DELETE replay idempotency.

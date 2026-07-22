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
set `KOI_SYNC_KEEP_STACK=1` to keep it) and runs real two-client conflict
scenarios: same-date append conflict (Spike ② graduate), ⑤ same-column PATCH
conflict, disjoint-column merge (no flag), unknown-op + DELETE dead-letters.

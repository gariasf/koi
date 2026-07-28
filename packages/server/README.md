# @koi/server

The bespoke write-path API (D-022): Fastify 5 + zod + Drizzle (pinned; exit =
raw `pg`) against canonical Postgres, with `@koi/domain` running on every
upload — accept with 2xx, flag atomically with the data, never reject, never
silently skip. Auth is better-auth, mounted in-process (D-025, Build Session
6): passkey-primary, recovery codes as a standalone fallback, no email or
password. The dev jose/JWKS shim (`KOI_DEV_AUTH`) that stood in for it is
gone — its own header comment predicted this: "swapping it in later changes
the issuer, not the contract" (D-038). Server discipline (delta §4): no user
content in logs, no analytics, no third-party processors.

## Auth in one paragraph (D-025, Build Session 6)

better-auth is mounted in-process under `/api/auth/*` (`src/auth/instance.ts`
+ `src/app.ts`'s Fastify catch-all route), Drizzle-backed on the SAME
Postgres connection and the SAME `db:generate`/`db:migrate` flow as the rest
of the schema — `@better-auth/cli generate` emits its Drizzle table
definitions (`src/db/auth-schema.ts`), drizzle-kit does the rest, no separate
migration mechanism. This is a single-tenant server (D-023 settings-singleton
pattern): one pre-seeded owner account (`DEFAULT_OWNER_USER_ID`,
`db/client.ts`), not a real multi-user table — the simplest thing that
doesn't foreclose a real S-14 sharing flow later. The passkey plugin's
passwordless registration path (`requireSession: false` + a `resolveUser`
callback) lets the FIRST-ever passkey attach to that owner account with no
prior session; `resolveUser` refuses every registration after the first
(`FORBIDDEN` — "sign in on an existing device to add another"), so the
sessionless path is a one-time bootstrap, not a standing hole. `user.email`
exists only because better-auth's core schema requires a non-null unique
value there — it is never sent anywhere, matching D-025's "no email
dependency, EUR 0". The JWT plugin serves PowerSync's two contract endpoints
unchanged from the dev shim's contract: `GET /api/auth/jwks` (same default
path, so `infra/powersync/config.yaml`'s `jwks_uri` needed no edit) and
`GET /api/auth/token` (session-authenticated, `exp` 24h, `aud`/`iss` from
env.ts). `/upload` verifies the bearer token via `auth.api.verifyJWT`
in-process — the same check PowerSync itself performs against the same
tokens, so "valid" has exactly one definition.

Recovery codes are a standalone break-glass credential, not classic 2FA: they
are deliberately NOT built on better-auth's own `two-factor` plugin, which
bundles backup codes with a mandatory second-factor challenge on every
sign-in (flips `user.twoFactorEnabled`; a hook then gates subsequent sign-ins
behind a pending-cookie handshake) — the wrong shape when passkey sign-in is
supposed to stay one tap. `src/auth/recovery.ts` is a small custom plugin
instead: `POST /api/auth/recovery/generate` (session-required) mints 10 codes
and stores them encrypted (`better-auth/crypto`'s `symmetricEncrypt`, keyed on
the instance secret — the same public primitive `two-factor`'s own
`enableTwoFactor` handler uses internally); `POST /api/auth/recovery/verify`
(no session) redeems one, single-use, and establishes a real session exactly
as a passkey sign-in would — proven in `sync-tests/11-recovery-codes.test.ts`.

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

## The review-queue latch in one paragraph (S-4)

Every flag this write-path raises lands in the client's review queue
(`@koi/mobile`), and the only thing a client may write back about a flag is
`resolved_at` — the "I have looked at this" latch, accepted by `flags:PATCH`
(D-047). `flags:PUT` and `flags:DELETE` are deliberately absent from the
registry, so a client can neither author a flag the server never raised nor
destroy the record of one: both dead-letter loudly. `resolved_at` joined
`sync_rules.yaml` together with that handler — a column clients can see but the
server strict-rejects is a dead-letter trap (`archived_at` is still waiting for
its archive flow for exactly this reason). The server stamps its own clock and
reads the client value as intent only (non-null = resolve, null = re-open, which
is how the undo toast reverses a mis-tap), and resolution never touches
`record_version`, which on a flag row is the version of the *flagged* record.

## Commands

```sh
pnpm --filter @koi/server dev             # API + better-auth on :4000 (stack up first — see infra/README.md)
pnpm --filter @koi/server db:generate      # regenerate Drizzle migration SQL after schema edits
pnpm --filter @koi/server db:generate:auth # regenerate src/db/auth-schema.ts after auth plugin changes (@better-auth/cli)
pnpm --filter @koi/server db:migrate       # apply migrations + ensure default household + owner user
pnpm --filter @koi/server test             # unit tier (pure protocol core)
pnpm --filter @koi/server test:sync        # torture tier — orchestrates docker compose itself
```

`test:sync` brings the infra stack up (and DOWN, volumes included, when done —
set `KOI_SYNC_KEEP_STACK=1` to keep it) and runs real two-client scenarios:
same-date append conflict (Spike ② graduate), ⑤ same-column PATCH conflict,
disjoint-column merge (no flag), unknown-table dead-letters (DELETE is not
blanket-handled), the S-6 delete tier — tombstone propagation, edit-vs-delete
(both arrival orders), atomic cascade, late child, undo round-trip (same-device
resurrection + foreign-device rejection), and DELETE replay idempotency — and,
since Build Session 6, recovery-code generation and redemption
(`11-recovery-codes.test.ts`). Its "devices" sign in through a test-only
session bootstrap (`src/auth/test-bootstrap.ts`), not `KOI_DEV_AUTH` (gone) —
see the Auth section above and decisions.md for why that is structurally
safer than the flag it replaces.

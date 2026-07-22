# infra

Self-hosted sync stack (D-022/D-025): Postgres 16 (logical replication) +
PowerSync Open Edition (Postgres bucket storage, no MongoDB). Mined from
Spike ② (idle RSS ≈ 432 MiB, ≈ 470 MiB at 5k rows). Caddy (static web + TLS)
joins when `@koi/web` exists.

## Bring-up (dev)

On a **fresh volume**, order matters: PowerSync's sync rules reference tables
that only exist after `@koi/server`'s migrations run.

```sh
docker compose up -d postgres                     # 1. wait for healthy
pnpm --filter @koi/server db:migrate              # 2. create/upgrade application tables
docker compose up -d powersync                    # 3. replication + sync API on :8080
KOI_DEV_AUTH=1 pnpm --filter @koi/server dev      # 4. write-path API + JWKS on :4000
```

`packages/server/sync-tests/` orchestrates this same sequence under its own
compose project (`koi-synctest`) with its own volume, so a dev stack's data
is never touched — but the host ports are shared, so stop the dev stack
before running `test:sync`.

Host ports (bound to loopback — dev credentials must never reach a LAN):
Postgres `127.0.0.1:5433`, PowerSync `127.0.0.1:8080`; @koi/server listens on
`:4000` (0.0.0.0 — PowerSync reaches its JWKS via host-gateway; the token
mint is gated behind `KOI_DEV_AUTH=1`). On the VPS everything sits behind
Caddy.

## Ops (D-025, ~½ day/mo)

Host target: Hetzner CX23, ~€8–11/mo (all-in rung-3 figure €8–13/mo, D-022).
Nightly `pg_dump` → R2/B2; one cron alert (disk % + replication-slot lag —
WAL-slot-pins-disk is the signature failure mode); compaction cron; ≤24 h
token-revocation window (S-7). Telemetry off everywhere.

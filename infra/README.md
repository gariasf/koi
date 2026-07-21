# infra — skeleton

Lands with the sync-core sessions: docker-compose for Postgres 16 (logical
replication) + PowerSync Open Edition (Postgres bucket storage, no MongoDB) + Caddy
(static web + TLS), mined from `../../spikes/write-path/docker-compose.yml`
(Spike ② WIN: idle RSS ≈ 432 MiB, ≈ 470 MiB at 5k rows).

Host target: Hetzner CX23, ~€8–11/mo (D-025; all-in rung-3 figure €8–13/mo, D-022).
Ops (D-025, ~½ day/mo): nightly `pg_dump` → R2/B2, one cron alert (disk % +
replication-slot lag — WAL-slot-pins-disk is the signature failure mode), compaction
cron, ≤24 h token-revocation window (S-7).

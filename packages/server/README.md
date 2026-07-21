# @koi/server — skeleton

Becomes the bespoke write-path API: Fastify 5 + zod + Drizzle (pinned; exit = raw
`pg`), better-auth mounted in-process (passkey-primary + recovery codes, no email;
JWKS at `/api/auth/jwks` → PowerSync `fetchCredentials`), single-tenant (D-022/D-025).
`@koi/domain` runs on every upload: accept-with-2xx, violation flags committed
atomically with the data, never reject (Spike ② WIN).

Sync-core blockers land here first (BOARD bucket A): ⑤ base_version per-column
protocol (run-first), exhaustive op-handling (unhandled op = silent data loss —
dead-letter or flag, never skip), S-6 deletes, S-4 review-queue flags, S-14
household-non-preclusion schema stance from the first migration.

Seed: `../../../spikes/write-path/` (working compose + Fastify + JWKS stack) — mine,
never git-add. Server discipline (delta §4): no user content in logs, no analytics,
no third-party processors.

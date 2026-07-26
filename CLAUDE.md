# koi — build-phase instructions

Monorepo for the Koi replatform build. The investigation that produced this
architecture is closed (D-036) and lives at `docs/investigation/` — frozen history,
except `decisions.md`, which stays the live decision ledger.

## Session ritual

- **Start:** read `docs/build/BOARD.md` (backlog, Now/Next, session log). Blockers (⛔)
  come first; ⑤ base_version is the run-first blocker of the sync-core set.
- **End:** update BOARD.md — item statuses + one session-log line.
- **New decisions:** append D-0xx entries to `docs/investigation/decisions.md`.
- **Product truth:** never edit `koi-core-spec.md` and never re-derive product
  decisions — record amendments in `docs/build/spec-delta.md` (create on first use).

## Ground rules

- **Architecture is LOCKED (D-032) — build it, don't relitigate it.** Bundle A
  (Expo/RN, one codebase for iOS + Android) · Fastify 5 + zod + Drizzle (pinned,
  exit = raw `pg`) · better-auth in-process (passkey-primary + recovery codes, no
  email) · PowerSync Open Edition self-hosted, rung 3, Postgres bucket storage +
  bespoke write-path · Vite + React SPA + TanStack Router behind Caddy ·
  `@koi/domain` pure core · Skia + Victory Native XL native charts, Recharts web.
- **Sync semantics are the full S-1…S-14 set (D-013)**, not just the spiked subset.
  `@koi/domain` validates server-side on every upload (accept-with-2xx + atomic
  violation flags) and client-side on write — "flag, never fix".
- **`@koi/domain` purity is load-bearing.** Dependency-free, deterministic,
  engine-agnostic (V8 == JSC == Hermes byte-identical, Spike Ⓒ). The ESLint bans
  (Intl / Date / tz / crypto / locale methods) and the golden-vector suite
  (md5 `f93b1d6b1717043d97f16b0a17416681`) enforce it. A golden-vector diff is a
  cross-engine-convergence event to investigate, never a fixture to update casually.
- **Spikes are throwaway seed.** `../spikes/` (outside this repo) gets mined into
  real packages, then deleted. Never git-add spike code.
- **Ops stance (D-025):** local builds; no OTA / EAS Update; telemetry off
  (turbo remote cache disabled in `turbo.json`, `pnpm turbo telemetry disable` per
  machine, `EXPO_NO_TELEMETRY=1`, `DO_NOT_TRACK=1` in CI); ~6-month Expo SDK upgrade
  windows; niche tools keep their exit plans (`docs/investigation/04-stack.md` §5).
- **a11y** deprioritized near-term (D-028); the end-state pass (D-014) is still owed.
  **Pricing** is OPEN (D-009) — build nothing that forecloses it: no nag walls, no
  feature hostage-taking (constitutional).
- **Commits are authored by the owner only** — never add a Claude/AI co-author
  trailer or "Generated with" line.

## Commands

```sh
pnpm install
pnpm turbo run lint typecheck build test    # all packages
pnpm --filter @koi/domain test              # one package
pnpm --filter @koi/domain conformance:all   # golden vectors: node + jsc + hermes
pnpm turbo run test:sync --concurrency=1    # sync tiers vs a real stack — serial: shared host ports
```

`@koi/mobile` builds locally only (no EAS, no OTA): `expo prebuild --platform ios`
then `expo run:ios`. `EXPO_PUBLIC_KOI_SELFTEST=1` runs the S-6/S-4 scenarios on
launch. Details in `packages/mobile/README.md`.

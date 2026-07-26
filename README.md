# koi

Multiplatform Koi: one Expo/React Native app serving iOS + Android, a read-mostly web
companion, and a single-tenant self-hosted sync server — the build phase of the
koi-project investigation (verdict GO, D-031; architecture locked, D-032).

- **Product truth:** [`koi-core-spec.md`](koi-core-spec.md) — amended only via
  requirements deltas, never re-derived.
- **Decision record:** [`docs/investigation/`](docs/investigation/) — the closed
  investigation (phases 1–6). `decisions.md` stays the live ledger (D-001… and onward).
- **Build board:** [`docs/build/BOARD.md`](docs/build/BOARD.md) — backlog, Now/Next,
  session log, working rhythm.

## Layout

| Path | What |
|---|---|
| `packages/domain` | `@koi/domain` — pure, dependency-free domain core (Ⓒ-verified cross-engine, now also on the Hermes RN ships) |
| `packages/mobile` | `@koi/mobile` — Expo SDK 57 / RN 0.86 app: PowerSync client, the S-6 delete contract, the S-4 review queue. Not the app surface yet (bucket D). |
| `packages/web` | `@koi/web` — Vite + React SPA + TanStack Router (skeleton) |
| `packages/server` | `@koi/server` — Fastify 5 write-path API; sync protocol + delete model complete, better-auth still deferred |
| `infra/` | docker-compose (Postgres + PowerSync; Caddy joins with `@koi/web`) |

## Toolchain

pnpm workspaces + Turborepo — local cache only, remote cache disabled, telemetry off
(run `pnpm turbo telemetry disable` once per machine). Node ≥ 22.12, pnpm via corepack.

```sh
pnpm install
pnpm turbo run lint typecheck build test
pnpm --filter @koi/domain conformance:all   # golden vectors on node + jsc + hermes (macOS)
pnpm turbo run test:sync --concurrency=1    # both sync tiers against a real stack (Docker; shared ports)
```

The mobile app builds locally only — no EAS, no OTA. See
[`packages/mobile/README.md`](packages/mobile/README.md) for the simulator run and the
RN-bundled Hermes vector check.

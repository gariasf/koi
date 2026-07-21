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
| `packages/domain` | `@koi/domain` — pure, dependency-free domain core (Ⓒ-verified cross-engine). The only live package so far. |
| `packages/mobile` | `@koi/mobile` — Expo/RN app, iOS + Android (skeleton) |
| `packages/web` | `@koi/web` — Vite + React SPA + TanStack Router (skeleton) |
| `packages/server` | `@koi/server` — Fastify 5 write-path API + better-auth (skeleton) |
| `infra/` | docker-compose (Postgres + PowerSync + Caddy) — lands with the sync-core sessions |

## Toolchain

pnpm workspaces + Turborepo — local cache only, remote cache disabled, telemetry off
(run `pnpm turbo telemetry disable` once per machine). Node ≥ 22.12, pnpm via corepack.

```sh
pnpm install
pnpm turbo run lint typecheck build test
pnpm --filter @koi/domain conformance:all   # golden vectors on node + jsc + hermes (macOS)
```

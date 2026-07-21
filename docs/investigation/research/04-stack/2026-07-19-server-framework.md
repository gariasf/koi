# Server framework for the bespoke TS write-path API: NestJS vs Fastify vs Hono (+ tRPC?) — research brief

**Date:** 2026-07-19 · **Phase:** 4 (stack & platform fit) · **Author:** research subagent

**Verdict:** Fastify 5 + zod type provider, plain REST (no tRPC), Drizzle (or raw `pg`) — NestJS is ceremony a 6-endpoint API doesn't need; Hono is a credible runner-up, not the boring choice.

## Findings

- **Scope check.** ~6 endpoints (auth ×4, JWT/JWKS for PowerSync, upload running `@koi/domain`, erase, export); PowerSync owns reads — the decision is overhead, ecosystem, longevity.
- **NestJS** — v11.1.28 (2026-07-08). Most popular full framework, but DI/modules/decorators amortize over multi-team codebases, and class-validator idioms clash with a zod-first `@koi/domain`. v12 (draft PR nestjs/nest#16391, early Q3 2026) fixes that via Standard Schema but is also a full ESM/Vitest/Rspack flip: adopt v11 and migrate mid-build, or ride a fresh major. Learning bias is a tiebreaker; this is not a tie.
- **Fastify** — v5.10.0 (2026-07-05). OpenJS Foundation project with a written LTS policy (v5 GA 2024-09-17, Node ≥20). First-party plugins cover Koi's surface: `@fastify/jwt` 10.2.0 (603k weekly) for signing/verification ~~incl. JWKS~~ **corrected (review):** JWKS verify needs `get-jwks`; the publish endpoint is hand-rolled (`jose`) everywhere — plus rate-limit/cors/helmet. Core TS generics are verbose, but `fastify-type-provider-zod` 7.0.0 (718k weekly) infers request/response types from the same zod (v4.4.3, 213M weekly) `@koi/domain` will use.
- **Hono** — v4.12.31 (2026-07-18), fast cadence. Nominal 46.6M weekly is inflated by toolchains embedding Hono ~~(secondary: ~9M, Jan 2026)~~ **corrected (review):** unsourced — cited article lacks it; the trajectory is the signal, not the number. TS-first, built-in jwt/jwk middleware, `@hono/zod-validator` (2.8M weekly). Runs on a VPS via `@hono/node-server` (2.0.10), but its center of gravity is edge runtimes; server-side plugin depth (rate limiting, multipart, observability) is thinner and more DIY.
- **tRPC** — healthy (`@trpc/server` 11.18.0, v11 GA 2025-03-21), but its payoff — end-to-end types across many procedures — barely applies: the only caller is PowerSync's `uploadData` hook, the contract is one upload shape plus auth, and the types live in `@koi/domain`. It would couple RN/web clients to `@trpc/client` for one POST. Skip; REST + zod.
- **Postgres layer** — `pg` is the boring floor for a dozen hand-written queries. Drizzle adds typed schema + SQL-shaped queries + migrations at near-zero runtime cost — though 1.0 is still RC and ~~issues sit at 1.9k~~ **corrected (review):** open issues ≈ 1.4k (1.9k counted PRs). Prisma is more machinery than 6 endpoints justify; Kysely is excellent but the smallest community and still 0.x. Pick Drizzle; raw `pg` is the fallback.

## Numbers (as of 2026-07-19; npm + GitHub APIs)

| Package | Latest | Published | Weekly DL | Stars | Backing |
|---|---|---|---|---|---|
| `@nestjs/core` | 11.1.28 | 2026-07-08 | 11.6M | 76.1k | Trilon; lead Kamil Myśliwiec |
| `fastify` | 5.10.0 | 2026-07-05 | 9.2M | 36.8k | OpenJS Foundation; Platformatic maintainers |
| `hono` | 4.12.31 | 2026-07-18 | 46.6M* | 31.4k | Community; creator at Cloudflare |
| `@trpc/server` | 11.18.0 | 2026-06-17 | 4.0M | 40.4k | Community/sponsors |
| `drizzle-orm` | 0.45.2 (1.0.0-rc.4) | 2026-03-27 | 13.7M | 35.2k | Drizzle Team (VC-backed) |
| `@prisma/client` | 7.8.0 | 2026-04-22 | 13.5M | 47.4k | Prisma (company) |
| `kysely` | 0.29.4 | 2026-07-17 | 10.4M | 14.1k | Community |
| `pg` | 8.22.0 | 2026-06-19 | 36.3M | — | Community (Brian Carlson) |

*Includes unquantified transitive installs from tooling.

## Risks

- **Fastify:** plugin quality varies outside the `@fastify` org — stay first-party. Maintainer concentration at Platformatic, mitigated by OpenJS governance. Breaking minors can land within LTS (the doc's own caveat).
- **NestJS:** v12 ESM migration would land mid-build; single-lead bus factor; more framework to carry at 10 h/week.
- **Hono:** Node adapter is one layer removed; thinner server-ops ecosystem means hand-rolled glue.
- **Drizzle:** 1.0 still RC — pin versions; exit is trivial (SQL-shaped queries; drop to `pg`).

## Koi fit

Privacy: neutral (self-hosted, no telemetry). Invariants: framework-agnostic; zod-native routing (Fastify type provider, Hono validator) integrates `@koi/domain` more directly than NestJS v11's class-validator. Solo maintainability: Fastify and Hono are a few files; NestJS is the outlier. Cost: identical (one Node process). Maturity/community (raised, D-022): all pass; Fastify uniquely combines foundation governance, written LTS, and first-party plugins for exactly Koi's needs. Fastify wins as weighted; Hono is the runner-up (exit target if Fastify stalls); NestJS declined despite the learning bias — on overhead, not popularity.

## Sources

All accessed 2026-07-19; re-checked 2026-07-20.

- npm registry/downloads APIs; GitHub API — versions, dates, downloads, stars.
- https://github.com/nestjs/nest/pull/16391 — v12 draft PR.
- https://fastify.dev/docs/latest/Reference/LTS/ — LTS policy.
- https://www.infoq.com/news/2026/04/nestjs-12-roadmap-esm/ — v12 roadmap (secondary).
- https://trpc.io/blog/announcing-trpc-v11 — v11 GA.
- ~~dev.to Hono article~~ **corrected (review):** lacked the cited figure; dropped.

## Adversarial review (2026-07-19)

**Verdict:** sound-with-fixes
**Corrections:**
- `@fastify/jwt` does no JWKS itself: verify needs `get-jwks` (per README); the publish endpoint PowerSync polls is hand-rolled (`jose`) in every framework. Fixed.
- Drizzle's "1.9k issues" counted PRs (1,914 issues+PRs); open issues = 1,358 ≈ 1.4k. Fixed.
- Hono's "~9M secondary downloads (Jan 2026)" was mis-cited — the dev.to source lacks the figure (claims "400K+ weekly", itself stale). Struck; the inflation point stands qualitatively. Fixed (2nd pass, 2026-07-20).
- Everything else re-verified against primary sources (npm APIs, GitHub API, PR #16391 + InfoQ, fastify.dev LTS incl. breaking-minors caveat, tRPC v11 GA 2025-03-21, Fastify 5.0.0 2024-09-17, `hono/jwt`/`jwk` in source): exact.

**Missed:**
- **Express** — v5.2.1 (2025-12-01), 109.6M weekly, 69.2k stars (verified): most popular Node framework, omitted despite D-022. Outcome unchanged (no zod-native typing, thin first-party plugins, minimal v5 modernization) but belonged on the record.
- `fastify-type-provider-zod` is **not** in the `@fastify` org (verified: `turkerdev/`) — tension with "stay first-party". Referenced by Fastify's docs; acceptable, with native JSON-schema typing as the exit.

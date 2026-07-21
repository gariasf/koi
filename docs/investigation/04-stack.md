# Phase 4 — Stack & platform fit

**Question:** what builds three clients and a server around PowerSync self-hosted + bespoke TS write-path API + Postgres (D-022)?

**Method:** 12 web-research briefs, each adversarially verified (all 12 verdicts: sound-with-fixes; corrections applied in-file). Evidence: `research/04-stack/2026-07-19-*.md`, claims as-of 2026-07-19 (re-verified 2026-07-20). Weighted criteria per charter as amended by D-022 (maturity/community raised; learning bias = tiebreaker only).

## 1. The platform fork — the one real decision

Everything else in this phase is stack detail; the fork is **unified RN/Expo everywhere** vs **SwiftUI iOS + TS web/server (hybrid)**. KMP is refused outright (§4).

**Bundle A — unified TypeScript (Expo/RN + web + server).** RN/Expo mid-2026 delivers ~90–95% of Koi's quality bar: `formSheet` wraps real `UISheetPresentationController` on iOS; expo-haptics covers all UIKit feedback generators; PowerSync RN SDK is GA (since 2023-11, longest-lived client SDK); New Architecture cliff is over; Expo UI (stable SDK 56) exposes real SwiftUI/Compose components as drop-ins. `@koi/domain` runs unmodified on every client — invariant purity by construction. Android becomes near-free. The missing 5%: Android sheet fidelity (16 open formSheet issues), zoom transitions alpha-only (`Link.AppleZoom`, iOS 18+), no CoreHaptics/AHAP custom patterns (needs a small Swift Expo Module), chart a11y hand-rolled (§3).

**Bundle B — SwiftUI hybrid (benchmark to beat).** Technically sound: PowerSync Swift SDK GA (v1.0.0 2025-05-02, near-parity, but a <2-month-old pure-Swift core rewrite with a patch tail, 59 stars — PowerSync's least-adopted SDK). Crown jewel solved via `@koi/domain` as esbuild IIFE bundle in system JavaScriptCore (0 MB, mature API, golden-vector CI policing the bridge); WASM and dual-porting rejected. Buys guaranteed capture feel. Costs: every feature ships twice (SwiftUI + web), i18n/a11y ×2, and **Android = effectively never** (third codebase or late maximal-cost RN rewrite).

**Recommendation: Bundle A primary, Bundle B contingency, decided by the capture-feel spike.** If the spike (fitted sheets incl. Android, keypad, haptics, zoom-transition fallback story) meets the Koi bar on device, A wins on invariant purity, solo maintainability, and the live Android option. If it fails the bar, B is the honest best — locked together with an explicit "Android = never" rider. This preserves D-012's park trigger: capture feel fails *both* → park.

## 2. Shared substrate (identical under both bundles)

| Layer | Pick | Key evidence (as-of 2026-07-19) | Refused |
|---|---|---|---|
| Server | **Fastify 5** + `fastify-type-provider-zod`, plain REST | 9.2M dl/wk, OpenJS governance; first-party JWT plugin; zod-first matches domain. JWKS publish endpoint hand-rolled via `jose` (needed under every framework) | NestJS (ceremony amortizes over large codebases; v12 ESM major ~Q3 2026 lands mid-build), tRPC (one upload shape, types already in `@koi/domain`), Hono = documented runner-up/exit |
| DB access | **Drizzle** (1.0-rc; pin) | 13.7M dl/wk; SQL-shaped, trivial exit to raw `pg` (36.3M) | Prisma (machinery > 6 endpoints), Kysely (smallest community) |
| Auth | **better-auth** mounted in the write-path API | 5.26M dl/wk > next-auth; acquired by Vercel 2026-07-07, stays MIT; JWT plugin serves JWKS at `/api/auth/jwks`, EdDSA default — matches PowerSync contract (`aud` = instance, exp ≤ 24 h, jwks_uri). Passkey-primary + password + recovery codes → **no email dependency, EUR 0** | Lucia (deprecated 2025-03), Auth.js (maintenance-only, points to better-auth), Keycloak/Zitadel/Ory (single-tenant overkill), Clerk/Auth0 (third-party processors — privacy floor) |
| Hosting | **Hetzner CX23** (Falkenstein), Docker Compose, optional Dokploy; nightly `pg_dump` → R2/B2; one cron alert: disk % + replication-slot lag | ~EUR 8–11/mo incl. VAT — validates Phase 3's 8–13 envelope. PowerSync needs **no MongoDB**: Postgres bucket storage is **GA** (was Beta at Phase 3 — spike ④ premise softened). WAL-slot-pins-disk = signature failure mode | Fly (~EUR 15–17, US GDPR posture), Railway (~EUR 17–25, usage billing flirts with ceiling); Netcup = named fallback |
| Web frame | **Vite + React SPA** + TanStack Router + vite-plugin-pwa; static `dist/` behind Caddy, zero runtime process | Vite 144M dl/wk; PowerSync Web SDK stable, OPFSCoopSyncVFS multi-tab incl. Safari, no COOP/COEP needed. Safari ITP 7-day eviction = re-login annoyance at rung 3, not data loss; home-screen PWA exempt | Next.js (static export discards RSC/SSR value, keeps constraints — bias is tiebreaker, this is not a tie), TanStack Start (server layer with no job), Remix 3 (pivoted) |
| Monorepo | **pnpm workspaces + Turborepo** (local cache only, telemetry off day 1); `@koi/domain` = plain tsc-compiled package (project refs + declaration maps); single react/RN version via pnpm catalogs | pnpm 126M dl/wk; Expo+pnpm smooth since SDK 53–55 (isolated node_modules supported) | Nx (needs, 2024 caching paywall, 2025 s1ngularity supply-chain incident) |
| Domain pkg | **Nearly dependency-free pure ES**: integer minor units (`Number.isSafeInteger` guards), civil `YYYY-MM-DD` strings computed at the edge, code-point ordering on NFC strings for merges, IDs injected from shell (`uuid` v14, UUIDv7). Only dep: date-fns v4 (pure calendar math). ESLint/tsconfig bans: Intl, `new Date()`, tz libs, crypto | Hermes delegates Intl to per-OS facilities (non-uniform) and lacks PluralRules + crypto entirely; collation is implementation-defined — discipline, not libraries, is the guarantee. Test: one Vitest 4 suite (Node + browser mode) + golden-vector on-device Hermes smoke test | dinero.js (stable only 2026-03 after 5 yr alphas), Temporal (not in Safari/Node 22/Hermes; revisit ~2027) |
| i18n | **i18next** everywhere (react-i18next on clients, core on server); shared `@koi/i18n` plain-JSON catalogs; i18next-cli for extract/lint/status/type-gen; `@formatjs/intl-pluralrules` polyfill pinned in RN entry; MT via local own-key LLM script | 18.6M dl/wk — 6–14× react-intl/Lingui; zero build step into Metro/Vite/Node | Lingui (per-target compiles, ESM-only), react-intl (React-only server side) |

## 3. Native charts (Bundle A)

**Skia (`@shopify/react-native-skia`) + Victory Native XL**; web charts separately on **Recharts** (49M dl/wk), sharing only TS series-building selectors — Skia-on-web means 2.9 MB CanvasKit WASM, refused. Feasibility confirmed: `useChartPressState` on Reanimated shared values, off-JS-thread scrub, carousel = pager of Canvases. Two honest costs identified, **both deferred to the build-phase backlog per owner amendment D-028** (a11y deprioritized for now; end-state D-014 pass stands): (1) per-datapoint VoiceOver/TalkBack = bespoke transparent-overlay subsystem (Skia exposes one whole-canvas a11y node; XL offers zero help); (2) Dynamic Type inside canvas = manual fontScale plumbing + reflow. XL is the D-022 niche exception: 1.2k stars, Nearform-sponsored, 6-month quiet spell — justified as de-facto RN chart layer, exit = rebuild Koi's two chart types on raw Skia (thin layer over Skia + d3-scale, contained).

## 4. Refusals (Phase 4)

- **KMP / Compose Multiplatform** — stack is production-ready in 2026 (CMP iOS stable since 1.8.0), but wrong language: every configuration adds Kotlin+Gradle for a TS-strong solo dev and breaks or complicates the locked pure-TS `@koi/domain` shared with the locked TS server; thinnest-community PowerSync SDK (~120 stars); 3–6 months learning before feature work. Do not revisit unless the TS-domain decision reopens.
- **NestJS, Next.js** — both declared learning biases, both refused on evidence; bias is tiebreaker only and neither race was a tie. (Bias ledger honest: of the three, only Expo survives, on merits.)
- **tRPC, TanStack Start, Nx, Prisma, Kysely, Lucia, Auth.js, Keycloak/Zitadel/Ory, Clerk/Auth0, Fly, Railway, dinero.js, Temporal-now, Lingui, react-intl, Skia-on-web** — per §2/§3 rows.

## 5. D-022 niche-tool register (every non-popular pick, with exit)

| Tool | Exposure | Exit plan |
|---|---|---|
| @powersync/react-native (27k dl/wk, 691★) | sync client | data is plain SQLite; engine swap = Phase 3 exit (plain Postgres) |
| op-sqlite driver (pre-1.0) | RN SQLite | PowerSync supports driver swap (already survived quick-sqlite→op-sqlite) |
| Victory Native XL (1.2k★) | charts | rebuild 2 chart types on raw Skia + d3-scale |
| TanStack Router (14.8k★) | web routing | swap to React Router inside same Vite shell |
| better-auth (young, VC) | auth | users in own Postgres tables; rewrite one auth module, no data migration |
| Drizzle (1.0-rc) | DB layer | queries SQL-shaped → raw pg is trivial |
| Turborepo (Vercel-owned) | build orchestration | delete turbo.json → pnpm -r (an afternoon) |

## 6. Obligations & open risks out of Phase 4

1. Android formSheet polish budget (16 open issues upstream); zoom transitions = iOS-only progressive enhancement while alpha; custom AHAP haptics = small Swift Expo Module if spike demands.
2. Chart a11y overlay subsystem + fontScale plumbing — deferred to build-phase backlog (D-028); end-state a11y pass (D-014) unchanged.
3. wa-sqlite worker/WASM bundling + OPFS multi-tab on **real Safari** early; recommend home-screen install (ITP exemption).
4. better-auth native passkeys in Expo unverified — password-first fallback on mobile if spike fails.
5. Hermes golden-vector harness (~a day) wired into CI or it rots; domain ESLint bans enforced from first commit.
6. Local builds + free EAS tier; skip OTA/EAS Update (first-party update path only); disable Expo CLI + turbo telemetry; budget one Expo SDK upgrade window per ~6 months.
7. Upgrade-treadmill coupling: Skia peer-dep floor (React 19, Reanimated ≥3.19) forces staying current — one bad upgrade can eat a month of 10 h/wk.

## 7. Spike list handed to Phase 5 (picks ≤4)

Phase 3 pre-registered ①–⑤ (see `03-sync-architecture.md`); Phase 4 amends:

- **④ downgraded**: Postgres bucket storage now GA (verify 2026-07-20) — premise softened; keep restart/compaction/slot-recovery torture inside ① rather than standalone.
- **Ⓐ Capture feel (canonical, now decision-bearing):** fitted sheet (iOS *and* Android), custom keypad, haptics, saved-moment in Expo dev build on device. Kill: doesn't feel Koi-grade → Bundle B. This spike now decides the platform fork (§1).
- **Ⓑ Chart bar:** XL month carousel + scrub/tap-to-read on device. Kill: can't hold 60fps or doesn't feel Koi-grade. (A11y overlay prototype dropped from scope per D-028.)
- **Ⓒ Domain conformance:** ~10 invariants through Vitest Node+browser + Hermes golden-vector on device. Kill: any engine divergence.
- **Ⓓ Auth round-trip:** better-auth + passkey on Expo + JWKS → self-hosted PowerSync `fetchCredentials`. Kill: native passkey dead-ends *and* password flow also fights the SDK.

Suggested Phase 5 pick: Ⓐ, ②(write-path round trip), Ⓑ, Ⓒ — with ①/Ⓓ folded in opportunistically (① is mostly ops setup, Ⓓ is small).

## Recommendation

Lock the shortlist: **Expo/RN unified stack (Bundle A) as primary, SwiftUI hybrid (Bundle B) as named contingency**, fork resolved by Spike Ⓐ; shared substrate per §2 (Fastify + Drizzle + better-auth + Hetzner + Vite SPA + pnpm/Turborepo + dependency-free domain + i18next); charts per §3; refusals per §4; niche register per §5 satisfies D-022. **Locked at gate 2026-07-20 with one owner amendment: a11y deprioritized for now (D-028) — removed from spike scope/kill criteria; end-state D-014 pass stands; shortlist unchanged.**

## Carry-forward

- Stack shortlist LOCKED at gate 2026-07-20 (owner amendment: a11y deprioritized, D-028): **Bundle A (Expo/RN everywhere) primary; Bundle B (SwiftUI hybrid, "Android = never" rider) contingency; Spike Ⓐ (capture feel) decides**; both bundles carry same substrate.
- Substrate: Fastify 5 + zod + Drizzle(pin, exit=pg) · better-auth (JWKS→PowerSync, passkey+recovery codes, no email) · Hetzner CX23 ~€8–11/mo (PowerSync Postgres bucket storage GA — no MongoDB) · Vite SPA + TanStack Router static behind Caddy · pnpm+Turborepo · i18next + shared JSON catalogs.
- `@koi/domain`: nearly dependency-free pure ES — integer minor units, civil-date strings, code-point ordering, IDs injected; only date-fns v4; ESLint bans Intl/Date/tz/crypto; Vitest + Hermes golden-vector smoke test.
- Charts: Skia + Victory Native XL native, Recharts web (share selectors only); per-datapoint a11y overlays + fontScale = build-phase backlog (D-028), not spike scope.
- Refused: KMP (wrong language for locked TS domain), NestJS + Next.js (biases, not ties), Nx, tRPC, dinero.js, Temporal-until-~2027 — full list §4.
- D-022 niche register with exits: PowerSync-RN, op-sqlite, Victory XL, TanStack Router, better-auth, Drizzle, Turborepo (§5).
- Spike list amended: ④ folded into ①; new Ⓐ (capture feel = platform-fork decider), Ⓑ (chart bar feel/perf — a11y dropped per D-028), Ⓒ (domain conformance), Ⓓ (auth/passkey round-trip); Phase 5 picks ≤4, suggested Ⓐ ② Ⓑ Ⓒ.
- Ops obligations: local builds, no OTA, telemetry off, ~6-month SDK upgrade windows, disk+WAL-slot alert.
- Evidence: 12 adversarially-verified briefs in `research/04-stack/` (as-of 2026-07-19).

## State (session log)

- **Session 1 (2026-07-19→20):** phase opened, fan-out approved at Phase 3 gate. 12-brief workflow (each adversarially verified; first launch died on args-parsing bug — zero cost; 7 verifies re-run after session-limit reset, all cached briefs replayed). All verdicts sound-with-fixes, corrections applied in-file. Synthesis: platform fork framed as Bundle A/B decided by capture-feel spike; substrate picked; refusals + niche register + amended spike list written. Status: gate.
- **Gate (2026-07-20, same conversation):** owner amendment — a11y deprioritized for now (D-028): dropped from spike scope/kill criteria, chart overlay subsystem + fontScale to build backlog; end-state D-014 pass stands; shortlist unchanged. Owner locked. D-024–D-027 LOCKED (D-027 amended), D-028 added. **Status: locked.**

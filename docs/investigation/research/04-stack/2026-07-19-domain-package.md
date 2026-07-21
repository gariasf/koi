# `@koi/domain` package design: identical behavior on Hermes, browsers, Node — research brief

**Date:** 2026-07-19 · **Phase:** 4 (stack & platform fit) · **Author:** research subagent

**Verdict:** Identical behavior is achievable, but only by design discipline: keep the package pure-ES (no Intl, no timezone math, no crypto), represent money as integer minor units and dates as civil `YYYY-MM-DD` strings, and add near-zero dependencies — the libraries matter less than the coding rules.

## Findings

**Runtime baseline.** Pure ECMAScript (syntax, Number/BigInt/Array/Map/Set semantics) is spec-identical across Hermes V1, evergreen browsers, and Node 22. Divergence lives in three places: Intl, Temporal, and crypto. Hermes V1 became RN's default engine in 0.84 (early 2026; RN 0.86 current as of 2026-06-09).

**Intl on Hermes (as of 2026-07-19, official doc):** `Intl.Collator`, `NumberFormat`, `DateTimeFormat`, `getCanonicalLocales` are supported — but by delegating to Android/iOS platform facilities, not bundled ICU, "at the cost of some variance in behaviours" (per-platform gaps: `formatToParts` Android-only; iOS lacks compact notation/`signDisplay`). **`Intl.PluralRules` is not implemented** — apps polyfill via `@formatjs/intl-pluralrules` (6.3.13, 2026-07-16). Consequence: Intl output is *not* deterministic across Koi's runtimes; it must stay out of `@koi/domain` (UI-layer only).

**Temporal (as of 2026-07-19):** Stage 4 / ES2026 (2026-03-11). Shipped: Firefox 139 (May 2025), Chrome/Edge 144 (Jan 2026). Not shipped: ~~Safari (nothing even in TP as of May 2026)~~ **corrected (review):** Safari (in Technology Preview behind a flag, off by default — caniuse, 2026-06), **Node 22** (unflagged only in Node 26, May 2026), Hermes. So Temporal today means a polyfill everywhere Koi runs server-side and on iOS. `temporal-polyfill` (fullcalendar) hit 1.0 on 2026-06-19, <20 kB, test262-tracked; `@js-temporal/polyfill` (reference) is still 0.5.x. Neither documents Hermes support — unverified; would need a spike.

**crypto:** `crypto.randomUUID` exists in Node 22 and all evergreen browsers, **not in Hermes** (no `crypto` at all; RN needs `expo-crypto` or `react-native-get-random-values`, per facebook/hermes#915). ~~UUIDv7 is not in Node's crypto (open issue nodejs/node#62529)~~ **corrected (review):** `crypto.randomUUIDv7()` merged 2026-04-05 (that issue is closed), shipped in Node 26.0.0, backported to 24.16.0 LTS — only Node 22 lacks it; the `uuid` package generates v7 (14.0.1, 2026-06-20, 248M downloads/wk). Rule: `@koi/domain` never generates IDs — the app shell injects them.

**Money:** integer minor units (cents, milliliters, meters) in plain numbers with `Number.isSafeInteger` guards are exact and engine-identical — sums/comparisons (most of the ~100 invariants) need no library. For the few division points (price/L, consumption), fix one rounding policy in a small helper; reach for `big.js` only if fractional accumulation appears. `dinero.js` v2 went stable 2026-03-02 after ~5 years of alphas — single-maintainer stall history and 405k/wk fail the D-022 popularity bar. `currency.js` unreleased since 2021-05-19: avoid.

**Dates:** day-bucketing with backdated edits is calendar math, not timezone math. Compute the civil date `YYYY-MM-DD` at the edge (client, local tz); the domain operates only on those strings, so Hermes's platform-delegated timezone behavior never touches invariants. `date-fns` v4 core is pure JS (no Intl), Hermes-proven, 86M/wk; keep `@date-fns/tz`/Luxon (Intl-based) out of the domain. Temporal `PlainDate` is the clean future; revisit when Safari + Node LTS ship it (~2027).

**Collation:** ECMA-402 leaves collation implementation-defined ("results are implementation-specific" — MDN); Hermes inherits per-OS behavior, Node bundles full ICU, browsers vary by ICU version. Any ordering feeding merge/invariants must use code-point comparison on NFC-normalized strings + UUID tiebreak (fully ES-specified). `Intl.Collator` = display only.

**Testing:** Vitest 4 (4.1.10, 2026-07-06; browser mode stable since 4.0, 2025-10-22) runs one suite on Node 22 + real Chromium/WebKit. No Vitest-on-Hermes exists; `hermes-engine-cli` is stale (0.12.0, 2022). Prior art for cross-runtime conformance is golden vectors (crypto/wasm libs): export a few hundred input→expected JSON fixtures from the Node suite and replay them in a dev-build RN smoke screen. ES-spec trust + that smoke test is the pragmatic call — justified because the coding rules above eliminate every known divergence surface.

## Numbers

(as of 2026-07-19; version · published · npm/wk · GitHub stars)
- date-fns 4.4.0 · 2026-05-29 · 86.0M · 36.6k
- dayjs 1.11.21 · 2026-05-26 · 56.5M · 48.7k · Luxon 3.7.2 · 2025-09-05 · 32.3M · 16.4k
- decimal.js 10.6.0 · 66.6M · 7.2k · big.js 7.0.1 · 31.1M · 5.2k · dinero.js 2.0.2 · 405k · 6.8k · currency.js 2.0.4 (2021!) · 829k
- uuid 14.0.1 · 247.9M · 15.3k · uuidv7 1.2.1 · 2.2M
- temporal-polyfill 1.0.1 · 2.26M · 739★ · @js-temporal/polyfill 0.5.1 · 1.57M · 783★ (both sub-1k stars)
- vitest 4.1.10 · 2026-07-06 (VoidZero-backed)

## Risks

- Discipline is unenforced by default: one `toLocaleString`/`Intl`/`new Date()` slip reintroduces divergence. Needs ESLint bans + `"lib": ["ES2022"]` with no DOM/Node types.
- Hermes Intl variance can leak into UI formatting parity (five locales) even with a clean domain; PluralRules polyfill adds bundle weight.
- Temporal polyfills on Hermes are unverified and small-community (D-022 flag) — deferring Temporal avoids this entirely.
- On-device smoke harness is bespoke (~a day of work) and can rot if not wired into CI.

## Koi fit

Strong. Privacy: zero-dependency core, nothing phones home. Invariant preservation: integer units + civil-date strings + code-point ordering make invariants bit-identical across engines — better than any library could. Solo maintainability: two mainstream deps (date-fns, uuid), both top-of-class popular (D-022 satisfied); dinero.js/Temporal-polyfill honestly refused for now. Cost: none. The refusal-shaped conclusion: the crown jewel should be *almost dependency-free*; libraries live at the edges.

## Sources

- https://github.com/facebook/hermes/blob/main/doc/IntlAPIs.md (2026-07-19)
- https://caniuse.com/temporal · https://github.com/tc39/proposal-temporal (2026-07-19)
- https://vitest.dev/blog/vitest-4 (2026-07-19)
- registry.npmjs.org + api.npmjs.org (downloads) + api.github.com (stars) (2026-07-19)
- https://github.com/fullcalendar/temporal-polyfill (2026-07-19)
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator (2026-07-19)
- https://github.com/facebook/hermes/issues/915 · https://github.com/nodejs/node/issues/62529 (2026-07-19)
- https://www.sarahdayan.com/blog/dinerojs-v2-is-out (2026-07-19)
- https://reactnative.dev/docs/hermes · https://docs.expo.dev/versions/latest/sdk/crypto/ (2026-07-19)

## Adversarial review (2026-07-19)

**Verdict:** sound-with-fixes
**Corrections:**
- nodejs/node#62529 is closed: `crypto.randomUUIDv7()` merged 2026-04-05, shipped in Node 26.0.0, backported to 24.16.0 LTS; only Node 22 lacks it. Inject-IDs rule stands — Hermes still has no `crypto` (hermes#915 open).
- Safari TP does carry Temporal behind a flag (off by default, caniuse 2026-06); "nothing even in TP" was stale.
- All other claims re-verified 2026-07-20 against primary sources (Hermes Intl doc, TC39, caniuse, npm registry, GitHub, Vitest blog): versions, dates, stars, downloads, RN 0.84 Hermes-V1 default (2026-02-11) / 0.86.0 latest — all hold.

**Missed:**
- Node 22 is *maintenance* LTS; Node 24 is active LTS and Node 26 reaches LTS 2026-10 with unflagged Temporal — server-side "polyfill everywhere" expires within months. Hermes + Safari alone still justify deferring Temporal; conclusion unaffected, baseline wording isn't.
- Unicode-table-dependent ops hide inside "pure ES": `String.prototype.normalize` (the collation rule relies on it), non-locale case mapping, `\p{…}` escapes track each engine's Unicode data. Drift is unlikely (normalization stability policy) but put them in the golden vectors and the Hermes spike.

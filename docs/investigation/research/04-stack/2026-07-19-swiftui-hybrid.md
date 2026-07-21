# SwiftUI-iOS hybrid: keep native iOS, share TS everywhere else — research brief

**Date:** 2026-07-19 · **Phase:** 4 (stack & platform fit) · **Author:** research subagent

**Verdict:** Hybrid is technically sound — PowerSync Swift SDK is GA and `@koi/domain` can run unchanged inside system JavaScriptCore — but it permanently locks in two UI codebases and makes Android effectively never; it is the honest best only if the owner accepts that.

## Findings

**PowerSync Swift SDK.** GA at v1.0.0 on 2025-05-02; latest v1.14.4 on 2026-06-22; ~monthly cadence, repo pushed 2026-07-15 (GitHub releases API, as-of 2026-07-19). Docs feature-status page lists Swift as "GA" (as-of 2026-07-19). v1.14.0 (2026-05-27) was a full pure-Swift rewrite dropping the Kotlin XCFramework wrapper — smaller binary, Xcode debuggability, but 4 patch releases in 4 weeks fixed rewrite regressions (cursor-callback crash, CRUD upload delay loop, `readTransaction` error) (changelog, as-of 2026-07-19). Parity with JS SDKs: watched queries w/ throttle (1.0.0), attachment helpers (since 1.0.0-Beta.12), custom write checkpoints (`CrudBatch.complete(writeCheckpoint:)`, 1.2.0), raw tables (1.3.0), sync streams (1.11.0). Gap: no incremental/differentiated watched queries (JS has them); changelog contains no "incremental" mentions (as-of 2026-07-19). Adoption signals are thin: 59 stars vs 691 for powersync-js; PowerSync's May 2026 changelog showcases Fig/Thunderbolt/Capubridge but no named Swift-SDK production app — unverified beyond the vendor's own use (as-of 2026-07-19).

**Crown jewel (`@koi/domain` on the Swift client).**
- **(a) JavaScriptCore — least-bad, clearly.** System framework since iOS 7, 0 MB app-size cost, first-class Swift API (Apple docs, as-of 2026-07-19). Precedent at scale: React Native ran on system JSC on iOS until Hermes became default (RN 0.70, 2022) (reactnative.dev). No JIT for third-party apps (~7.5x slower on benchmarks, dev.to/Coote 2020) — irrelevant for validating one record against ~100 invariants (ms-scale). Plan: esbuild `@koi/domain` to one IIFE bundle in CI, JSON in/out; `JSContext.isInspectable` enables Safari Web Inspector debugging (iOS 16.4+, WebKit blog 2023-03).- **(b) WASM — reject.** TS does not compile to WASM. Javy (Bytecode Alliance) embeds a QuickJS interpreter in a wasm module, which then needs a wasm runtime on iOS — interpreter-inside-interpreter with niche tooling. Porffor is an explicit pre-1.0 research compiler, ~~"only very limited JS is currently supported"~~ **corrected (review):** "a lot of JS doesn't work yet" (porffor.dev, as-of 2026-07-20). Fails D-022 twice. Hermes standalone embedding is also unsupported outside RN (facebook/hermes #958, as-of 2026-07-19).
- **(c) Dual-port to Swift — reject as ongoing model.** Every one of ~100 invariants implemented twice; each change doubled plus JSON test-vector regeneration; drift risk in decimal/date/rounding semantics between JS numbers and Swift `Decimal`. At 10 h/wk this taxes the scarcest resource forever. Keep shared vectors anyway — run them in Node and in JSC in CI to police the bridge.

**What hybrid buys/costs.** Buys: the capture feel is already shipped (fitted sheets, zoom transitions, keypad, haptics exist in the current app — zero rebuild risk), no RN ceiling risk, native SQLite. Costs: every feature built twice (SwiftUI + web) plus server; i18n catalogs x2 (String Catalogs + web i18n) across 5 locales; a11y parity work x2; no shared client code except domain-via-JSC; Android later = a third full codebase or a late RN rewrite — at 10 h/wk, realistically never.

## Numbers

- powersync-swift: 59 stars, 12 forks, 13 open issues; 14 minor releases in 14 months (as-of 2026-07-19).
- powersync-js npm weekly (week ending 2026-07-18): @powersync/common 86,395; @powersync/web 52,625; @powersync/react-native 27,073.
- Backing: PowerSync is a JourneyApps product (Denver, 10+ yrs old, ~$7.5M raised, last round 2017; no 2025-26 raise found) (Crunchbase via search, as-of 2026-07-19).

## Risks

- Swift SDK is PowerSync's least-adopted client and its pure-Swift core is <2 months old with a visible regression tail.
- The JSC bridge is a bespoke seam only you maintain: bundle/version skew vs server domain version, marshaling bugs, exceptions across the boundary.
- Two quality-bar UI codebases halve feature velocity at 10 h/wk; motivation risk on the web client.
- If Android becomes a hard requirement later, the decision arrives at the most expensive time.

## Koi fit

Privacy: excellent. Invariant preservation: good — literally the same TS runs on client and server, but through a bridge (one notch below a TS-native client). Offline depth: excellent (GA native SDK). Solo maintainability: mixed — Swift is proven for this dev, but two languages/stacks forever. Cost: neutral. Maturity (raised, D-022): weak spot — Swift SDK GA but small-community; needs the D-022 exit plan (credible: data is plain SQLite/Postgres, SDK API mirrors siblings). Honest read: hybrid is the benchmark to beat, not a trap — but choose it only with "Android = never" written into the decision; otherwise an Expo spike that meets the capture-feel bar (Phase 5) should win.

## Sources

- https://github.com/powersync-ja/powersync-swift/releases + GitHub API (2026-07-19)
- https://github.com/powersync-ja/powersync-swift/blob/main/CHANGELOG.md (2026-07-19)
- https://docs.powersync.com/resources/feature-status (2026-07-19)
- https://powersync.com/blog/powersync-changelog-may-2026 (2026-07-19)
- npm downloads API, api.npmjs.org (2026-07-19)
- https://developer.apple.com/documentation/javascriptcore (2026-07-19)
- https://dev.to/alastaircoote/to-jsc-or-not-to-jsc-running-javascript-on-ios-in-2020-44ba (2026-07-19)
- https://reactnative.dev/docs/hermes ; https://github.com/facebook/hermes/issues/958 (2026-07-19)
- https://github.com/bytecodealliance/javy ; https://porffor.dev/ (2026-07-19)
- JourneyApps funding: Crunchbase via web search (2026-07-19)

## Adversarial review (2026-07-19)

**Verdict:** sound-with-fixes
**Corrections:**
- Porffor quote was stale vs porffor.dev — fixed in body; substance (pre-1.0 research compiler) stands.
- All other load-bearing claims re-verified 2026-07-20 (GitHub API, changelog, docs, May-2026 blog): dates, GA statuses, feature versions, incremental/differential watch still JS-only (Web >=1.25.0, RN >=1.23.1, Node >=0.8.1), stars 59/691 exact, Hermes #958, showcase apps. Swift repo now 13 forks/14 issues (daily drift).

**Missed:**
- iOS 26 Liquid Glass redesign (2025): the shipped custom UI (sheets, keypad) needs periodic adaptation to Apple's design churn — "zero rebuild risk" overstates; hybrid's ongoing native upkeep is uncosted.
- Bare `JSContext` has no console/timers/TextEncoder: `@koi/domain` must stay dependency/polyfill-free; the JSC test-vector CI leg needs macOS runners.

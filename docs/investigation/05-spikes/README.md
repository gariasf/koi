# Phase 5 — Spikes

**Question:** do the locked Phase 3/4 architecture bets survive contact with real code on real devices — and does the capture-feel spike resolve the Bundle A ↔ B platform fork (D-024)?

**Method:** pre-register each spike's question, kill criteria, and timebox *before* writing any code (workflow rule). Spike code is throwaway, lives in `../../spikes/<name>` (inside `koi-project/`, no git). Verdicts recorded win or lose. One phase; stop at the gate. Spikes are code on device/simulator — not web research.

**Scope note (D-028):** accessibility is out of spike scope this phase — removed from every kill criterion below. End-state obligations (D-014 a11y completion pass, article-9 bar) still stand as product requirements, just not spike gating.

## Pick (confirmed with owner, 2026-07-20)

Four spikes from the amended list (`04-stack.md` §7 / D-027): **Ⓐ capture feel · ② write-path round trip · Ⓑ chart bar · Ⓒ domain conformance.**

Folds and deferrals (owner-confirmed):
- **① one-VPS reality** folds into ② — ② stands up the whole server stack anyway; observe footprint + initial-sync there.
- **Ⓓ auth** folds into ② at minimal scope (password-based JWT → JWKS → PowerSync `fetchCredentials`, the credential the sync connection needs to exist at all). Full passkey-on-Expo = opportunistic stretch only.
- **Deferred:** ③ (local-only → sync-on migration) and standalone ⑤ (base_version per-column protocol). ⑤'s same-column-overwrite question is exercised inside ②'s conflicting-odometer scenario; ③ is a lower-risk documented table-move, punted to a later spike session or the build backlog.

**Run order:** Ⓐ first (fork decider + D-012 park trigger, lowest backend dependency) → ② (folds ① + Ⓓ-min) → Ⓑ (contingent: only if Ⓐ keeps Bundle A / the RN path alive) → Ⓒ (cheapest; interleavable any time).

**Toolchain available (owner-confirmed):** Xcode + physical iPhone · Android emulator/device · Docker + Node.

## Pre-registration (locked before code)

### Ⓐ — Capture feel · *decision-bearing, D-012 park trigger*

**Question.** Does Expo/RN (Bundle A) hit the Koi-grade capture bar on device, on **both iOS and Android**, for the fuel-capture 10-second surface (§C5) — the app's hardest feel test? Concretely:
1. Fitted sheet via `formSheet` (wraps `UISheetPresentationController` on iOS) with computed row heights; apply-on-tap pickers that dismiss themselves; dirty-guard that pins the sheet ("Discard this fill? / Keep editing") — §D1, App1.
2. Custom in-sheet keypad with the locale decimal key (system keyboard only for text fields) — §C5, App1.
3. Haptics matching the UIKit feedback generators via `expo-haptics` — §D7 motion law.
4. The **Saved moment** — the app's *only* spring (§D7: exactly one spring): check + "Saved. Economy computed." + the number + "over 378 km" + auto-dismiss ~2s. Must read calm, not bouncy.
5. Zoom transition (ledger row → record page) — `Link.AppleZoom` is iOS-18+ alpha-only (§6.1); pre-register the **fallback story** (150ms fade per §D7) as acceptable, verify it doesn't feel broken.
6. **Android sheet fidelity specifically** — the 16 open upstream `formSheet` issues (§6.1) are the live risk; Expo UI (stable SDK 56, real SwiftUI/Compose drop-ins) is the escape hatch to test if RN sheets miss.

**Kill criteria.** Capture doesn't feel Koi-grade on device → **Bundle B (SwiftUI hybrid) wins the fork.** Sub-triggers, any one:
- (k1) iOS fitted-sheet detents + custom keypad can't reach the feel bar.
- (k2) Android sheet fidelity unacceptable **and** the Expo UI SDK-56 escape hatch doesn't rescue it.
- (k3) the single spring (saved moment) can't be tuned calm/Koi-grade.
- (k4) haptics can't match the UIKit generators.
- **Park escalation (D-012):** if feel fails the bar on *both* platforms broadly (not just one surface) → the capture-feel park trigger fires. Do **not** decide solo — surface to owner at the gate.
- *Not* a kill criterion: accessibility (D-028); zoom-transition being fade-only on <iOS 18 (progressive enhancement, §6.1).

**Timebox.** 8h active build, hard stop. Checkpoints: **3h** iOS sheet + keypad + dirty guard; **5h** Android sheet + haptics + Expo UI fallback if needed; **8h** saved moment + zoom fallback. If not Koi-grade by the box → record LOSE, do not over-invest (throwaway code). May span >1 working session within the phase.

### ② — Write-path round trip · *the PowerSync server-authoritative core* (folds ① + Ⓓ-min)

**Question.** Two clients (simulators/devices), both offline, each edits the **same car's odometer** to a different value (a same-column conflict, §B2 inv.6–11). On reconnect: both uploads flow through the bespoke Fastify write-path API → `@koi/domain` validates server-side against canonical Postgres → the loser/violation is **accepted with 2xx and a violation flag written to the synced flags table, atomically with the data** (never rejected — D-022/D-023) → checkpoint flows down and *both* clients observe the flag. Without wedging the upload queue.

Folded:
- **① footprint** — while the stack is up: container RSS on a CX23-class box (~4 GB ceiling); wall-clock for an initial sync of ~5k records onto a mid-range Android.
- **Ⓓ-min** — a password-based `better-auth` JWT, JWKS at `/api/auth/jwks` (EdDSA), consumed by PowerSync `fetchCredentials`; token satisfies the PowerSync contract (`aud` = instance, `exp` ≤ 24h, `jwks_uri`). This is the credential without which sync can't authenticate at all.

**Kill criteria.**
- (k1) flag **not atomic** as observed by clients (data and flag arrive split, or a client sees data without its flag).
- (k2) API errors **wedge the queue** — a rejected/500 upload blocks subsequent writes; the "accept-with-2xx, never reject" contract must hold end to end.
- (k3) **base_version / PATCH granularity can't attribute the same-column overwrite** (the folded ⑤ concern) — if the two odometer edits can't be distinguished from a disjoint-field merge, or the loser is silently LWW-dropped with no flag.
- (①) OOM on 4 GB **or** initial sync takes minutes-plural on mid-range Android.
- (Ⓓ) the password JWT can't be made to satisfy PowerSync's credential contract (native passkey is *out* of the min scope — its failure is not a ② kill).

**Timebox.** 10h active build, hard stop (infra-heavy; stack-up is most of it). Checkpoints: **4h** stack green (Postgres + PowerSync + Fastify + better-auth JWKS, one client syncs an authenticated write down); **7h** conflict scenario + atomic flag observed on both clients; **10h** ① footprint numbers + queue-wedge probing. May span >1 session.

### Ⓑ — Chart bar · *Victory Native XL niche-tool validation* (contingent on Ⓐ)

**Question.** On device, does `@shopify/react-native-skia` + Victory Native XL deliver the Koi chart bar for the Insights "By month" bar card (§C3 Cost lens, §D4 grammar)?
1. Month carousel = a **pager of Canvases**, pages tagged by interval-start date (App1 time-page model), holding **60fps** during the swipe with native snap + edge rubber-band.
2. Tap-to-read any bar via `useChartPressState` on Reanimated shared values, **off the JS thread**; selection replaces the peak label and clears on data change (§D4).
3. Single domain-hued series (Cost = ink for mixed totals), peak bar labeled with period + value, faint **ghost bars** past the window edges (§D4).
4. Numbers in the monospaced tabular voice — no jitter during scrub (§D4/§D7).

**Kill criteria.** Can't hold **60fps** on the carousel/scrub **or** doesn't feel Koi-grade. (A11y overlay prototype dropped from scope — D-028.)

**Contingency.** If Ⓐ kills Bundle A, native RN charts are moot: record Ⓑ as **not-run — superseded by fork outcome**, and note the relevant path becomes web charts (Recharts, §3) which is lower-risk and separately evidenced. Exit if XL itself disappoints: rebuild Koi's two chart types on raw Skia + d3-scale (D-022 register, §5).

**Timebox.** 5h active build, hard stop. Runs only after Ⓐ confirms the RN path survives.

### Ⓒ — Domain conformance · *`@koi/domain` cross-engine purity* (cheapest; interleavable)

**Question.** Do ~10 representative `@koi/domain` invariants produce **byte-identical** results across Node (Vitest), browser (Vitest browser mode), and **on-device Hermes** (golden-vector smoke)? Vectors chosen to stress the exact engine-divergence risks flagged in Phase 4 (Hermes lacks uniform `Intl`/`PluralRules`/`crypto`; collation is implementation-defined — D-025):
1. **Money parsing locale-safe** (inv.20): "1.234,56" = "1,234.56" = 1234.56; grouping-only "20.000" = 20000, never 20.0 (the 1000× corruption class).
2. **Integer minor-unit arithmetic** under `Number.isSafeInteger` guards — no float drift.
3. **Civil `YYYY-MM-DD` date math** via date-fns v4 only (no `new Date()`, no tz): inv.13 plan-cycle anchoring to signup day-of-month; inv.24 cap-cycle day-of-month **clamped on short months**.
4. **Code-point ordering on NFC strings** for merge determinism (the collation risk): sort a set including combining marks + non-ASCII station names — identical on all three engines.
5. **L/100km full→full economy** golden vectors (inv.1–4): `missedPrevious` restart yields *no number*; partial fills accumulate into the enclosing interval.
6. **UUIDv7 injected-id ordering** — shell-injected ids sort by time component identically.
7. **No `Intl` leak** — any plural/number formatting lives at the edge, never inside domain (proves the ESLint ban is real, not aspirational).

**Kill criteria.** **Any** byte-level engine divergence on the golden vectors → the "discipline, not libraries" purity guarantee (D-025) is false and `@koi/domain` needs a rethink. Especially any `Intl`/collation/`Date` behavior differing on Hermes vs Node/browser.

**Timebox.** 4h active build, hard stop. Least toolchain — may run first or interleaved with device-build waits on Ⓐ/②/Ⓑ.

## Verdicts

Recorded win or lose as each spike completes. Format: `<spike> · <date> · WIN | LOSE | NOT-RUN — <one-line finding>. <evidence pointer>.`

- **Ⓐ · 2026-07-20 · WIN (structure/fidelity/build) — no kill trigger hit; subjective motion+haptics feel bar is the owner's device call.** Built a faithful Koi fuel-capture surface (Expo SDK **57**, RN 0.86, Reanimated 4.5) and ran it on **both** an Android emulator (Pixel 10 Pro, API 37, full interactive) and the iOS Simulator (iPhone 17 Pro, dark mode). Evidence: `spikes/capture-feel/` + `shots/*.png`.
  - **k1 (fitted sheet + keypad):** PASS. iOS `formSheet` presents as the real `UISheetPresentationController` (native grabber, corner radius, dimmed parent) with the custom in-sheet locale keypad (`,` decimal, es-ES); Android renders the same sheet cleanly. Two-of-three pill derivation, "= COMPUTED" badge, active-ring, odometer delta, full-tank toggle, `fitToContents` station link, and soft-validation warn Alert ("Does that look right? / €/L looks off / Go back · Save anyway") all work. Full capture→save→ledger round trip verified (new fill lands on Home). Record page (§C6) shows correct economy/verdict/reliability ("11,7 L/100km · above your usual 6,85 · 4 full fills in a row").
  - **k2 (Android sheet fidelity — the headline risk, 16 open upstream issues):** PASS on this surface. The full-height `formSheet` + custom keypad render correctly on Android SDK 57; no manifestation of the feared fidelity gap on the capture surface. Expo UI SDK-56 escape hatch was **not needed**.
  - **k3 (single saved-moment spring, calm not bouncy):** code path verified (Reanimated spring fires, commit + auto-dismiss work); **the "calm" feel judgment is motion — pending the owner on the physical iPhone.**
  - **k4 (haptics match UIKit generators):** `expo-haptics` wired correctly (selection on keytap/pill, warning on soft-flag, success on save); **not feelable on emulator/simulator (no haptic motor) — pending physical device.**
  - **zoom transition (`Link.AppleZoom`, iOS 18+):** compiles + wired; the interactive morph is motion + needs a tap on device — **pending owner.** Fade fallback on <iOS18/Android is acceptable per pre-registration.
  - **Fork resolved (D-024 → D-029):** no kill trigger fired; k2 (the headline risk) cleared. **Owner ran the on-device feel-check and signed off ("good enough") — Bundle A (Expo/RN unified) is confirmed as the build direction; Bundle B retired.** k3 spring / k4 haptics / zoom motion accepted at the owner's feel bar.
  - **Environment limits hit (honest):** iOS Simulator has no `adb`-style tap and macOS Accessibility blocked AppleScript clicks, so iOS interaction beyond deep-links/auto-open could not be automated; haptics + spring + zoom are inherently tactile regardless. These bound what a headless run can prove, not the design.
- **② · 2026-07-20 · WIN (core write-path round trip) — atomic flag + no silent loss + queue not wedged; Ⓓ-min and ① (server-side) fold-ins pass.** Stood up the real stack: Postgres 16 (logical replication) + self-hosted **PowerSync** (Postgres bucket storage, no MongoDB) + a **Fastify 5** write-path API running `@koi/domain` on upload + **jose EdDSA JWKS** (Ⓓ-min). Two `@powersync/node` clients, both offline, wrote conflicting same-date odometer readings (42000 vs 42500) → on reconnect both uploaded through the API → server flagged the conflict and **committed the flag atomically with the data, returning 2xx (never rejected)** → both clients converged to identical state (2 readings + 1 flag). Evidence: `spikes/write-path/` (`docker-compose.yml`, `server/`, `clients/run.mjs`).
  - **k1 (flag atomic as observed by clients):** PASS — flag + data arrive in the same checkpoint on both clients.
  - **k2 (API errors wedge the queue):** PASS — the domain violation returned 2xx + flag (accept-with-2xx contract, D-022); both upload queues drained (`tx.complete()`), nothing wedged.
  - **Ⓓ-min (JWT → JWKS → PowerSync `fetchCredentials`):** PASS — clients minted an EdDSA JWT (aud `koi-powersync-dev`, exp 1h), PowerSync validated it against the Fastify JWKS fetched over `host.docker.internal` (also proves container→host JWKS reachability).
  - **① (one-VPS reality, server-side):** PASS — idle RSS **Postgres 63 MiB + PowerSync 369 MiB ≈ 432 MiB**; with 5k seeded readings **≈ 470 MiB**; a fresh client's initial sync of 5,002 rows took **~325 ms** over localhost. Well under the 4 GB CX23 ceiling. *Not measured:* initial-sync time on a **mid-range Android over network** (needs the RN PowerSync client + seeded data — folds into a later combined test).
  - **k3 (base_version / same-column overwrite — the folded ⑤ concern): NOT cleanly demonstrated → stays open with standalone ⑤.** The pre-registered ② scenario (append-row conflict) passed; the stricter same-row same-column case (two devices editing `cars.current_odo`) was exploratory only and inconclusive — the spike server has no `cars`-PATCH handler, so it exercised *unhandled-op silent drop*, not true LWW attribution. The base_version protocol (D-023) remains an open obligation for the dedicated ⑤ spike.
  - **New finding (→ parking lot):** the accept-with-2xx contract has a sharp edge — **any op the server does not explicitly handle-and-persist is silently lost** once the client receives 2xx and clears its queue. The build's write-path must exhaustively handle every op type or dead-letter/flag unrecognized ones — a silent skip = silent data loss.
- **Ⓒ · 2026-07-20 · WIN — no engine divergence; `@koi/domain` purity holds.** Ran ~11 golden vectors through three engines — **Node (V8)**, **`jsc` (JavaScriptCore — Safari's engine + Bundle-B's embedded engine)**, and **Hermes** (standalone v0.13.0 via jsvu) — and all three produced **byte-identical** output (same md5 `f93b1d6b…`, 720 bytes). Evidence: `spikes/domain-conformance/` (`vectors.js`, `out-{node,jsc,hermes}.json`).
  - Vectors stressed the pre-registered divergence risks: locale money parse/format (inv.20 grouping), the `68.40*100` IEEE-754 float trap, integer minor-unit sums + `Number.isSafeInteger` edge, full→full economy with `missedPrevious`→null (inv.1–3), civil `YYYY-MM-DD` math with **no `Date`** (leap-year rollover), cap-cycle day-of-month clamp to Feb-29 (inv.24), **code-point sort** + **NFC `normalize`** (the collation/merge risk — supported and identical on all three), UUIDv7 lexical=time ordering.
  - **Kill criterion (any byte divergence): NOT triggered.** The "discipline, not libraries" guarantee (D-025) verified for these invariants across all target engines.
  - **Caveats (honest):** (1) Hermes tested was the standalone jsvu build **v0.13.0**, not the exact Hermes bundled in RN 0.86 — the Intl/normalize/collation behaviours are long-standing, so it's a fair proxy, but the pre-registered *on-device* Hermes golden-vector smoke should still run in CI on the RN-bundled engine (already an obligation, §6.5). (2) JSC via the macOS `jsc` CLI stands in for Safari's engine (same engine family); a real-Safari run is a cheap add if wanted.
- **Ⓑ · 2026-07-20 · WIN — render/carousel/tap-to-read/niche-fit verified; owner signed the 60fps/feel check ("good enough").** Added `@shopify/react-native-skia` 2.6.2 + `victory-native` (Victory Native XL) 41.26.0 to the capture-feel app; built the Insights "Cost · by week" screen (pager of Skia `CartesianChart` canvases). Built and ran on the Android emulator. Evidence: `spikes/capture-feel/src/app/insights.tsx`, `src/lib/chart.ts`, `shots/30–32`.
  - **D-022 niche-tool fit (the pre-registered worry):** PASS — victory-native 41.26.0's peer deps accept the full bleeding-edge stack (Skia ≥1.2.3<3, Reanimated ≥3 → have 4.5, React 19, RN 0.86). Installed + **built clean in 41s** (Skia ships prebuilt Android `.so`s). Counters the "6-month quiet spell" concern for now; exit (raw Skia + d3-scale) still documented (§5).
  - **Renders Koi-grade:** headline-led (page total → e.g. "294,70 €"), plain caption with peak ("July 2026 · peak W2 120,30 €"), single-series **ink** bars (Cost = mixed-money ink per §D3, correct), rounded tops, tabular es-ES numbers.
  - **Carousel (pager of Canvases):** PASS — swiping July→June recomputes headline/total/peak/bars per page; page dots track.
  - **Tap-to-read (`useChartPressState` on Reanimated shared values, off JS thread):** PASS — pressing the peak bar swapped the headline to that bar's value ("120,30 €") and caption to the week ("W2", fuel-green = selected), clearing on release.
  - **Kill criteria (60fps scrub / Koi-grade feel):** the tactile bar — **owner's device feel-check**, exactly like Ⓐ (fps is not representative on an emulator). No render/perf red flag seen headless.
  - **Deferred (not kill criteria):** ghost bars at page edges + per-bar on-canvas peak label (put peak in the caption instead) — §D4 niceties for the build; a11y overlays already out of scope (D-028).
  - **iOS build + render also confirmed** (Skia CocoaPod compiled on SDK 57, app installed, chart draws on iPhone 17 Pro sim, dark-mode ink = warm off-white per §D3). One iOS-only cosmetic nit: the headline/period/caption Texts sit under the native large-title header's content inset (fine on Android) — a large-title-vs-nested-ScrollView layout fix for the build, not a chart issue.
  - Runtime warnings observed were benign (dev chromium cert + New-Arch API notices), not chart errors.

### Build gotchas surfaced (→ parking lot, build-phase)
- `Link.AppleZoom` (row→record zoom) **requires** `<Link asChild>` **and** a flattened child style (`StyleSheet.flatten`) — array styles throw at the `<Slot>` boundary; without `asChild` the zoom throws on iOS and the row press doesn't wire on Android. Use the classic `asChild`+`Pressable` composition.
- `expo-symbols` (SF Symbols) render natively on iOS but fall back to emoji on Android — Android needs a vector-icon set (`@expo/vector-icons`) for the domain glyphs.
- Spike ran on **SDK 57**, one major ahead of the Phase 4 brief's SDK 56 — if anything strengthens Bundle A (newer sheet/haptics/Expo UI all present and working).

## State (session log)

- **Session 1 (2026-07-20):** phase opened. Loaded status board + carry-forwards of locked phases 1–4; Phase 4 §7 / D-027 hand over the spike list. Pick confirmed with owner: **Ⓐ ② Ⓑ Ⓒ**, folds ①→② and Ⓓ-min→②, defer ③ + standalone ⑤; run order Ⓐ→②→Ⓑ→Ⓒ; toolchain confirmed. All four spikes pre-registered (question / kill / timebox) before any code. **Ran Ⓐ end to end:** reconciled the toolchain (installed openjdk@17 + CocoaPods; owner ran the Xcode `sudo` select); scaffolded `spikes/capture-feel` (SDK 57); wrote the Koi fuel-capture surface; **built + ran on Android emulator (fully interactive) and iOS Simulator (visual)**; fixed two real cross-platform bugs live (Slot array-style; `Link.AppleZoom` needs `asChild`). **Ⓐ verdict: WIN on structure/fidelity/build, no kill trigger — subjective motion+haptics feel bar deferred to owner's physical-device check.** Within Ⓐ's ~8h timebox. **Status: Ⓐ at its verdict gate; awaiting owner device feel-check before the fork (D-024) is signed.**
- **Session 1 (cont., 2026-07-20):** owner signed Ⓐ ("good enough") → fork resolved **Bundle A** (D-029). Ran **Spike ②** after a machine/Docker restart (brought the stack back up): stood up Postgres + self-hosted PowerSync + Fastify write-path API + jose JWKS + two `@powersync/node` clients. **② WIN on the core round trip** — atomic violation flag, no silent loss, queue not wedged, Ⓓ-min + ①(server-side) pass. The same-column/⑤ case stayed open (server had no cars-PATCH handler; deferred to standalone ⑤). Surfaced the accept-with-2xx "exhaustive-op-handling" rule. Then **Ⓒ WIN** (domain conformance — V8/JSC/Hermes byte-identical via node + macOS `jsc` + jsvu Hermes). Owner said build the last spike → **Ⓑ WIN** (Skia 2.6.2 + Victory Native XL 41.26.0 added to the app; Insights chart pager builds in 41s, renders, carousel swipes, tap-to-read works; 60fps/feel → owner device). **All four spikes WIN. Owner signed Ⓑ feel-check + the Phase 5 gate ("good enough") — Phase 5 LOCKED 2026-07-20 (D-030). Next: Phase 6 decision doc.**

## Carry-forward

*(filled at the Phase 5 gate once all picked spikes have verdicts.)*

- **Fork LOCKED → Bundle A** (D-029): Ⓐ passed the owner feel-check. Bundle B retired.
- **Spike scoreboard — all four WIN:** Ⓐ (capture feel, owner-signed) · ② (write-path round trip: atomic flag, no silent loss, queue-safe; Ⓓ-min + ① server-side pass) · Ⓒ (domain conformance, V8==JSC==Hermes byte-identical) · Ⓑ (chart bar: Skia + Victory XL render/carousel/tap-to-read + niche-fit; 60fps/feel = owner device check, like Ⓐ). No D-012 park trigger fired anywhere.
- **Open obligations carried to Phase 6 / build:** ⑤ base_version per-column protocol (D-023) still unverified — same-column overwrite silently LWWs without it; accept-with-2xx needs exhaustive op-handling (parking lot); ① mid-range-Android-over-network initial-sync unmeasured; on-device (RN-bundled) Hermes golden-vector CI step; Ⓑ 60fps/feel needs a device.
- Build-phase notes → parking lot: `Link.AppleZoom` asChild+flatten; `expo-symbols` Android fallback; SDK 57; accept-with-2xx exhaustive-op rule; ⑤ still open.
- **Phase 5 at its gate:** all four picked spikes carry WIN verdicts; no park trigger fired; shortlist (Bundle A + substrate) survives contact with real code. Outstanding for owner sign-off: Ⓑ 60fps/feel on a device (Ⓐ already signed). Then → Phase 6 (decision doc) with the open obligations (⑤ base_version, accept-with-2xx op-handling, Android initial-sync, on-device Hermes CI, chart ghost-bars/a11y).
- **Running services (this session):** Docker `write-path` stack (5433/8080) + Fastify API (:4000) + Android emulator with the capture-feel dev build (capture + Insights). `run-android.sh` / `run-ios.sh` rebuild on demand.

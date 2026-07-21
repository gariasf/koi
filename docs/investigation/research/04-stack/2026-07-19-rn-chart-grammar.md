# Chart grammar on React Native (Skia, Victory Native XL, alternatives) — research brief

**Date:** 2026-07-19 · **Phase:** 4 (stack & platform fit) · **Author:** research subagent

**Verdict:** Skia + Victory Native XL clears Koi's 60fps/scrub/carousel bar and Skia is top-tier mature, but chart accessibility and Dynamic Type are 100% hand-rolled (overlay views + manual fontScale); web charts go to Recharts, sharing only data-shaping selectors.

## Findings

- **react-native-skia** (@shopify/…): v2.9.0 published 2026-07-16, ~weekly releases, Shopify-backed (npm, 2026-07-19). New Architecture is a given — peer deps RN ≥0.78, React ≥19, Reanimated ≥3.19.1 — and ~~RN 0.86 (June 2026) made bridgeless the default anyway~~ **corrected (review):** New Architecture default since RN 0.76 (Oct 2024); RN 0.86 (2026-06-11) = react-org repo move + Android edge-to-edge + DevTools, no arch change (reactnative.dev).
- **Victory Native XL** = `victory-native` 41.x (40+ is XL; `legacy` dist-tag 37.3.6 = old SVG lib). Latest 41.26.0, 2026-06-09. README: "Nearform is actively working on this project", but the registry shows a ~6-month gap (41.20.2, 2025-11-05 → 41.20.3, 2026-05-11) then a May–June 2026 burst. Small community: 1,203 stars vs Skia's 8,453.
- **Alternatives (2026-07-19):** react-native-gifted-charts (SVG), margelo's react-native-graph (line-only), react-native-wagmi-charts (finance), react-native-chart-kit (SVG, most-starred RN chart lib, no off-JS-thread gesture story) **(added in review)**, @wuba/react-native-echarts (ECharts on Skia — the only one with real web-config sharing, but niche by D-022). None beats XL on Koi's interaction needs; numbers in table.
- **Koi's chart bar is feasible.** XL is built for this: Skia rendering, `useChartPressState` scrub/tap tooltips on Reanimated shared values off the JS thread, "100+ FPS even on low-end devices" (nearform.com, 2026-07-19). Month carousel = pager/FlatList, one Canvas per page. Bar + line + press-to-read are first-class.
- **Accessibility is the hard part.** Skia draws pixels; no accessibility tree inside a Canvas. Docs: Canvas takes View accessibility props (one node, one label); per-element access = "overlaying views on top of your canvas" (issue #1678 closed by documenting this). Strategy: transparent Views positioned from the same d3 scales (`accessibilityLabel` = "March: 142 L, €210") plus a chart-level summary. XL ships zero a11y help — no docs, no props in library code. Nothing like SwiftUI Charts' Audio Graphs. Bespoke work Koi owns forever.
- **Dynamic Type:** Skia text never auto-scales — multiply font sizes by `PixelRatio.getFontScale()` and reflow yourself; XL accepts font objects so scaled sizes plumb through. Known XL bug at max Samsung font scale (issue #185, open).
- **Web:** Skia runs on web via CanvasKit WASM (2.9 MB gzipped), but XL has no supported web story (#223/#563 closed, community workarounds only). 2.9 MB of WASM for two companion-page charts is the wrong trade. **Recommendation:** Recharts on web (SVG/DOM, normal ARIA; see table), with series/aggregation selectors shared in TS — only rendering is duplicated.

## Numbers

| Library | Latest / date | Stars | npm dl/wk | Backing | Cadence |
|---|---|---|---|---|---|
| @shopify/react-native-skia | 2.9.0 · 2026-07-16 | 8,453 | ~1.09M | Shopify | ~weekly |
| victory-native (XL) | 41.26.0 · 2026-06-09 | 1,203 | ~392k | Nearform Commerce | bursty; 6-mo gap Nov'25–May'26 |
| react-native-gifted-charts | pushed 2026-05-20 | 1,357 | ~213k | solo-ish | irregular |
| react-native-graph | pushed 2026-04-16 | 2,582 | ~130k | Margelo | slow |
| react-native-chart-kit | pushed 2026-07-16 | 3,109 | ~129k | community | irregular |
| @wuba/react-native-echarts | 3.1.1 · 2026-07-06 | 962 | ~28k | 58.com | active |
| Recharts (web) | pushed 2026-07-18 | 27,384 | ~49M | community | active |

All figures as of 2026-07-19.

## Risks

- **A11y parity is DIY:** per-datapoint VoiceOver/TalkBack via overlay views is a bespoke subsystem to build and regression-test on both platforms — real hours at 10 h/wk.
- **XL bus factor:** small community, one sponsor, recent 6-month quiet spell. Exit is cheap: XL is a thin layer over Skia + d3-scale; rebuilding Koi's two chart types on raw Skia is days, not weeks.
- **Dynamic Type is manual** in-canvas; max font scale breaks layouts unless reflow is designed in (XL #185).
- **Two chart implementations** (XL native, Recharts web) doubles polish work for the insights surface.
- Skia's fast peer-dep floor forces staying current with RN/Expo.

## Koi fit

Privacy: perfect — local rendering, zero telemetry. Invariants/offline: not implicated (display layer). Solo maintainability: good TS/React ergonomics, but a11y overlays + fontScale reflow are a permanent tax SwiftUI Charts never charged. Cost: free OSS. Maturity (raised, D-022): Skia passes easily; **XL is the niche piece** — justified as the de-facto RN charting standard (highest dl/wk of any RN chart lib) with a cheap documented exit (raw Skia + d3-scale). VoiceOver/TalkBack chart parity must be scoped as a feature, not assumed.

## Sources

- Shopify/react-native-skia: releases, issue #1678, docs (canvas a11y; web 2.9 MB) — 2026-07-19
- npm registry + downloads API; GitHub repos API (stars/activity) — 2026-07-19
- FormidableLabs/victory-native-xl: README, issues #185/#223/#563 — 2026-07-19
- nearform.com/open-source/victory-native; reactnative.dev/blog (0.76, 0.86) — 2026-07-19

## Adversarial review (2026-07-19)

**Verdict:** sound-with-fixes
**Corrections:**
- RN 0.86 never "made bridgeless the default" — New Architecture is default since RN 0.76 (Oct 2024); 0.86 = `react`-org repo move (React Foundation) + edge-to-edge + DevTools. Fixed inline.
- Nothing else: all versions, dates, stars, downloads (exact vs npm's 2026-07-12→18 window, incl. Recharts 49.1M/wk), the XL gap, peer-dep floor, 2.9 MB CanvasKit, issue states (#1678 closed-as-documented; #185 open, Samsung font scale; #223/#563 closed, community workarounds only), and Nearform's "100+ FPS"/"actively working" wording re-verified against npm/GitHub APIs and cited docs (2026-07-19/20).

**Missed:**
- react-native-chart-kit (3,109 stars, most-starred RN chart lib) was skipped despite D-022; added to body and table. SVG, no off-JS-thread gestures — loses on the interaction bar; recommendation unchanged.
- XL has zero accessibility props in library code, only in its example app (repo grep, 2026-07-19) — confirms "zero a11y help".

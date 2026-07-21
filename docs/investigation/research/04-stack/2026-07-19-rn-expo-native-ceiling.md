# Expo/React Native native-feel ceiling + PowerSync RN SDK — research brief

**Date:** 2026-07-19 · **Phase:** 4 (stack & platform fit) · **Author:** research subagent

**Verdict:** RN/Expo in mid-2026 delivers ~90–95% of Koi's client quality bar with a GA PowerSync SDK and TS end-to-end; the last 5% — Android sheet fidelity, zoom transitions, custom CoreHaptics patterns — is alpha-grade, third-party, or hand-built native work.

## Findings

- **Versions.** Expo SDK 57 released 2026-06-30 (RN 0.86, React 19.2); SDK 56 shipped 2026-05-21 (RN 0.85). New Architecture is mandatory ~~since SDK 55 / RN 0.82 (Oct 2025)~~ **corrected (review):** RN-side since 0.82 (2025-10-08), Expo-side since SDK 55 (2026-02-25, RN 0.83). Legacy arch frozen June 2025. RN repo now `react/react-native`.
- **Fitted sheets.** `react-native-screens` 4.x `presentation: "formSheet"` + `sheetAllowedDetents`, exposed via Expo Router modals. iOS wraps `UISheetPresentationController` — genuinely native detents. Android reimplements on `BottomSheetBehavior`: max 3 detents, no native headers/nested stacks inside sheets (documented). ~~Active bug tail: #2560, #2664, #3181, #3203~~ **corrected (review):** all closed-fixed by 2026-01-16; tail churns — 16 formSheet+Android issues open (#4257 crash, #4331 dismiss bypass, July 2026).
- **Zoom transitions.** Expo Router `Link.AppleZoom` (SDK 55+, iOS 18+ only) is an **alpha API**, doc last updated 2026-04-02: incompatible with headers, Stack-only, documented ~1 s delay on rapid gestures. screens maintainers found it "rather buggy even on pure UIKit" (discussion #2885). ~~Open iOS 26 touch-blocking issue (#3621)~~ **corrected (review):** closed-fixed 2026-03-16. Achievable, not dependable yet.
- **Custom numeric keypad.** Pure RN `Pressable` grid + expo-haptics + `TextInput showSoftInputOnFocus={false}`; standard pattern, no blockers found (engineering judgment, unsourced).
- **Haptics.** `expo-haptics` 57.0.1 (docs 2026-06-29) covers all UIKit generators (impact/notification/selection) and 20 Android constants via `performAndroidHapticsAsync`. **No CoreHaptics/AHAP custom patterns** — needs third-party (e.g. candlefinance/haptics) or a bespoke Expo Module in Swift.
- **Dynamic Type / screen readers.** `allowFontScaling` (default true), `maxFontSizeMultiplier`, iOS-only `dynamicTypeRamp` (true UIFontMetrics ramps) per RN docs (2026-07-19) — but the ramp is per-`Text` opt-in; Android scaling stays linear. VoiceOver/TalkBack APIs mature; parity achievable but entirely manual, on-device testing irreplaceable.
- **PowerSync RN SDK.** `@powersync/react-native` 1.35.9 (2026-07-10); ~~GA since 1.0 (2025)~~ **corrected (review):** GA 2023-11-29 (predecessor pkg 1.0.0; renamed 2024); Rust sync client is the only client since 1.35.0 (2026-05-11, changelog-verbatim). Drivers: `@powersync/op-sqlite` (docs-recommended, New-Arch-friendly, SQLCipher) — **still 0.9.15, pre-1.0** — or the `@journeyapps/react-native-quick-sqlite` fork (2.5.2, 2026-04-13). Not Expo Go compatible (needs dev client/prebuild; config plugin handles `use_frameworks!`). All per docs.powersync.com, 2026-07-19.
- **The ceiling.** No credible 2025–26 "we left RN" postmortems found; momentum runs the other way (New Arch default, Expo UI stable in SDK 56: real SwiftUI/Compose drop-ins). Remaining honest gaps: Android sheet fidelity, alpha zoom transitions, no custom haptic patterns, per-Text Dynamic Type opt-in, and anything iOS-26-Liquid-Glass-new arrives late.

## Numbers

(as of 2026-07-19; downloads = npm week 2026-07-12→18)

| Package | Version (date) | Weekly DL | Stars |
|---|---|---|---|
| expo | 57.0.7 (07-17) | 6.29 M | expo/expo 50.7 k |
| react-native | 0.86.0 (06-09) | 9.49 M | react/react-native 126.2 k |
| react-native-screens | 4.26.2 (07-16) | 5.79 M | 3.7 k (Software Mansion) |
| expo-haptics | 57.0.1 | 3.02 M | — |
| @powersync/react-native | 1.35.9 (07-10) | 27.1 k | powersync-js 691 |
| @powersync/op-sqlite | 0.9.15 (07-10) | 18.6 k | — |

Backing: Expo = VC-backed; PowerSync = JourneyApps (Denver; engine years in Fortune 500 field production; spun off 2022). Expo cadence ~2-month SDKs.

## Risks

- Android sheet bug tail and detent parity land on one dev at 10 h/wk.
- Zoom transition is alpha and may churn or break across SDK upgrades.
- PowerSync RN community is small (27 k DL/wk, 691 stars) — niche under D-022; exit plan: data is plain SQLite, sync layer replaceable.
- Recommended driver pre-1.0; ecosystem already migrated drivers once (quick-sqlite → op-sqlite).
- Faster Expo cadence = recurring upgrade tax; custom haptics require writing Swift Expo Modules.

## Koi fit

Privacy: clean (no forced analytics; EAS optional). Invariant preservation: strongest card — `@koi/domain` runs unmodified in the client. Offline depth: GA SDK on SQLite, solid. Solo maintainability: one TS codebase for iOS+Android, but budget real hours for Android sheet polish and accessibility passes. Cost: unchanged. Maturity: RN/Expo massively satisfies D-022; PowerSync RN is the one niche corner. Conclusion: viable — quality bar met-with-asterisks on Android sheets, zoom transitions, haptic richness; not a refusal, not a free lunch.

## Sources

All accessed 2026-07-19/20: expo.dev/changelog/sdk-55, -56, -57 · docs.expo.dev/guides/new-architecture/ · docs.expo.dev/router/advanced/zoom-transition.md · docs.expo.dev/router/advanced/modals/ · docs.expo.dev/versions/v57.0.0/sdk/haptics.md · reactnative.dev/docs/text · reactnative.dev/blog (0.82) · github.com/software-mansion/react-native-screens issues #2560 #2664 #3181 #3203 #3621 #4257 #4331, discussion #2885 · docs.powersync.com/client-sdks/reference/react-native-and-expo · powersync-js CHANGELOG (1.35.0) · powersync.com/company · npm + GitHub APIs (direct)

## Adversarial review (2026-07-19; re-verified 2026-07-20)

**Verdict:** sound-with-fixes
**Corrections:** (all fixed in body, marked)
- Sheet bugs #2560/#2664/#3181/#3203 closed-fixed by 2026-01-16, not active; risk now = 16 open formSheet+Android issues (#4257, #4331).
- Zoom #3621: closed-fixed 2026-03-16, not open.
- PowerSync RN GA was 2023-11-29, not 2025 — maturity understated.
- New-Arch mandate conflated: RN-side 0.82 (2025-10-08), Expo-side SDK 55 (2026-02-25, RN 0.83); flagged first pass, body fixed second.
- Publish dates: react-native 0.86.0 → 06-09; expo 57.0.7 → 07-17; screens 4.26.2 → 07-16.
- Everything else re-verified 2026-07-20 against npm/GitHub APIs and primary docs (counts exact; changelog and #2885 quotes verbatim; no-postmortems negative re-searched) — holds.

**Missed:**
- candlefinance/haptics, the named mitigation, is dormant (last push 2024-11-02, 115 stars) — fails D-022 harder than PowerSync; a bespoke Swift Expo Module is the real path.
- `@powersync/adapter-sql-js` runs in Expo Go per docs, softening dev-loop cost.
- Interactive charts, a named quality-bar item, were never assessed; the RN charting story (Skia-based victory-native etc.) needs its own spike.

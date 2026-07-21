# Expo ecosystem health: maturity, EAS costs, upgrade cadence — research brief

**Date:** 2026-07-19 · **Phase:** 4 (stack & platform fit) · **Author:** research subagent

**Verdict:** Expo is mature, freshly funded, and the mainstream React Native path — viable for Koi at ~EUR 0/mo via local builds + free EAS tier — but a solo 10 h/week dev must budget for the SDK upgrade treadmill (3–4/yr historically, slowing).

## Findings

**Company.** Expo (founded 2015) raised a **$45M Series B on 2026-04-16**, led by Georgian (PRNewswire, accessed 2026-07-19). Monetization is EAS; the framework is open source and free. Team-size data conflicts across trackers — unverifiable. Longevity risk: low-to-moderate. The react-native repo now lives under the `react` GitHub org (redirect verified 2026-07-19) — React-team stewardship, not abandonment.

**Release cadence & upgrade pain (as-of 2026-07-19).** SDK 52 (Nov 2024, RN 0.76) → 53 (Apr 2025, RN 0.79, **New Architecture default**) → 54 (2025-09-10, RN 0.81, precompiled iOS frameworks) → 55 (2026-02-25, RN 0.83, **legacy architecture removed**) → 56 (2026-05-21, RN 0.85, Hermes v1 default) → 57 (~~Jul 2026~~ **corrected (review):** 2026-06-30, RN 0.86, deliberately small — ~~Expo is signaling lighter, faster releases~~ **corrected (review):** Expo is exploring *fewer* breaking majors, with non-breaking RN updates as optional in-between upgrades). That's 3–4 SDKs/year. The New-Arch cliff (SDK 52–55) is behind; new projects start on New Arch. Upgrade one SDK at a time; one production 55→56 migration cites ~2 h (buildmvpfast.com, 2026). **Expo Go was repositioned as an education-only tool** (Expo changelog, May 2026; SDK 55 Go stuck in App Store review) — real projects need development builds, i.e., a local Xcode/Android Studio toolchain from day one.

**EAS pricing (expo.dev/pricing, accessed 2026-07-19).** Free: **15 Android + 15 iOS builds/mo** (low-priority queue, 45-min timeout), EAS Update to 1,000 MAU, 100 GiB bandwidth. Starter $19/mo ($45 build credit, 3,000 MAU); Production $199/mo. Local builds are free and officially supported (`npx expo run:ios|android`, `eas build --local`; docs.expo.dev, 2026-07-19). **A solo dev fits in EUR 0/mo**. Store fees: Apple $99/yr (~EUR 7.6/mo amortized), Google Play $25 one-time; Google's 12-tester/14-day rule applies to new personal accounts.

**OTA.** expo-updates is store-compliant under Apple's interpreted-code clause (§3.3.1(B)) and Google policy: JS-only, no purpose change (Bitrise/Expo policy write-ups, accessed 2026-07-19). **Koi does not need OTA**: local-first, no deadline; EAS Update also inserts a third-party service into the update path (privacy-floor friction). A self-hosted update server (documented protocol) exists if ever wanted. Skip OTA; disable CLI telemetry (`EXPO_NO_TELEMETRY=1`).

## Numbers

| Metric | Value | As-of / source |
|---|---|---|
| Latest SDK | 57 (expo 57.0.7; RN 0.86) | 2026-07-19, npm/expo.dev |
| Cadence | 6 SDKs Nov 2024 → Jun 2026 (~3–4/yr) | changelogs |
| npm weekly: expo / react-native / expo-updates | 6.29M / 9.49M / 2.53M | week ending 2026-07-18, api.npmjs.org |
| GitHub stars: expo/expo / react/react-native / flutter/flutter | 50.7k / 126.2k / 177.8k | 2026-07-19, GitHub API |
| Survey usage | ~~RN 14.5% vs Flutter 13.6% (SO 2025)~~ **corrected (review):** SO 2025 has no mobile-framework section; SO 2024: Flutter 9.4% vs RN 8.4% | 2024, secondary |
| Funding | $45M Series B, Georgian | 2026-04-16 |
| EAS free tier | 15+15 builds/mo, 1k MAU updates | 2026-07-19 |

## Risks

- **Upgrade treadmill:** 3–4 SDKs/yr; store target-API rules force at least annual upgrades. One bad upgrade can eat a month of 10 h/wk budget. Mitigate: minimal native-module footprint, single-step upgrades, `expo-doctor`.
- **Native-module/config-plugin churn:** third-party libs (sheets with detents, charts, keypad) lag SDK/New-Arch releases; prebuild config plugins can break silently. This is the top solo-dev failure mode.
- **EAS pricing drift:** the free tier has changed shape before. Local builds neutralize this.
- **Expo Go gone as a shortcut** (May 2026): dev builds + local toolchains required.
- **Strategic drift toward AI tooling** post-Series B; framework stewardship currently strong — watch.

## Koi fit

Privacy: pass, provided local/self-managed builds, no EAS Update, telemetry off. Invariant preservation: best-in-class — `@koi/domain` pure TS runs natively. Offline depth: PowerSync ships an official React Native/Expo SDK. Solo maintainability: strongest option for a TS-strong dev, minus the upgrade treadmill. Cost: EUR 0/mo Expo + unavoidable store fees — inside the envelope. Maturity/community (D-022, raised weight): Expo is the popular, well-funded, default RN choice; exit plan exists (`prebuild` ejects to a plain RN project). No refusal on ecosystem-health grounds; the binding question is the client quality bar (out of scope here).

## Sources

- https://expo.dev/pricing (2026-07-19)
- https://docs.expo.dev/billing/plans/ (2026-07-19)
- https://docs.expo.dev/build-reference/local-builds/ (2026-07-19)
- https://expo.dev/changelog — SDK 54/55/56/57, "Expo Go and the App Store in May 2026" (2026-07-19)
- https://www.prnewswire.com/news-releases/expo-raises-45m-series-b-and-launches-expo-agent-to-close-the-gap-from-idea-to-production-ready-mobile-apps-302744423.html (2026-07-19)
- https://api.npmjs.org/downloads/point/last-week/{expo,react-native,expo-updates} (2026-07-19)
- https://api.github.com/repos/{expo/expo,react/react-native,flutter/flutter} (2026-07-19)
- https://bitrise.io/blog/post/what-app-stores-allow-with-ota-updates-apple-and-google-policy-explained (2026-07-19)
- https://developer.apple.com/programs/whats-included/ ; https://support.google.com/googleplay/android-developer/answer/6112435 (2026-07-19)
- https://www.buildmvpfast.com/blog/expo-sdk-56-migration-faster-ios-builds-expo-router-2026 (2026-07-19)

## Adversarial review (2026-07-19)

**Verdict:** sound-with-fixes
**Corrections:**
- SDK 57 shipped 2026-06-30, not "Jul 2026" (fixed in body).
- Survey row: SO 2025 has no mobile-framework category (survey.stackoverflow.co/2025/technology, checked); nearest is SO 2024: Flutter 9.4% vs RN 8.4% — Flutter led (fixed in body).
- SDK 57 signals *fewer* breaking majors (optional non-breaking RN updates in between), not "lighter, faster releases" (fixed in body) — eases the treadmill risk.

All other load-bearing claims (Series B, SDK 55–57 dates + RN 0.83/0.85/0.86, legacy-arch removal in 55, Hermes v1 default in 56, EAS tiers, stars, npm, react-org move, Expo Go status incl. SDK 55 Go still unapproved, @powersync/react-native) re-verified against primary sources; all match.

**Missed:**
- Hermes v1 + reanimated memory regression: +25–30% app memory, confirmed in the SDK 57 changelog (since SDK 56; workaround: worklets bundle mode). Koi's charts make reanimated near-certain — track before committing.
- The ~2 h 55→56 migration figure is one anecdotal blog post — best-case, not typical.
- Apple §3.3.1(B) "revised Oct 2025" was unverifiable — dropped from body; moot, brief skips OTA.

Recommendation follows under D-022; prebuild eject is a credible exit plan.

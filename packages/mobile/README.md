# @koi/mobile — skeleton

Becomes the Expo/React Native app (iOS + Android from one codebase — Bundle A,
D-024/D-029). Not scaffolded yet; first steps live on the build board (bucket D/H):

- Pin the Expo SDK and re-confirm the SDK-sensitive Phase-4 claims before relying on
  them (spike ran SDK 57; evidence base was SDK 56).
- Capture surface + Insights chart seed: `../../../spikes/capture-feel/src`
  (Ⓐ/Ⓑ-validated) — mine, don't copy blindly; spike code is never git-added.
- Owns the on-device (RN-bundled) Hermes golden-vector CI step owed from Spike Ⓒ.
- Known gotchas already boarded: `Link.AppleZoom` needs `asChild` + flattened style;
  `expo-symbols` falls back to emoji on Android; iOS large-title vs nested-ScrollView
  content inset.

Ops stance (D-025): local builds, no OTA/EAS Update, `EXPO_NO_TELEMETRY=1`,
~6-month SDK upgrade windows.

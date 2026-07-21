# Parking lot

Ideas that surfaced off-phase. Reviewed at every gate: promoted into a phase, or left here. Nothing in this file blocks anything.

Format: `- <date> · <idea> (surfaced during: <phase/session>)`

---

- 2026-07-17 · If the session ritual gets tedious to restate, package it as a small Claude Code skill (e.g. `/phase`) living in `koi-project/.claude/` — revisit after a few phase sessions show what's repetitive. (surfaced during: workflow setup)
- 2026-07-17 · Investigation docs have no version control until the git-init at build phase — acceptable risk per owner; consider occasional zip snapshot if phases start superseding each other heavily. (surfaced during: workflow setup)
- 2026-07-17 · Accountless web viewer: open a Koi JSON export in the web app as a read-only, no-sync, no-account ledger/Insights viewer — would extend the local-only floor to web. Cheap on top of the web client; not a requirement. (surfaced during: Phase 2)
- 2026-07-17 · Export nudge as backup hygiene: at rung 1 (E2EE, no recovery), a rare, quiet "it's been a while since your last export" could backstop passphrase loss — tension with calm surface; design-track question. (surfaced during: Phase 2)
- 2026-07-17 · Relay metadata hardening: blind relay still sees IPs, write timing, envelope/blob sizes — padding (PADMÉ for blobs), size bucketing, Tor guidance are post-decision hardening, not v1 scope. (surfaced during: Phase 3)
- 2026-07-17 · Household sharing crypto details: member revocation under a shared key means re-encrypting the log to a new key; SharedOwner same-id cross-owner semantics unverified in Evolu. Extension path exists (S-14 holds); details are a later phase. (surfaced during: Phase 3)
- 2026-07-17 · Web key-custody UX: Safari ITP evicts IndexedDB/keys after ~7 idle days → silent unpair, mnemonic re-entry or phone-QR re-pair; camera-less desktops need typed-mnemonic fallback. Phase 4 / design-track. (surfaced during: Phase 3)
- 2026-07-17 · Blob channel GC: document deletion should hard-delete ciphertext after a grace window (heals inv. 30 for the most sensitive class); undo after grace = resurrect-with-re-upload or metadata-only row — semantics to design. (surfaced during: Phase 3; partially moot at rung 3 — server can hard-delete — but grace-window undo semantics still to design)
- 2026-07-19 · Per-field E2EE envelope on PowerSync (rung ~2 upgrade path): documented pattern, priced in the design; cannibalizes server-side validation. Revisit only on explicit rung re-raise at a gate. (surfaced during: Phase 3 gate)
- 2026-07-20 · Expo UI (stable SDK 56): real SwiftUI/Jetpack Compose components as RN drop-ins — potential escape hatch if specific surfaces (sheets?) miss the bar inside Bundle A without falling back to Bundle B. Watch maturity. (surfaced during: Phase 4)
- 2026-07-20 · Self-hosted expo-updates server protocol exists — only relevant if OTA ever becomes wanted; current stance is skip OTA entirely. (surfaced during: Phase 4)
- 2026-07-20 · Accountless web viewer (parked 2026-07-17) got cheaper: web frame is now a static Vite SPA — a "open JSON export read-only" mode is a natural fit. Still not a requirement. (surfaced during: Phase 4)
- 2026-07-20 · i18next docs tentatively plan dropping type-level string-key support in v27 — if adopted, migrate to Selector API early rather than late. (surfaced during: Phase 4 verify pass)
- 2026-07-20 · Temporal API revisit ~2027 (when Safari + Node LTS ship it) — replaces civil-date-string discipline in `@koi/domain` only if a migration is actually worth it then. (surfaced during: Phase 4)
- 2026-07-20 · Chart a11y overlay subsystem (per-datapoint VoiceOver/TalkBack on Skia via transparent views from d3 scales) + in-canvas fontScale/reflow plumbing — deferred build-phase work per D-028; design notes in `research/04-stack/2026-07-19-rn-chart-grammar.md`. (surfaced during: Phase 4 gate)
- 2026-07-20 · Build-phase impl note (from Spike Ⓐ): expo-router 57 `Link.AppleZoom` (row→record zoom) requires `<Link asChild>` + a flattened child style (`StyleSheet.flatten`); array styles throw at the `<Slot>` boundary and without `asChild` the row press doesn't wire on Android. Use classic `asChild`+`Pressable`. (surfaced during: Phase 5 Ⓐ)
- 2026-07-20 · Build-phase impl note (from Spike Ⓐ): `expo-symbols` (SF Symbols) render natively on iOS but fall back to emoji on Android — Android domain glyphs need `@expo/vector-icons` (or bundled SVGs). (surfaced during: Phase 5 Ⓐ)
- 2026-07-20 · Spike Ⓐ ran on Expo **SDK 57** (one major ahead of the Phase 4 SDK-56 evidence). Re-confirm any SDK-version-sensitive Phase 4 claims (Expo UI, formSheet issue count, New-Arch state) against 57 before build. (surfaced during: Phase 5 Ⓐ)
- 2026-07-20 · Headless spike limitation: iOS Simulator has no scriptable tap and macOS Accessibility blocked AppleScript clicks (`-25204`) — automated iOS interaction was limited to deep-links/auto-open. If future spikes need scripted iOS UI driving, install `idb` or grant Accessibility to the terminal. (surfaced during: Phase 5 Ⓐ)
- 2026-07-20 · Build-phase safety rule (from Spike ②): the "accept-with-2xx, never reject" write-path contract (D-022) silently loses any op the server does not explicitly handle-and-persist — the client clears its queue on 2xx. The write-path API must exhaustively handle every op/table it can receive, and dead-letter/flag unrecognized ops rather than skip them. (surfaced during: Phase 5 ②)
- 2026-07-20 · Spike ② left the standalone ⑤ (base_version per-column protocol, D-023) genuinely open: the append-row conflict flags correctly, but same-row same-column overwrites (e.g. two devices editing `cars.current_odo`) are not attributed/flagged without base_version — silent LWW. Needs the dedicated ⑤ spike before build. (surfaced during: Phase 5 ②)
- 2026-07-20 · Build-phase impl note (from Spike Ⓑ): on iOS, headline/caption Text above a native large-title header's nested horizontal ScrollView lands under the large-title content inset (renders fine on Android). Set `contentInsetAdjustmentBehavior`/scroll-edge handling, or don't use `headerLargeTitle` on chart pages. §D4 ghost bars + on-canvas peak label also deferred from the Ⓑ spike. (surfaced during: Phase 5 Ⓑ)

---

## Phase 6 gate review (2026-07-20) — final disposition

Triaged in full at the investigation-closing gate; see `06-decision.md` §6. The lot **retires at build start** (pending owner sign-off, D-035). Recorded here so nothing is lost:

- **Promoted → build backlog** (`06-decision.md` §4): Safari-ITP web key-custody recovery UX (§4.D) · blob-channel GC grace-window undo (§4.H, refines S-6/S-7) · i18next v27 Selector-API watch (§4.C) · chart a11y overlay + fontScale (§4.G) · `Link.AppleZoom` asChild+flatten (§4.D) · `expo-symbols` Android fallback (§4.D) · SDK-57 re-confirmation (§4.H) · `idb`/Accessibility for scripted iOS UI (§4.H) · accept-with-2xx exhaustive-op rule (§4.A) · ⑤ base_version open (§4.A) · Ⓑ iOS large-title inset + ghost bars (§4.D).
- **Left parked** (design-track / watch, not committed): accountless web viewer (both notes) · per-field E2EE upgrade path · Expo UI drop-in escape hatch · self-hosted expo-updates OTA · Temporal API revisit ~2027.
- **Now moot** (superseded): `/phase` ritual skill (investigation closes) · zip-snapshot of docs (git-init supplies VC) · export-nudge backup hygiene (rung-1 passphrase-loss premise gone) · relay metadata hardening (no blind relay at rung 3) · household-sharing crypto details (Evolu refused, no shared-key E2EE — household sharing itself survives as a D-007 extension).
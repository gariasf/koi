# @koi/mobile

The Expo / React Native app — iOS and Android from one codebase (Bundle A,
D-024/D-029), with `@koi/domain` running unmodified on the device. Pinned to
**Expo SDK 57 (`expo ~57.0.8`) = React Native 0.86 + React 19.2.3** (D-048);
companion versions come from Expo's own `bundledNativeModules.json`, not
npm-latest, so `expo-doctor` stays at 20/20.

The app surface is built to the visual design (`docs/build/design/`) for
everything the schema supports (Session 8, D-060..D-064): the token layer and both
authored palettes behind `useKoiTheme()`, the control language, the four-tab shell
with per-tab stacks and an app-level toast host, Garage · car page · car form,
Home's state machine, Settings + Sync, and capture → Odometer. What is **not**
here is gated on tables rather than on architecture: History, Insights' four
lenses, record pages, reminders, the vault, onboarding and the other five capture
sheets all need the §B1 record kinds, which do not exist yet.

Where the schema cannot support a figure, the surface **withholds** it rather than
printing a zero — Home's month pulse shows distance and neither money nor €/km,
because a `0,00 €` would claim a real sum of records Koi cannot yet be told about.
`docs/build/spec-delta.md` lists every such departure with the rule it follows.

## What is load-bearing here

**The client half of the sync contracts** (`src/sync/`, `src/data/`). The server
enforces these and its conflict analysis depends on the client keeping them:

- `trackPrevious` ON, `record_version` as a column, and **no `deleted_at`
  column** — under bucket-filter (D-046) a delete arrives as a checkpoint
  row-removal, so there is nothing to filter and no tombstone on the device.
- A delete is a **SQL DELETE**; an undo is a **re-INSERT of the row the toast
  closure captured** (inv.31 / D-040), never an `UPDATE deleted_at`.
- Deleting a car sends **per-child DELETEs first, then the car's own, in ONE
  client transaction** (D-041). A car has no undo (inv.30) and its confirmation
  is typed.
- The connector **throws on non-2xx** so PowerSync retries: the server accepts
  with 2xx and flags what it cannot apply, so a non-2xx is infra, and swallowing
  it would discard a real write.

**The S-4 review queue** (`src/review/`, `src/screens/review-*.tsx`) renders every flag kind
the write-path can raise and lets the user resolve each one — nothing is repaired
automatically, and no action is offered that the architecture cannot deliver
(D-047). `resolved_at` is the one field a client writes on a flag.

**`@koi/domain` is wired in unchanged.** The car page derives the current
odometer through `deriveCurrentOdometerKm` (S-3: no stored `current_odo`
anywhere) and the odometer sheet validates a new reading with
`checkOdometerReading` — the same pure function the server runs on upload. Numbers
reach the screen only through `@koi/i18n` (`useFormat()`), never through
`toLocaleString`: `Intl` drops the separator on four-digit values (D-064).

**The UI layer** is `src/ui/`: `tokens.ts` (every hex from the design, nothing
invented) · `theme.tsx` (`useKoiTheme()` — scheme, reduce-motion, font scale) ·
`controls.tsx` (the control language) · `icons.tsx` (the eight wells) ·
`toast.tsx` (app-level, with the undo-closure queue) · `sheet.tsx` (sheet chrome +
the dirty guard) · `keypad.tsx` · `swipe.tsx`. Screen bodies live in
`src/screens/` and the files under `app/` are one-line re-exports, which is what
lets one destination be registered in more than one tab's stack.

## Proving it

```sh
pnpm --filter @koi/mobile test        # unit tier: the review policy + copy layer
pnpm --filter @koi/mobile test:sync   # the APP's modules against a real stack (owns :4000/:5433/:8080)
```

`test:sync` runs the nine-scenario suite in `src/selftest/scenarios.ts` under
Node with `@powersync/node`. The **same module** runs on a device from the
self-test screen, which is the point: one set of scenarios, two runtimes, no
re-implementation that could be right while the app is wrong.

```sh
# on the simulator — real Hermes, real op-sqlite, real PowerSync RN SDK
cd infra && docker compose -p koi up -d --wait postgres
pnpm --filter @koi/server db:migrate && docker compose -p koi up -d powersync
pnpm --filter @koi/server dev      # :4000 — better-auth mounted, no KOI_DEV_AUTH (gone, D-038)

EXPO_NO_TELEMETRY=1 pnpm --filter @koi/mobile exec expo prebuild --platform ios
EXPO_NO_TELEMETRY=1 EXPO_PUBLIC_KOI_SELFTEST=1 \
  pnpm --filter @koi/mobile exec expo run:ios --device "iPhone 17 Pro"
```

`EXPO_PUBLIC_KOI_SELFTEST=1` sends the app straight to the scenarios on launch,
so a screenshot of a launched app is the evidence. Without it that screen refuses
to run: it writes and deletes real records. **Since Build Session 6 the
self-test screen also needs a real session**: `runS6Scenarios`'s peer writes
(`ctx.peer`, `uploadAsPeer`) authenticate through whatever session the app
itself is signed into (`src/auth/client.ts`'s `getSessionCookie`), so "Turn on
sync" — which now registers or signs in with a passkey first (`src/auth/flow.ts`)
— has to succeed once before the scenarios can run. `sync-tests/`'s own copy of
these scenarios sidesteps this with a test-only session bootstrap
(`test-auth.ts`, mirroring `@koi/server`'s `auth/test-bootstrap.ts`) instead of
a real passkey ceremony — no WebAuthn authenticator exists in a headless test
process.

The second device in those races is a direct `POST /upload` with a different
`deviceId` — not a shortcut around the protocol but the protocol itself,
indistinguishable server-side from another phone.

## Testing passkeys locally (Build Session 6, D-055)

Native WebAuthn needs a **resolvable domain** with a real
`/.well-known/apple-app-site-association` over TLS — a placeholder domain builds
and signs fine, then fails at ceremony time with an opaque
`ASAuthorizationError 1004`. Associated Domains also needs a **paid** Apple
Developer account (a free Personal Team cannot add the capability at all).

The local-override recipe that works, with no public DNS and no router changes:

```sh
# 1. entitlement already carries ?mode=developer (app.json ios.associatedDomains)
sudo swcutil developer-mode -e true                       # trust dev-mode AASA
echo "127.0.0.1 koi-dev.gariasf.com" | sudo tee -a /etc/hosts

# 2. self-signed cert for that domain, trusted INSIDE the simulator
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 \
  -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/CN=koi-dev.gariasf.com" -addext "subjectAltName=DNS:koi-dev.gariasf.com"
xcrun simctl keychain booted add-root-cert cert.pem

# 3. serve the AASA on :443 (needs sudo for the privileged port).
#    Body: {"applinks":{"apps":[],"details":[]},
#           "webcredentials":{"apps":["<TEAMID>.tv.titanos.koi"]}}
#    <TEAMID> is what the FAILURE LOG names, not necessarily the id on your
#    keychain certificate — read it from:
#      xcrun simctl spawn booted log show --last 5m \
#        --predicate 'eventMessage CONTAINS "is not associated with domain"'

# 4. server must use the same rpID
AUTH_RP_ID=koi-dev.gariasf.com pnpm --filter @koi/server dev
```

`swcd` accepts the self-signed cert in developer mode (its log shows
`TLS handshake complete` → `status 200`). A stale association is cached, so
after changing the AASA, **reinstall the app** to force a re-fetch. To start
from a truly clean slate (orphaned passkeys accumulate in the simulator
keychain across failed attempts and make the sign-in picker ambiguous):
`xcrun simctl keychain booted reset` — then re-add the root cert, and clear the
server side with `DELETE FROM session; DELETE FROM passkey; DELETE FROM
recovery_code;`.

**First-time setup shows two Face ID prompts** (register, then authenticate):
better-auth creates a session only on the authentication path, so registration
alone leaves you with a passkey and no session. A returning device shows one.

## The RN-bundled Hermes vectors

```sh
pnpm --filter @koi/domain conformance                     # builds the bundle, checks V8
KOI_RN_HERMES_BIN=/path/to/hermes node scripts/rn-hermes-conformance.mjs
```

CI's `conformance-rn-hermes` job builds that VM from the exact `facebook/hermes`
tag the installed react-native pins, asserts compiler identity and bytecode
version, and runs the golden vectors twice — from source and as bytecode from
RN's own `hermesc` (D-050). The jsvu Hermes in the other job is **not** this
engine: it is HBC 96 against RN's 98.

## Ops stance (D-025 / D-048)

Local builds only. No EAS, no OTA — `expo-updates` is not installed. `ios/` and
`android/` are generated by `expo prebuild` and gitignored (CNG), so a clean
checkout regenerates them. `EXPO_NO_TELEMETRY=1` is the live switch
(`DO_NOT_TRACK` is a no-op for Expo). No `metro.config.js` and no
`babel.config.js`: SDK 57 derives the monorepo watch folders and injects the
worklets plugin itself, and hand-written monorepo boilerplate is now an
anti-pattern. pnpm's isolated `node_modules` works — `nodeLinker: hoisted` is not
needed, despite both Expo's and PowerSync's own guidance reaching for it.

## Known gaps in this build

- **Light mode only.** Dark mode is co-primary in the spec (§D3 — authored, never
  an inversion pass); this scaffold ships the light pair. The real palette work
  belongs with the app surface.
- **Android unverified this session** — no JDK on the dev machine. iOS was built
  and run; the Gradle path is owed before Bundle A's "one codebase" claim is
  fully earned.
- **The boarded Expo gotchas are still owed** in real UI: `Link.AppleZoom` needs
  `<Link asChild>` and a flattened child style (an array style there is a hard
  dev error, not a warning), and `expo-symbols` needs the object form of `name`
  plus a fallback or Android renders nothing. Neither is used yet.
- The capture surface + chart seeds in `../../../spikes/capture-feel/src` are
  still unmined; spike code is never git-added.
- a11y is deprioritised near-term (D-028); the end-state pass (D-014) stands.

# Next session kickoff — Session 6: better-auth passkey-primary, full round-trip

Paste the block below to start Session 6, **after** signing off Session 5 at the gate.
Working-memory artifact; refresh or delete it once Session 6 is underway.

---

Build phase, Session 6. Repo: ~/Documents/gariasf/koi, remote github.com/gariasf/koi.
Sessions 1–5 done: `@koi/domain` live and untouchable (vectors md5 f93b1d6b…, now proven on the
Hermes RN ships too — D-050); the sync server complete for cars + odometer_readings (⑤ base_version
D-037, exhaustive op-handling D-038, the full S-6 delete model D-039..D-046 with bucket-filter); the
client exists — `@koi/mobile` on Expo SDK 57 / RN 0.86 (D-048) with the PowerSync client honouring
the whole S-6 contract (D-049) and the S-4 review queue + `resolved_at` latch (D-047); and **③
local-only → sync-on is done** (D-052) — sync is strictly opt-in, off by default, zero network calls
until the user turns it on, and the existing backlog drains through the ordinary base_version path
with no migration write path at all. Three sync tiers are green in CI against a real stack: the
server's 13 scenarios, the app's own 9, and 3 more proving the local-only→sync-on drain.

**Everything up to here has run on `KOI_DEV_AUTH=1`** — a credential-less dev token mint
(`packages/server/src/auth.ts`, `createAuthShim`) that mints/verifies EdDSA JWTs via `jose`,
deliberately built to the exact contract better-auth's JWT plugin will serve (`aud` = configured
audience, `exp` ≤ 24 h, `kid` resolvable via `jwks_uri`) — "swapping it in later changes the issuer,
not the contract" (see the file's own header comment). This session does that swap, for real, with a
real passkey.

Read first: koi/CLAUDE.md (ritual + ground rules), docs/build/BOARD.md (Now/Next, bucket B), then:
decisions.md D-032 (architecture LOCKED), D-025 (better-auth in the shared substrate: JWT plugin,
JWKS → PowerSync, passkey-primary + password + recovery codes, no email dependency), D-038 (the dev
mint's exact gate: `KOI_DEV_AUTH=1`, dies with better-auth), docs/investigation/04-stack.md §2 "Auth"
row + §6.4 ("better-auth native passkeys in Expo unverified — password-first fallback on mobile if
spike fails") — that spike (Ⓓ) was folded opportunistically into earlier phases and never fully run
standalone, so treat native-passkey-on-Expo as **unproven**, not merely unbuilt. `packages/server/
src/auth.ts` and `src/app.ts` (the two routes this replaces: `GET /api/auth/jwks`, `POST
/api/auth/token`), `packages/mobile/src/sync/connector.ts` (`KoiConnector.mintToken` — the one place
the client asks for a token), koi-core-spec.md §C8 (Settings — no login/account UI specified there
today; this session decides where auth surfaces, see below) and §A's constitution article on the
privacy floor. Architecture is LOCKED — build, don't relitigate.

This session wires real auth end-to-end. Goals, in order:

1. **Mount better-auth in `@koi/server`**, in-process (D-025), Postgres-backed (its own tables,
   migrated alongside the existing schema — better-auth ships a CLI/adapter for this; check whether
   it plays cleanly with the existing Drizzle-owned migration flow or needs its own step, and record
   whichever way it landed). Configure the JWT plugin: EdDSA, `aud`/`iss` matching what `PowerSync`
   already expects (`packages/server/src/env.ts`'s `JWT_AUDIENCE`/`JWT_ISSUER`), `exp` ≤ 24 h,
   `GET /api/auth/jwks` served by better-auth itself (replaces the hand-rolled one in `auth.ts`).
2. **Passkey-primary + recovery codes, no email.** Wire better-auth's passkey plugin (WebAuthn) as
   the primary credential and its recovery-codes plugin as the fallback — no password, no email
   dependency (D-025's explicit constraint: "no email dependency, EUR 0"). Decide and record: is
   there a single owner account (this is a single-tenant, single-household server — D-023's
   settings-singleton pattern already treats it that way) or a real multi-user table from day one?
   Lean toward the simplest thing that doesn't foreclose S-14 sharing later, matching how
   `household_id`/`updated_by` were seeded in migration 0000.
3. **The client passkey round-trip, from `@koi/mobile` on the iOS simulator.** This is the genuinely
   unverified part (Ⓓ's own kill criterion: "native passkey dead-ends AND password flow also fights
   the SDK"). Register a passkey (Simulator supports WebAuthn via associated domains + an iCloud
   Keychain-backed passkey provider — confirm the exact Expo-side plugin/config needed, likely
   `expo-passkey` or a bare WebAuthn bridge; there may be no mature Expo module and a small native
   module could be required — if so, treat it as a niche-tool decision per D-022's register, with an
   exit plan, not a silent addition), sign in, and get a real JWT back that
   `KoiConnector.fetchCredentials` hands to PowerSync. **If native passkey dead-ends on Expo (the
   documented kill condition):** fall back to better-auth's password flow for now, record the
   dead-end explicitly (what was tried, where it broke) rather than quietly shipping password-only,
   and open a decision entry either reaffirming passkey-primary as a later retry or amending the
   stance — do not silently downgrade the product promise.
4. **Retire the dev mint.** Once the real flow works, `KOI_DEV_AUTH` and `createAuthShim` are dead
   code — delete them (D-038's own words: "the dev token mint... dies with better-auth"). Update
   `packages/server/README.md` and `CLAUDE.md`'s command block, which currently document
   `KOI_DEV_AUTH=1`.
5. **Recovery codes flow, at least headless-provable.** Generate codes at passkey registration,
   prove a recovery-code sign-in works (server-side test is enough if the client UI for entering a
   recovery code doesn't exist yet — state plainly what's built vs stubbed).
6. **Re-prove all three sync tiers under real auth.** The server's 13 scenarios, the app's 9, and
   the 3 local-first ones all currently mint dev tokens via `KOI_DEV_AUTH=1`'s route. Once that route
   is gone, their harnesses (`packages/server/sync-tests/helpers.ts`'s `TestConnector`,
   `packages/mobile/src/sync/connector.ts`'s `KoiConnector`) need a real (or realistically-faked)
   auth path to keep running in CI headlessly — decide how (a fixed test passkey/credential seeded
   in the test stack? a service-account style mint scoped to test envs only, explicitly NOT reachable
   in production?) and make sure whichever you pick cannot regress into "network reachable without
   better-auth hands out tokens" (the exact hole `KOI_DEV_AUTH` was gated against, D-038).
7. **Settings surface note, minimal.** §C8 doesn't currently describe a login/account screen (the
   product has always been "no account" by default, D-006). Since sync now requires a real
   identity, decide where sign-in-with-passkey happens in the flow relative to the Session 5 sync
   toggle (`app/index.tsx`'s "Turn on sync" — does tapping it now trigger passkey registration
   inline, or is there a separate auth step first?) and record it in spec-delta.md; this is product
   surface, not a decision to make silently.

Do NOT start: S-7 erase-everywhere, the archive write flow, the web companion, the privacy-page
rewrite (still its own release-gated, owner-reviewed task — note that once auth is real, the
privacy-page's "no account" framing needs revisiting there, but that rewrite itself stays out of
scope here), income tracking, the §C app surface / charts (bucket D). `@koi/domain` stays untouched.
Popular tools preferred (niche ones — e.g. any passkey bridge module — keep an exit plan per D-022);
telemetry off. Commits authored as owner only — no co-author trailer. Update BOARD.md + session log
+ decisions.md before ending. Stop for owner review before starting the app surface (bucket D) or
S-7.

## Also outstanding (not this session unless the owner says so)

- **Android build path is unverified** — no JDK on the dev machine. Bundle A's "one codebase" claim
  needs one Gradle run plus the Android-over-network initial-sync measurement (bucket B).
- **A device/emulator golden-vector run** is the narrow remainder of Ⓒ: the per-OS Unicode provider
  (`normalize('NFC')`) is the one thing D-050's host build cannot cover.
- **build-ops/test-integrity review lenses never ran** (Session 4's adversarial review hit a token
  quota) — a narrower follow-up pass on CI correctness + test-integrity is owed.
- **Scripted iOS UI is still blocked** — no Accessibility grant for `osascript`/System Events, no
  `idb`, no Maestro (bucket H). Worth resolving before Session 6 needs to prove a real passkey tap
  on-device rather than describing it.
- The capture-feel spike seed is still unmined; `spikes/` deletes once it is.

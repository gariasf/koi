# Next session kickoff — Session 4: scaffold @koi/mobile → S-4 review queue

Paste the block below to start Session 4. (Working-memory artifact; refresh or delete it
once Session 4 is underway.)

---

Build phase, Session 4. Repo live: ~/Documents/gariasf/koi, remote github.com/gariasf/koi,
CI green (conformance + checks + sync-tests torture tier). Sessions 1–3 done and gated:
@koi/domain live (vectors md5 f93b1d6b…, untouchable); sync SERVER complete for cars +
odometer_readings — ⑤ base_version per-column protocol (D-037), exhaustive op-handling +
dead-letters (D-038), and the full S-6 delete model (D-039..D-046: tombstones, same-device
undo resurrection, atomic cascade, late-child, edit-vs-delete, retryable-error handling)
all proven on two @powersync/node clients (13-scenario torture tier). Tombstone sync uses
**bucket-filter** (D-046): buckets carry only live rows (`WHERE deleted_at IS NULL`), a
delete is a checkpoint row-removal, clients hold NO deleted_at column. There is still NO
client app — every client-facing blocker is gated on that.

Read first: koi/CLAUDE.md (ritual + ground rules), docs/build/BOARD.md (Now/Next + buckets
D and H), then: decisions.md D-032 (architecture LOCKED), D-037/D-038 (protocol as built),
D-039..D-046 (delete model + bucket-filter), packages/server/README.md (the protocol + delete
model in two paragraphs), docs/build/spec-delta.md (bucket-filter + deferred items),
docs/investigation/04-stack.md (Bundle A / Expo stack + niche-tool exit plans), and
koi-core-spec.md §D (the app surface: capture, ledger, record, Insights) + §B2 inv.31/inv.30.
Architecture is LOCKED (D-032) — build, don't relitigate.

This session stands up the client. Goals, in order:

0. **Prep (board bucket H):** pin the Expo SDK version + re-confirm the Phase-4 stack fits
   (Bundle A: Expo/RN, one codebase iOS+Android; Skia + Victory Native XL native charts).
   Record the pin + any re-confirmation as a D-0xx.

1. **Scaffold @koi/mobile** — Expo/React Native (TypeScript), added to the pnpm+Turbo
   workspace. Wire `@koi/domain` in UNCHANGED (purity + golden vectors stay intact; the
   on-device engine is the point). Ops stance holds (D-025): local builds, NO OTA / EAS
   Update, telemetry off (EXPO_NO_TELEMETRY=1). Mind the Expo gotchas already logged (board
   D): Link.AppleZoom needs `<Link asChild>` + StyleSheet.flatten; expo-symbols falls back to
   emoji on Android (bundle domain glyphs).

2. **PowerSync client connector — honor the contracts the server already enforces:**
   - Client schema: `trackPrevious` ON (the base_version echo, D-037). record_version is a
     column (syncs down, echoed as base). **NO deleted_at column** — bucket-filter (D-046)
     means clients never receive tombstones; a delete arrives as a row-removal. (Mirror
     packages/server/sync-tests/helpers.ts, which is the reference client schema.)
   - Upload connector: map CrudEntry → { op, type, id, data: opData, old: previousValues },
     POST { deviceId, batch } to /upload; **throw on non-2xx so PowerSync retries** (the
     server's retryable-error path — deadlock etc. — depends on this; accept-with-2xx means
     non-2xx is only infra failure).
   - Auth: use the KOI_DEV_AUTH token mint for now (better-auth/passkey is a later session).
   - **Client delete contract (pinned by S-6, must match):** delete = SQL DELETE (→ DELETE
     op); deleting a car = per-child DELETEs (children FIRST) then the car DELETE (D-041, so
     each child's base echo runs per-child conflict analysis); undo = re-INSERT the captured
     row from the toast closure (D-040, inv.31) — NEVER `UPDATE deleted_at`.
   - Prove the S-6 semantics from the REAL app (not just the node torture tier): a delete
     hides the row, undo restores it, a car delete cascades, and conflict flags surface.

3. **S-4 client review queue (the ⛔ blocker this unlocks)** — where the flags this
   architecture produces finally land. Render + let the user resolve every kind:
   column-conflict, missing-base-version, put-on-existing, dead-lettered-op, delete-conflict,
   resurrected, write-on-tombstone, late-child, and the @koi/domain kinds (odometer/car).
   Reuse the import "Review now" pattern (koi-core-spec §D / D-013): named records, user
   decides, nothing auto-repaired. Add the `resolved_at` write flow and join `resolved_at`
   to the sync rules WITH that flow (until then it is a dead-letter trap, exactly like
   archived_at — see the sync_rules.yaml note). Flags reference rows that, if deleted, are no
   longer on the device (bucket-filter) — the review UI leans on the flag payload
   (displaced_value / incoming_value), which already carries what it needs.

4. **On-device (RN-bundled) Hermes golden-vector CI step (board bucket C)** — now possible
   with @koi/mobile: run the golden vectors on the RN-0.8x-bundled Hermes, discharging the
   Ⓒ proxy-Hermes caveat. Keep the standalone-Hermes (jsvu) CI job too.

Do NOT start: ③ local-only→sync migration (separate blocker, after S-4), better-auth passkey
full round-trip (after ③), S-7 erase-everywhere, archive write flow, web companion, the
privacy-page rewrite (release gate — its own task, owner-reviewed copy), income tracking.
@koi/domain stays untouched unless a pure check emerges; purity bans + vectors stay as-is.
Popular tools (niche ones keep exit plans); telemetry off. Commits authored as owner only —
no co-author trailer. Update BOARD.md + session log + decisions.md before ending. Stop for
owner review before ③/passkey work begins.

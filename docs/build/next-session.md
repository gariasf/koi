# Next session kickoff — Session 5: ③ local-only → sync-on migration

Paste the block below to start Session 5, **after** signing off Session 4 at the gate
(the client now exists; ③ and passkey were the stop line). Working-memory artifact;
refresh or delete it once Session 5 is underway.

---

Build phase, Session 5. Repo: ~/Documents/gariasf/koi, remote github.com/gariasf/koi.
Sessions 1–4 done: `@koi/domain` live (vectors md5 f93b1d6b…, untouchable, now also proven
on the Hermes RN ships — D-050); the sync server complete for cars + odometer_readings
(⑤ base_version D-037, exhaustive op-handling D-038, the full S-6 delete model
D-039..D-046 with bucket-filter); and **the client exists** — `@koi/mobile` on Expo SDK 57
/ RN 0.86 (D-048) with the PowerSync client honouring the whole S-6 contract (D-049) and
the S-4 review queue + `resolved_at` latch (D-047). Two sync tiers are green in CI: the
server's 13 scenarios on purpose-built clients, and 9 scenarios driving the APP's own
schema/connector/write functions (the same module also passes on the iOS simulator).

Read first: koi/CLAUDE.md (ritual + ground rules), docs/build/BOARD.md (Now/Next, buckets
A and D), then: decisions.md D-032 (architecture LOCKED), D-037/D-038 (protocol),
D-039..D-046 (delete model + bucket-filter), D-047 (the S-4 queue + latch), D-049 (the
client contract as built), packages/server/README.md (protocol · delete model · latch, one
paragraph each), packages/mobile/README.md (what is load-bearing on the client),
docs/build/spec-delta.md, and koi-core-spec.md §H1/§C8 (erase + settings) plus §B2 inv.31.
Architecture is LOCKED — build, don't relitigate.

This session does ③ — **the local-only → sync-on migration, lossless** (the last ⛔ in
bucket A before auth). The constitutional floor (D-006) is that the app is fully
functional local-only with no account, so the migration is the moment a user who has been
keeping records privately turns sync on:

1. **Local-only mode must exist first.** Today `@koi/mobile` always connects. Split it:
   a local-only database (no connector, no tokens, no endpoint) that is the default, and
   an explicit opt-in that enables sync. Decide and record how the local-only database
   relates to the synced one — same file promoted in place, or a copy-forward migration —
   and why (the promote-in-place path has to prove that every pre-existing row uploads
   exactly once).
2. **Lossless, and provably so.** Every local row must arrive server-side with its
   identity intact: ids are already UUIDv7 minted client-side, but `record_version` does
   not exist locally before sync, `household_id` is server-assigned, and readings must
   still land under the right car. Expect a PUT storm — check it against the accept-with-2xx
   contract, the 20 MiB body limit, and PowerSync's `getCrudBatch` chunking rather than one
   giant transaction.
3. **Torture-tier it** (the tier now has a home): local-only writes → enable sync → every
   row present exactly once, no duplicate ids, no dead letters, no spurious flags (a
   first-upload create-then-edit must not raise missing-base-version — D-037 law 3 already
   covers the same-device case, so prove it end to end). Then: enable sync on a SECOND
   device that also has local-only data (two histories, one household) and record what
   happens — this is where S-9's import remap thinking (D-023) starts to bite.
4. **The settings surface** (§C8): sync is strictly opt-in, and the privacy card's current
   copy ("Your data never leaves this device…") becomes false the moment it is on. Do NOT
   rewrite the privacy page (release gate, owner-reviewed) — but the in-app card must not
   lie, so record what it says in both states in spec-delta.md.

Do NOT start: better-auth passkey full round-trip (after ③), S-7 erase-everywhere, the
archive write flow, the web companion, the privacy-page rewrite, income tracking, the §C
app surface / charts (bucket D). `@koi/domain` stays untouched unless a pure check emerges;
purity bans + vectors stay as-is. Popular tools (niche ones keep exit plans); telemetry off.
Commits authored as owner only — no co-author trailer. Update BOARD.md + session log +
decisions.md before ending. Stop for owner review before passkey work begins.

## Also outstanding (not this session unless the owner says so)

- **Android build path is unverified** — no JDK on the dev machine. Bundle A's "one
  codebase" claim needs one Gradle run plus the Android-over-network initial-sync
  measurement (bucket B).
- **A device/emulator golden-vector run** is the narrow remainder of Ⓒ: the per-OS Unicode
  provider (`normalize('NFC')`) is the one thing D-050's host build cannot cover.
- The capture-feel spike seed is still unmined; `spikes/` deletes once it is.

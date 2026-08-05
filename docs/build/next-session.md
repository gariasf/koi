# Next session kickoff — Session 9: the record tables, and the ledger they unlock

Paste the block below to start Session 9. Working-memory artifact; refresh or delete it once Session 9
is underway.

Session 8's surfaces are **awaiting owner review** (BOARD Now/Next, 2026-08-05). If the review sends
anything back, that comes first and this brief waits.

---

Build phase, Session 9. Repo: ~/Documents/gariasf/koi, remote github.com/gariasf/koi.

Sessions 1–8 done. `@koi/domain` is pure and untouched (md5 f93b1d6b…, tri-engine + RN-Hermes). The
sync server is complete for cars + odometer_readings, and `archived_at` joined the rules with its
write flow (D-061). The app surface is built to the design for everything the schema supports: the
token layer and both authored palettes (D-060), the control language, `@koi/i18n` + `useFormat()`
(D-064), the four-tab shell with per-tab stacks and an app-level toast host whose undo closures queue
(D-062), Garage · car page · car form with archive, Home's state machine, Settings + Sync, and
capture → Odometer with the keypad, the soft/hard split and the dirty guard.

**Read at session start, in this order:** `docs/build/design/spec-amendments.md` (authoritative — but
see D-063: its July rate is stale, `1,18 €/km` is the figure) · `docs/build/design/README.md` ·
`docs/build/design/decisions.md` §B and §H · the sheets themselves (`Koi History`, `Koi Insights`,
`Koi Record Pages`, `Koi Reminders` are this session's) · `koi-core-spec.md` §A + §D ·
`docs/build/spec-delta.md` (its Session 8 section lists every place the build knowingly departs from
the design, and why) · `koi/CLAUDE.md` + `docs/build/BOARD.md`.

**The gate this session opens is the schema, not the architecture.** History, Insights' four lenses,
record pages and reminders are all designed in full and all blocked on the same thing: the §B1 record
kinds do not exist. That is new-table work — server schema + migration + sync rules + zod + client
schema + PATCHABLE_COLUMNS — and then the surfaces.

Suggested order, smallest honest increment first:

1. **The §B1 record tables**: fuel_fills · services · expenses · contracts · trips · notes. Each joins
   the sync rules *with* its write path, the way `resolved_at` (D-047) and `archived_at` (D-061) did —
   never a column clients can see and the server rejects. Mind inv.7's fold rule at the schema level: a
   reading logged *with* a fill lives inside that record and still joins the trail.
2. **`TimelineEvent` projection in `@koi/domain`** (BOARD bucket C, ▲): pure, read-only, deterministic,
   tint as a token name (`'fuel' | 'service' | 'expense' | 'contract' | 'ink'`) and never a hex, so the
   palette stays at the edge. History's mixed feed, the car page's three recent rows and Insights'
   record lists all need it, and it is where inv.7's fold rule should be decided once.
3. **History** (sheet 09) — the month-grouped feed, row anatomy per kind, the swipe (the mechanic
   exists now), the plan-charge ledger row that makes July reconcile (amendment B3), and the two
   empties. The car page's `Full history ›` and Home's Last-fill card both point here.
4. **The lens derivation engines in `@koi/domain`** (bucket C, ▲) then **Insights** — Ownership first:
   it needs no canvas at all, and it is the lens Tester M asked for by name.
5. **Record pages** (sheet 11) as a shared destination registered per tab — the pattern is already in
   place for the review queue, so this is registration, not routing work.

**Also owed, small, and cheap to fold in:** the capture chooser (it lands with the second capture
surface — the design's own rule is that `+` skips it while there is nothing to choose); a real date
picker to replace the odometer sheet's fourteen-day fitted list; `expo-device` for the Sync page's
device alias (the design pairs the OS name with the id's last six, and the id alone does that job
worse); and `Full history ›` becoming unconditional once History exists.

**Not this session:** S-7 erase-everywhere · the web companion · the privacy-page rewrite (bucket F,
⛔) · income tracking · the plan-lineage model amendment B8 needs · the inv.21/inv.23 reconciliation
amendment B13 leaves open · onboarding · the vault.

**Prove it, don't assert it.** Both sync tiers green (`pnpm turbo run test:sync --concurrency=1`), all
unit tiers green, golden vectors byte-identical (md5 f93b1d6b…) — and if `@koi/domain` gains the
projection and the engines, its conformance vectors gain *cases* rather than the md5 changing quietly:
a golden-vector diff is a cross-engine-convergence event to investigate, never a fixture to update.
Screens checked on the simulator in both schemes. Scripted iOS UI is still blocked (bucket H), so
follow the Session 8 precedent: seed the design's fixture, land the app on the route, screenshot it,
and revert the temporary entry rather than committing it.

**Two loose threads from Session 8 worth clearing early:**

- `packages/server/sync-tests/04-dead-letter.test.ts` — "a DELETE on an unknown table still
  dead-letters" flaked once (saw the PUT, not the DELETE) and passed on a re-run. It looks like a race
  in the test's queue-drain wait rather than a server behaviour change, but it will bite CI.
- `pnpm-workspace.yaml` carries an `overrides:` pin for `better-call` / `@better-fetch/fetch` with the
  reason written above it. Remove it when `@better-auth/cli` catches up; until then, adding any
  dependency can re-flip the peer graph and break `@koi/server`'s build with TS2742.

**Still outstanding, not this session:** Android build unverified (no JDK); the device/emulator
golden-vector run for the per-OS Unicode provider is Ⓒ's narrow remainder; build-ops and
test-integrity review lenses have never run; no client screen for entering a recovery code (D-054,
server-proven only); first-time passkey setup shows two Face ID prompts (D-055); the capture-feel
spike seed is still unmined.

Update BOARD.md + the session log + `decisions.md` before ending. Commits authored as the owner only —
no co-author trailer. Stop for owner review when the surfaces are on screen in both schemes and both
sync tiers are green.

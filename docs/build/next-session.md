# Next session kickoff — Session 7: the wireframe pass (opens bucket D)

Paste the block below to start Session 7, **after** signing off Session 6 at the gate.
Working-memory artifact; refresh or delete it once Session 7 is underway.

---

Build phase, Session 7. Repo: ~/Documents/gariasf/koi, remote github.com/gariasf/koi.

Sessions 1–6 done. The whole spine is built and proven: `@koi/domain` pure and untouchable
(md5 f93b1d6b…, tri-engine + RN-Hermes); the sync server complete for cars + odometer_readings
(⑤ base_version D-037, exhaustive op-handling D-038, the full S-6 delete model D-039..D-046 with
bucket-filter); `@koi/mobile` on Expo SDK 57 / RN 0.86 with the S-6 client contract (D-049) and the
S-4 review queue (D-047); ③ local-only → sync-on (D-052); and **real auth end-to-end** (D-053..D-056)
— better-auth in-process, passkey-primary with a native Face ID round-trip proven on device
(registration → session → recovery codes → a JWT PowerSync actually synced with), recovery codes as
a standalone plugin, `KOI_DEV_AUTH` retired. 25 sync scenarios green across three tiers under real
auth. **Bucket A is fully closed. Every ⛔ blocker in the backlog is done.**

Read first: koi/CLAUDE.md (ritual + ground rules), docs/build/BOARD.md (bucket D), then
**koi-core-spec.md §C in full** (functional requirements by surface — C1 Home, C2 History,
C3 Insights, C4 Garage, C5 Capture, C6 Record pages, C7 Reminders, C8 Vault/onboarding/settings)
and **§D in full** (UX pattern language — D1 nav "a book, not a deck of cards", D2 time-as-pages,
D3 color law, D4 chart grammar, D5 honesty patterns, D6 voice, D7 type/motion/controls), plus
docs/build/spec-delta.md (every amendment the build has already made to §C, including the Session 6
sign-in placement and the Session 4 "re-enter, never restore" honesty rule). Architecture is LOCKED
(D-032) — this session designs surfaces, not systems.

**This session is a WIREFRAME PASS, not a build session.** The BOARD names it explicitly as
bucket D's first item: "wireframe pass FIRST — ASCII/block screens … before writing more screen
code." Deliverable is a reviewable design document (suggest `docs/build/wireframes.md`), not
shipped screens. Resist the urge to start implementing; the point is to catch layout and
information-architecture problems on paper, cheaply, while they are still cheap.

Produce ASCII/block wireframes for:
1. **Home (C1)** — all three states (Needs you / Coming up / All clear), month pulse strip, Last
   fill card. Home never grows charts (article 2, constitutional).
2. **History (C2)** — month-grouped feed, filter chips, row anatomy, swipe actions, empty +
   filtered-to-nothing states.
3. **Insights (C3)** — the hard one. Four lenses (Cost / Fuel / Distance / Ownership) × the
   time-as-pages pager (§D2: calendar-aligned, never overlapping, carousel-swiped). Wireframe the
   header control row + at least the Cost and Fuel lenses card-by-card; note where Ownership folds
   the pager away.
4. **Garage + car page (C4)** — car cards with status chips, archived section, the car page's
   groups, and the "exactly 3 recent rows + Full history ›" rule.
5. **Capture (C5)** — the `+` chooser, the fuel keypad sheet (the 10-second surface: three pills,
   derived-pill marking, odometer well with delta hint, saved-moment), the other-type form sheet,
   the trip sheet with its live derivation card.
6. **Record pages (C6)** — the fuel flagship with its Computed panel, including the degraded states
   ("This fill is partial…", "A fill was missed…") which are never red.
7. **Reminders (C7)** — list, the builder-as-a-sentence with its live plain-words card, detail.
8. **Vault / onboarding / settings (C8)**.

Three things the wireframe pass must RESOLVE, not just draw — these are real gaps, and they are the
reason this pass exists:

- **Where does the S-4 review queue live?** It is not in §C at all — it was invented in Session 4
  (D-047) and currently sits on a scaffold screen with its own route. §C's model is four tabs
  (Home / History / Insights / Garage) + the detached `+`. Does the queue become part of Home's
  "Needs you" state (it is literally "does anything need me?"), a Settings surface, or something
  else? It must land somewhere honest without turning Home into a dashboard (article 2). Record the
  decision in spec-delta.md.
- **Where do sync + account settings actually live?** Session 5/6 put a sync toggle, passkey
  sign-in and a recovery-codes reveal on the garage screen as an admitted stand-in. §C8's Settings
  sheet is the real home. Wireframe it there, including what the privacy card says now that sync
  and an account genuinely exist (but do NOT rewrite the release-gated privacy page itself — that
  is still its own owner-reviewed task, bucket F).
- **Dark mode (§D3, co-primary, explicitly not an inversion pass)** is owed and unbuilt — the
  scaffold ships the light pair only. Decide whether the wireframes carry both palettes now or
  whether the authored dark palette is its own follow-up item, and say which.

Sanity-check every wireframe against what `@koi/mobile` ALREADY has (garage, car page, review
queue, sync card, passkey sign-in, recovery-codes card) and note per screen whether the existing
code is keepable, needs rework, or was always scaffolding to throw away. That comparison is a
required output, not a nicety — it is how this pass earns its place before more screen code.

Do NOT start: S-7 erase-everywhere, the archive write flow, the web companion, the privacy-page
rewrite, income tracking, installing chart libraries (Skia + Victory Native XL are re-confirmed on
paper per D-048 but deliberately NOT installed — they arrive with the chart work, not with
wireframes). `@koi/domain` stays untouched. Commits authored as owner only — no co-author trailer.
Update BOARD.md + session log + decisions.md before ending. **Stop for owner review when the
wireframes are done** — the actual four-tab build is the session after this one.

## Also outstanding (not this session unless the owner says so)

- **Android build path is unverified** — no JDK on the dev machine. Bundle A's "one codebase" claim
  needs one Gradle run plus the Android-over-network initial-sync measurement (bucket B).
- **A device/emulator golden-vector run** is the narrow remainder of Ⓒ: the per-OS Unicode provider
  (`normalize('NFC')`) is the one thing D-050's host build cannot cover.
- **build-ops/test-integrity review lenses never ran** (Session 4's adversarial review hit a token
  quota) — a narrower follow-up pass on CI correctness + test integrity is owed.
- **Scripted iOS UI is still blocked** — no Accessibility grant, no `idb`, no Maestro (bucket H).
  Session 6 hit this again for the passkey ceremony (owner drove the taps). Worth fixing before
  something needs it that can't fall back to a manual step.
- **No client screen for entering a recovery code** (D-054) — server-side proof only. A device with
  no reachable passkey currently has no in-app way back in.
- **First-time passkey setup shows two Face ID prompts** (D-055) — correct but reads as a stutter;
  bucket D should smooth or explain it.
- The capture-feel spike seed is still unmined; `spikes/` deletes once it is.

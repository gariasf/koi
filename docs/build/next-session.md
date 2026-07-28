# Next session kickoff — Session 7: wireframe pass (bucket D)

Paste the block below to start Session 7, **after** signing off Session 6 at the gate.
Working-memory artifact; refresh or delete it once Session 7 is underway.

---

Build phase, Session 7. Repo: ~/Documents/gariasf/koi, remote github.com/gariasf/koi.

Sessions 1–6 done: `@koi/domain` live and untouchable; the sync server complete for cars +
odometer_readings (base_version, exhaustive op-handling, the full S-6 delete model with
bucket-filter); `@koi/mobile` on Expo SDK 57 with the S-6 client contract and the S-4 review
queue; ③ local-only → sync-on migration done; and as of Session 6, **real auth end-to-end**
(D-053..D-056) — better-auth mounted in-process, passkey-primary + a standalone recovery-code
plugin, `KOI_DEV_AUTH` retired, all three sync tiers re-proven green under real auth. Native
passkey on Expo/iOS is built and deployed (Associated Domains capability confirmed working
against the owner's paid Apple Developer team); the interactive on-device ceremony itself was
completed by the owner directly, since scripted iOS UI interaction is still blocked (bucket H).

Read first: koi/CLAUDE.md, docs/build/BOARD.md (bucket D row), koi-core-spec.md §C (functional
requirements by surface) and §D (UX pattern language — nav model, time-as-pages, color law,
chart grammar), spec-delta.md (what the Session 4-6 app stack already has vs. what §C actually
specifies — the current app is scaffolding for the sync contracts, not the real shell).

This session's job, per the BOARD: **the wireframe pass, before any more screen code.**
ASCII/block layouts translating §C (functional reqs) + §D (nav model, time-as-pages, color law,
chart grammar) into concrete screens for the four tabs (Home/History/Insights/Garage) + capture
+ record pages + reminders + vault/settings — sanity-checked against what `@koi/mobile` already
has (garage/car page/review queue/sync toggle/passkey sign-in) before writing more screen code.
This is prep for opening bucket D, not bucket D itself — do not start building the real four-tab
shell or capture sheets in this session unless the wireframe pass is done and the owner has seen
it.

Do NOT start: S-7 erase-everywhere, the archive write flow, the web companion, the privacy-page
rewrite (still its own release-gated, owner-reviewed task — now genuinely more urgent, since
auth is real and the privacy page's "no account" framing needs revisiting), income tracking.
`@koi/domain` stays untouched. Commits authored as owner only — no co-author trailer.

## Also outstanding (not this session unless the owner says so)

- **Android build path is unverified** — no JDK on the dev machine.
- **A device/emulator golden-vector run** is the narrow remainder of Ⓒ (per-OS Unicode provider).
- **build-ops/test-integrity review lenses never ran** (Session 4) — a narrower follow-up pass is
  owed, not blocking.
- **Scripted iOS UI is still blocked** — no Accessibility grant, no `idb`, no Maestro (bucket H).
  Session 6 hit this again for the passkey ceremony; worth resolving before it blocks something
  that can't fall back to an owner-driven manual step as easily.
- A client screen for **entering a recovery code** to sign in doesn't exist yet (Session 6,
  D-054) — server-side proof only so far.
- The capture-feel spike seed is still unmined; `spikes/` deletes once it is.

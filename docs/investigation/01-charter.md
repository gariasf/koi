# Phase 1 — Charter

**Status:** LOCKED 2026-07-17 (owner signed at gate, with two amendments: 2.x abandoned outright — stronger than the proposed freeze; invariants added as park trigger).
**Question:** what are we actually building, and what's non-negotiable?
**Inputs:** owner conversation (2026-07-17) + `../koi-core-spec.md` §A, §G, Appendix 2. No research (per phase design).
**Exit:** every slot answered ✓; locks when the owner signs this gate. The carry-forward is the constraint list and weighted criteria for Phases 3–4.

---

## 1. Why multiplatform

Three motives, no external demand yet:

- **Own need** — the owner wants Koi beyond the iPhone.
- **Growth ambition** — Android + web unlock users iOS-only can't reach.
- **Curiosity / learning** — building a multiplatform TS stack (NestJS, Next.js, Expo) is a genuine draw.

Explicitly *not* a motive: tester/user demand — nobody has asked yet. The investigation must therefore be honest that this is owner-driven, and the park triggers (§10) are the counterweight.

## 2. Platform roles

- **iPhone** stays the daily driver and primary capture device through the build.
- **Web** = **read-mostly companion**: view ledger + Insights on a big screen; occasional edits OK; capture stays on phones. (Import/export console duties come along for free; full-peer parity is *not* required.)
- **Android** = **stack decides**: no a-priori commitment. If a shared stack (Expo) wins Phases 4–5, parity is nearly free and Android ships with it; if iOS stays native, Android is a follower or is deferred. Phase 4 must state which.

## 3. Privacy & accounts stance

**Phase 3 decides the rung, with a declared priority order:**

1. Local-first E2EE, **no accounts** (server stores ciphertext; pairing/passphrase) — preferred.
2. E2EE **with** an account (login/recovery; data still unreadable to server).
3. Accounts with a server that reads data — last resort, only if rungs 1–2 price out on features/cost.

Phase 3's job is to price each rung honestly (features lost, complexity, cost) rather than assume the top rung is affordable.

**Privacy floor (holds regardless of rung):** no ads, no trackers, no third-party analytics; free, complete export; **sync is strictly opt-in — the app is fully functional local-only, no account required to use it.** The privacy page is rewritten *before* any sync ships, and every sentence on it must stay true.

## 4. Sync scope

**Single user, multiple devices — but the architecture must not preclude household sharing** (two people, one garage) later. No permissions/presence/attribution work now; adding household later must be an extension, not a rewrite. Phase 3 evaluates candidates against this explicitly (e.g. does the engine's data model admit multiple actors?).

## 5. What "more complete" means

**Broad reopen of §G — including income tracking.** The rebuild is the moment to revisit the deferred list broadly; the owner explicitly includes income (currently vision-locked), which requires a SUPERSEDED entry against the refusals table at this gate.

Guardrails so this doesn't become ambient scope creep:

- The reopen happens **only as a deliberate Phase 2 pass**: each §G item gets an in/out/later verdict at the Phase 2 gate. Nothing enters scope by drift.
- Refused items **other than income** (pie charts, gamification, GPS/trip timers, per-trip economy, fuel-price finder, blended economy…) stay refused absent their own explicit SUPERSEDED entry.

## 6. Monetization envelope

- **Infra ceiling: ≤ €25/month** — room for managed sync tiers (as of 2026-07: PowerSync/Supabase-class paid tiers fit).
- **Pricing model stays open until Phase 6.** Constraints carried verbatim: no nag walls, no feature hostage-taking, no upsells; whatever is chosen must not corrupt the privacy story.

## 7. Fate of the current app

- **2.x is abandoned.** No further development from today — no features, no bugfixes, no releases (the verified-but-unreleased "time as pages" build never ships). The shipping app simply stays as-is until the new product replaces it.
- **Parity baseline** is therefore fixed: `koi-core-spec.md` + the Phase 2 delta. No moving target.
- **End state: replaced.** The multiplatform Koi supersedes 2.x; no permanent local-only twin app. The local-only *mode* lives inside the new product (per the privacy floor), which is what makes replacement honest.
- **Migration bridge: the JSON export** already shipped in 2.x (full-fidelity), which makes Koi-export re-import (§G) load-bearing rather than nice-to-have.

## 8. Declared biases & constraints

- **Learning bias declared:** wants to try NestJS, Next.js, Expo. **Weight: tiebreaker only** — it breaks ties between technically equal options and never overrides a fit gap. Phases 3–4 may refuse any of them with reasons.
- **TypeScript: strong, daily.** No TS learning curve to plan for; monorepo/tooling comfort assumed.
- **Capacity: 10+ h/week** — this is the main side project. Solo dev. No hard deadline declared.

## 9. Non-negotiables carried verbatim

- **Articles 1–6 and 8 survive verbatim** (ledger sacred; calm surface; complete core; transparency; guardrails at the door; zero-friction capture; scale with the garage).
- **Article 7 is the one renegotiated.** Its spirit — *private by construction* — survives as the §3 priority order + floor; its letter ("no servers") is what Phase 3 reprices.
- **Article 9 ("native and durable"): the bar stays, the wording is decided by Spike 1.** Dynamic type, a11y, dark mode, platform conventions, Koi-grade feel are non-negotiable on every client. Whether "platform-native UI" survives as written: if the Expo capture-feel spike passes on device, the wording opens to "native-grade"; if it fails, article 9 stands verbatim and iOS stays SwiftUI.
- **Refusals table survives** except: the accounts/cloud-sync row (renegotiated, §3) and the income row (reopened, §5). Everything else — pies, gamification, forced dashboards, silent mutation, data hostage-taking, GPS/surveillance, per-trip economy, station prices, blended economy — carries verbatim.

## 10. Success criteria for the investigation

**Done** = Phase 6 delivers: the ADR set (sync, stack, hosting, repo layout), a one-page target architecture, the 2.x coexistence/freeze plan, the repo-reset plan, a thin-slice build roadmap, and a go / no-go / park recommendation — with **every open risk carrying either a spike verdict or an explicitly accepted risk**.

**Park triggers** (any one ⇒ recommend park, not build):

1. **Invariants don't survive sync** — no architecture preserves the §B2 invariants + "flag, never fix" under multi-device merge without unacceptable complexity.
2. **Privacy floor unaffordable** — meeting §3's floor costs features or money beyond the €25/mo + solo envelope.
3. **Capture feel fails** — cross-platform capture can't reach Koi-grade feel (Spike 1), *and* maintaining 2+ native apps solo is unrealistic.
4. **Build size vs capacity** — the honest roadmap exceeds what 10+ h/wk solo can ship in reasonable calendar time.

---

## Carry-forward

- Clients: iPhone = daily driver; web = read-mostly companion (not full peer); Android = stack-decided in Phase 4.
- Sync: single-user multi-device; must not preclude household sharing (extension, not rewrite).
- Privacy rungs, in order: E2EE-no-accounts > E2EE+account > server-readable; Phase 3 prices each.
- Privacy floor (any rung): no ads/trackers/analytics; free complete export; sync opt-in; fully functional local-only, no account.
- Money: infra ≤ €25/mo; pricing open until Phase 6; no nag walls / feature hostages.
- Scope: broad §G reopen incl. income, settled item-by-item at Phase 2 gate; other refusals stand.
- 2.x: abandoned — zero further development or releases; parity baseline = spec + Phase 2 delta; end state replaced; existing JSON export = migration bridge (re-import becomes load-bearing).
- Criteria weights for Phases 3–4: privacy fit ≻ invariant preservation under merge ≻ offline depth ≻ solo maintainability (TS-strong dev) ≻ cost envelope ≻ maturity/bus factor ≻ learning value (tiebreaker only).
- Article 9 wording pends Spike 1 (capture feel); its bar (dynamic type, a11y, Koi-grade feel) binds all clients regardless.
- Park if: invariants don't survive sync · privacy floor unaffordable · capture feel fails · roadmap exceeds solo 10+ h/wk.

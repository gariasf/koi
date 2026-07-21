# Koi replatform — investigation workflow

This folder holds one question: **should Koi become a multiplatform product — iOS app, Android app, web app, and a syncing server — and if so, on what architecture?** Rebuilt from scratch, assuming nothing, including the possibility that the answer is "don't".

Product truth stays in `../koi-core-spec.md` — the investigation never re-derives it. This document is the meta-doc: how the investigation itself runs.

**Workspace rule.** Everything lives in `koi-project/` (a plain folder, deliberately not a git repo — owner's call; repos get reset with new naming when building starts). The existing repos — `../koi` (the shipping iOS app) and the website repo — are **read-only references**: never modify, never commit there. Phase 6 owns the repo-reset plan: new names, what gets archived, deleted, or renamed. The operational quick-card (session ritual, status board) lives in `README.md`; settled questions live in `decisions.md`; off-phase ideas go to `parking-lot.md`.

## Why a workflow at all

Two failure modes this structure exists to prevent:

1. **Everything at once.** One long conversation that touches sync, stacks, frameworks, and product scope simultaneously decides all of them badly. Each big question gets its own phase, its own sessions, and its own gate.
2. **Context rot.** Long sessions accumulate research debris until reasoning degrades. The cure: durable documents are the memory, sessions are disposable. Any session can die at any moment and the next one resumes from files alone.

## Principles

1. **Docs are the memory; sessions are disposable.** Every phase produces a compact artifact (1–3 pages). A later session reads artifacts, never transcripts. Each phase doc ends with a `## Carry-forward` block (≤10 lines) — the only part later phases load by default; the full doc is pull-on-demand.
2. **One phase, one question.** A session never spans two phases. If a phase needs several sessions, each resumes from the phase doc's state section.
3. **Fan out reading, centralize judgment.** Raw material (framework docs, blog posts, landscape scans) is consumed by subagents that return dated one-page briefs into `research/<phase>/`. The main thread reads briefs and decides; raw dumps never enter the main context.
4. **Declared biases.** The desire to try NestJS / Next.js / Expo is legitimate and goes in the charter as an explicit, weighted criterion (learning value / developer joy) — never a hidden thumb on the scale. The investigation may still refuse them, with reasons.
5. **Evidence before commitment.** Paper comparisons produce shortlists; spikes produce decisions. (Generalizes the proven Koi learning: two rounds of throwaway HTML beat weeks of native iteration.)
6. **Every settled question lands in the ledger** (`decisions.md`) as LOCKED / OPEN / SUPERSEDED / REFUSED. Reopening a LOCKED decision is allowed only via an explicit SUPERSEDED entry at a gate — supersession is explicit, never archaeology.
7. **Gates own the pacing.** A phase ends when the user reads its output doc and locks it (or sends it back). Nothing proceeds past an unlocked gate. This is where "enough time per phase" is enforced — slowness lives at the gates, deliberately.
8. **Dated claims.** Every ecosystem claim carries an as-of date (the JS ecosystem's half-life is months, and we start from an out-of-date picture). Anything load-bearing gets re-verified at build time.

## Phase map

| # | Phase | Core question | Size | Research fan-out |
|---|-------|---------------|------|------------------|
| 1 | Charter | What are we building, and what's non-negotiable? | 1 session | none |
| 2 | Requirements delta | What does multi-device change in the spec? | 1–2 sessions | none (pure derivation) |
| 3 | Sync & data architecture | How does a private ledger sync? | 2–3 sessions | yes — the heavyweight phase |
| 4 | Stack & platform fit | What builds three clients + a server around that sync? | 2 sessions | yes |
| 5 | Spikes | Do the risky bets survive contact? | 3–5 sessions | code, not reading |
| 6 | Decision | Build what, in what order, and what happens to Koi 2.x? | 1 session | none |

Roughly 10–13 sessions total; calendar time is user-paced via gates.

### Phase 1 — Charter (`01-charter.md`)

Inputs: conversation + `../koi-core-spec.md` §A, §G, Appendix 2. Pure conversation with the owner, no research. Settles: why multiplatform (what real demand); platform roles (web as full peer vs companion; Android parity); privacy & accounts stance (the big one — is article 7 identity or negotiable); sync scope (single user multi-device vs household sharing — an easy-to-miss architectural fork); what "more complete" means (same features on more platforms, or does it reopen §G deferred items); monetization envelope (a server bills monthly — recurring cost meets paid-up-front tension); fate of the current app during and after; declared biases and their weight; success criteria for the investigation itself.
**Exit:** charter locked. Its carry-forward becomes the constraint list and weighted criteria every later phase evaluates against.

### Phase 2 — Requirements delta (`02-requirements-delta.md`)

Inputs: charter + `koi-core-spec.md` (full). Walk the §B2 invariants asking "what breaks with N writers?" — monotonic odometer validation across offline devices is the flagship problem; also id stability, revision semantics, tombstones for undoable deletes, import idempotency across devices, and how "flag, never fix" extends to sync conflicts. Define per-platform requirement deltas (not design) and the new NFRs (what the privacy page can still truthfully say, backup story, erase-everything across devices).
**Exit:** delta spec locked. Cheap, high-value, zero web research — deliberately early.

### Phase 3 — Sync & data architecture (`03-sync-architecture.md`)

The deep phase. Landscape (as-of-dated briefs): local-first engines (PowerSync, ElectricSQL, Zero, Jazz, Triplit, LiveStore, InstantDB, Automerge/Yjs CRDTs), DIY op-log / event sourcing over Postgres, backend-as-a-service realtime (Supabase, Firebase), CloudKit (likely refused by multiplatform — list and refuse with reasons), and E2EE approaches (device keys, passphrase recovery, what a blind server costs in features).
Evaluation criteria come from the charter (privacy weight above all), plus: invariant preservation under merge, offline depth, TS/RN/web client support, self-host vs SaaS, cost envelope, maturity and bus factor, migration story from the current one-JSON-document model.
Method: fan-out briefs → shortlist 2–3 → paper-design Koi's actual data flow on each (where does an odometer conflict surface? where do the ~100 invariant tests run?) → recommendation + refusals.
Working hypothesis for this phase: clients are TypeScript (RN + web). Phase 4 validates it; a bounce-back rewrites via SUPERSEDED, not silently.
**Exit:** architecture direction locked, possibly "pending spike X".

### Phase 4 — Stack & platform fit (`04-stack.md`)

What builds the clients and server around the chosen sync. Topics: Expo/RN's native-feel ceiling against Koi's bar (fitted sheets/detents, zoom transitions, custom keypad, haptics, chart grammar via Skia or equivalent, Dynamic Type/a11y parity) and the honest alternatives (keep SwiftUI for iOS + share the rest; KMP — adopt or refuse with reasons); the web app's frame (Next.js vs lighter SPA/PWA — depends on the web role and sync choice); the server (NestJS vs Fastify/Hono/tRPC — or whatever the sync engine dictates; is NestJS overkill for a sync-blind API?); hosting + monthly cost (VPS/Fly/Railway/…); monorepo tooling; the shared `@koi/domain` package (invariants + tests ported once, run everywhere — the crown jewel of the whole plan); i18n parity for five locales.
**Exit:** stack shortlist locked → defines the spike list.

### Phase 5 — Spikes (`05-spikes/`)

Rules: each spike pre-registers its question, kill criteria, and timebox **before any code**; code is throwaway and lives in `../spikes/<name>` (inside `koi-project/`, outside any repo); the verdict is recorded win or lose in `05-spikes/README.md`. Max 4, chosen at phase start from the open risks. Canonical candidates (final list set then):
1. **Capture feel** — fuel keypad + fitted sheet + saved moment in Expo, on device. Does it feel Koi-grade?
2. **Sync torture** — two clients offline, conflicting odometer + backdated edits through the chosen engine. Do the invariants and "flag, never fix" survive?
3. **Shared domain** — port ~10 representative invariant tests to TS; run them in RN, web, and server from one package.
4. **Chart grammar** — paged month carousel + tap-to-read on RN.
**Exit:** every open risk has a verdict or an explicitly accepted risk.

### Phase 6 — Decision (`06-decision.md`)

ADR set (sync, stack, hosting, repo layout), a one-page target architecture, the coexistence plan (does 2.x keep shipping; feature freeze or not; JSON export as the migration bridge), the **repo-reset plan** (new repo names; what happens to the existing `koi` and website repos — archive, delete, or rename; where this workspace's docs land), a thin-slice build roadmap, and a go / no-go / park recommendation — "park" is a legitimate outcome, not a failure.
**Exit:** user locks → investigation closes.

## Session protocol

**Start** (fresh session): read `README.md` (status board + this ritual), the active phase doc, and the carry-forward blocks of locked phases. Hard cap: ~10–15% of context on inputs. Everything else is pull-on-demand.
**During:** any reading beyond a couple of files, and all web research, goes to subagents returning briefs. Fan-out research is authorized per phase at the preceding gate (it costs real tokens — the user approves the dial).
**End** (every session, even interrupted ones): update the phase doc's state section, the status board, the ledger, and the parking lot. Then the session is safe to discard.

## Tracks

This is the **platform/architecture track**. The **visual design track** (Claude Design, already running: new design system + mockups from `koi-core-spec.md`) proceeds in parallel and independently; the two meet at Phase 6. Neither blocks the other; neither decides for the other.

## Anti-patterns (ban list)

- Picking a stack in conversation before Phases 3–4 produce evidence.
- Research dumps pasted into the main thread.
- A session that mixes phases, or a phase that quietly inflates its size without a gate.
- Decisions made but not logged; ecosystem claims without dates.
- A spike without pre-registered kill criteria.
- "While we're at it" — park it instead.

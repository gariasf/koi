# Replatform investigation — status board

**Question:** should Koi become a multiplatform product (iOS, Android, web, syncing server), and if so, on what architecture? Full workflow rationale: `00-workflow.md`. Product truth: `../koi-core-spec.md`.

## Status

| # | Phase | Doc | Status | Sessions spent | Gate (user lock) |
|---|-------|-----|--------|----------------|------------------|
| 1 | Charter | `01-charter.md` | **locked** | 1 | 2026-07-17 |
| 2 | Requirements delta | `02-requirements-delta.md` | **locked** | 1 | 2026-07-17 |
| 3 | Sync & data architecture | `03-sync-architecture.md` | **locked** | 2 | 2026-07-19 |
| 4 | Stack & platform fit | `04-stack.md` | **locked** | 1 | 2026-07-20 |
| 5 | Spikes | `05-spikes/` | **locked** | 1 | 2026-07-20 |
| 6 | Decision | `06-decision.md` | **locked** — verdict GO; investigation closed | 1 | 2026-07-21 |

Statuses: `pending` → `active` → `gate` (doc ready, awaiting user) → `locked` / `sent back`.

## Session ritual (the operational card)

**Start a phase session** (fresh context): read this file, then the active phase doc, then the `## Carry-forward` blocks of locked phase docs. Cap input loading at ~10–15% of context; pull anything else on demand.

**During:** reading beyond a couple of files and all web research go to subagents; they return dated one-page briefs into `research/<phase>/`. Main thread reads briefs, not sources. Fan-out research only if authorized at the previous gate.

**End every session:** update the phase doc's state section, this status board, `decisions.md`, and `parking-lot.md`. One phase per session, never two. Sessions stop at gates — a gate needs the user.

## Files

- `00-workflow.md` — the workflow itself (read once per phase, not every session)
- `decisions.md` — ledger: LOCKED / OPEN / SUPERSEDED / REFUSED
- `parking-lot.md` — off-phase ideas, reviewed at gates
- `research/<phase>/` — dated subagent briefs (evidence, auditable, never auto-loaded)
- Spike code: `../spikes/<name>` (throwaway, no repo); verdicts in `05-spikes/README.md`

## Workspace rule

Everything happens in `koi-project/` (plain folder, no git yet — repos reset with new naming at build phase). `../../koi` and the website repo are **read-only references**: never modify them.

# Phase 2 — Requirements delta

**Status:** LOCKED 2026-07-17 (owner signed at gate, no amendments — all four §7 proposals accepted as proposed).
**Question:** what does multi-device change in the spec?
**Inputs:** Phase 1 carry-forward (locked) + `../koi-core-spec.md` (full). No research — pure derivation, per phase design.
**Exit:** owner settles the §6 verdicts item-by-item and signs; delta locked. This doc then *amends* `koi-core-spec.md` — it never restates it.

---

## 1. Method and scope

The spec was written for one writer on one device. This delta walks every §B2 invariant asking **"what breaks with N writers?"** (N devices, one user, offline-capable — and per the charter, nothing may preclude household sharing later). It defines *requirements*, not designs: where a mechanism is needed, the requirement states what any mechanism must guarantee and Phase 3 picks it.

Verdict shorthand: **survives** (no change needed) · **Δ** (amended, delta stated) · **new** (requirement that has no spec ancestor).

## 2. Invariant walk — what breaks with N writers

**Economy (B2 1–5) — survives.** All economy values are derived at read time from the record set; once records converge, every device computes the same numbers. A fill arriving late via sync legitimately rewrites past economy figures — that is convergence, not conflict. New obligations it creates: derivations must produce identical results on every platform (→ shared domain package, Phase 4; testing NFR §5), and a record changed *by sync* must re-render just like a local edit (S-2).

**Odometer trail (B2 6–12) — Δ, the flagship.** Entry-time monotonic validation (inv. 9) checks against *this device's* trail. Two offline devices can each accept a reading that is valid locally and contradictory after merge (A logs 50 000 km on Jul 10; stale B logs 49 800 km on Jul 12; both pass; the merged trail breaks). Rejection is impossible (both entries were valid when made) and auto-repair is constitutionally banned (article 5, inv. 12). The delta makes monotonicity **two-tier**:

- *At entry* — hard stop against the device's local trail, exactly as today (inv. 9 unchanged in experience).
- *At merge* — violations are **flagged for user review, never auto-fixed, never rejected** (inv. 12 extended from imports to sync; requirement S-4). The review surface already exists in spirit: import's "Review now" flow.

Inv. 10 (edit exclusion) unchanged. Inv. 11 Δ: the car's *current odometer* must become a purely derived value from the merged trail — a stored counter would itself become a conflict site (S-3). Fold rule (inv. 7) survives: folded readings travel inside their record.

**Money (B2 13–20) — survives, one port hazard.** All money laws are derivations over plan/records; they converge with the records. Concurrent edits to the *same* Plan (both devices change `monthlyCost` offline) fall under S-5. Locale-safe parsing (inv. 20) must be reimplemented per platform against the **same test fixtures** — a web client parsing "20.000" as 20.0 would inject 1000× corruption into the *shared* ledger, worse than the single-app version of the bug.

**Distance (B2 21–23) — survives.** Pure trail derivations.

**Caps & pooling (B2 24–27) — survives, one gift.** All derived from plan + trail. The 7-day quiet window after an odometer update (inv. 27) keys off the *synced* trail, so an update on any device quiets every device for free. Notification *scheduling* is per device → S-13.

**Lifecycle (B2 28–31) — Δ.**
- Swap (inv. 28): plan lineage is an ordered list; concurrent appends on two devices must converge deterministically and be flagged (a swap is rare and momentous — silent reordering is unacceptable). Phase 3 must show each candidate's ordered-list merge behavior.
- Undoable delete (inv. 31): today undo is a closure held by a toast — that dies the moment a delete syncs. Deletes become **tombstones** (S-6): undo works by resurrection, on any device, and tombstoned records are excluded from every derivation everywhere.
- Cascade (car delete purges everything attached): the cascade must be atomic as observed by other devices, and a record created *offline* for a car deleted elsewhere must be **flagged, not silently dropped, not silently resurrected** (S-6).
- Archive concurrent with new records: benign — archive is a flag; records still attach.

**Reminders (B2 32–34) — Δ.** Resolving a recurring reminder *materializes* the next occurrence; two devices resolving offline would materialize twins. Materialization must be idempotent across devices — the next occurrence's identity derives deterministically from (reminder id, anchor, rule) so duplicates collapse (S-8). Concurrent snooze/resolve is benign last-write-wins: both intents are the same user's.

**Validation table — one new row.**

| Rule | Severity |
|---|---|
| Post-merge invariant violation (monotonicity, orphaned child, lineage order…) | **Flag** — review queue; never auto-fixed, never rejected |

## 3. New requirements — sync semantics (S-1 … S-14)

- **S-1 · Identity.** Every record id is globally unique across devices without coordination, stable for the record's life, never reused. Import continues to stamp source ids (`importedVehicleID` et al.).
- **S-2 · Versioning.** Every mutable entity (not just Car) carries version metadata sufficient for deterministic convergence *and* for UI diffing — remote edits must invalidate equality exactly as local edits do. Car's `revision` counter (bump-on-edit) is insufficient with N writers: two devices bumping independently collide. Phase 3 picks the mechanism (logical clock / HLC / engine-provided); this spec only fixes the guarantees.
- **S-3 · Derived values never sync.** Economy, totals, current odometer, cap state, trip costs, synthesized cap reminders — all recomputed locally from converged records, never transmitted. This deletes whole conflict classes before they exist and generalizes the spec's own "economy is derived at read time, never stored."
- **S-4 · Flag, never fix — extended to merge.** Any invariant violation that only becomes visible at merge is surfaced in a review queue (reusing the import "Review now" pattern): named records, user decides, nothing auto-repaired, nothing rejected. This is inv. 12 promoted from "imports and legacy data" to "any stored sequence, however it arrived."
- **S-5 · No silent loss.** Concurrent edits to the same record must (a) converge to the identical result on every device, and (b) never silently discard user input — either the merge is lossless (field-level) or the losing version is preserved and surfaced for review. Silent last-write-wins on a whole record is the "silent data mutation" refusal wearing a network.
- **S-6 · Deletes are tombstones.** Undo survives sync (resurrection by id); toast-undo semantics preserved on the deleting device. Car deletion cascades atomically as observed by peers. A record arriving for a tombstoned parent is flagged (S-4), not dropped, not resurrected.
- **S-7 · Erase everything, everywhere.** Erase propagates to the server copy and to every device, and is **durable against late-returning devices** — a phone offline through the erase must not resurrect the dataset when it reconnects. Phase 3 must show each candidate's answer (and note: E2EE rung 1 makes server-side erase trivially provable — delete the ciphertext).
- **S-8 · Idempotent recurrence.** Next-occurrence identity is a deterministic function of (reminder, anchor, rule); double materialization collapses on merge.
- **S-9 · Idempotent import, N devices.** Vehicle-level dedup (`importedVehicleID`) must hold *across* the merged ledger: the same CSV imported on two offline devices converges to one car set. Record-level dedup (natural key: vehicle + date + amount + odometer — §G's sketch) is promoted from should-have to **required**: it is the same mechanism sync convergence needs.
- **S-10 · Unknown-field preservation.** The spec's "migration is a one-way door" learning generalizes to the wire: a stale client syncing a record it only partly understands must round-trip the fields it doesn't know, never strip them. Additive-optional schema evolution becomes a *protocol* rule, not just a file rule.
- **S-11 · Offline-first capture.** Every write succeeds locally, instantly, with zero network dependency; the 10-second fill and the saved moment are identical offline, online, and on a dead server. Sync is background catch-up, never a foreground gate.
- **S-12 · Preference split.** Preferences divide into *synced* (units, economy format, currency — one user expects one view of their numbers) and *device-local* (appearance, notification delivery). Logged amounts never change regardless (units are display conversion; sync carries raw values). Exact split signed at this gate — proposal in §7.
- **S-13 · Notifications across devices.** Each device schedules locally from synced state (privacy floor: no push infrastructure required). Consequence: N devices = N copies of an alert unless a policy says otherwise. Proposal: reminders alert on *phones only* by default (web never notifies; per-device toggle exists anyway per spec). Phase 4 confirms feasibility per stack.
- **S-14 · Household non-preclusion.** No requirement here adds actors, permissions, presence, or attribution — but no design may *hard-code* single-actor assumptions the way `revision` hard-codes single-writer. Phase 3 evaluates candidates on "does the data model admit a second actor later without rewrite" (charter D-007).

## 4. Per-platform requirement deltas

**iPhone — baseline.** Full spec, plus sync. Primary capture device; nothing degrades.

**Android (conditional, Phase 4 decides shipping).** If it ships, it ships as a **capture peer**: full capture parity (keypad-first fuel capture, saved moment, validation, notifications). Article 9's bar (dynamic type, a11y, Koi-grade feel) binds it; wording pends Spike 1.

**Web — read-mostly companion (charter D-004).** Required: full ledger (History) and full Insights — lenses, time-as-pages (pointer + touch), chart grammar D4, honesty patterns D5; record pages with computed panels; occasional edits (record edit/delete with the same validation); Garage/vault/reminders *viewing*; import console (CSV file handling is web-native) and full export (JSON + CSV); five locales; WCAG 2.2 AA as the article-9 rendering of "a11y parity". **Not required:** capture surfaces (no custom keypad, no fuel-capture requirement — capture stays on phones), notifications, widgets. **Honest constraint to sign at gate:** a web app is only meaningful with sync enabled — the "fully functional local-only, no account" floor is carried by the phone apps; the privacy page must say this plainly. (An accountless web viewer over an export file is parked, not required — see parking lot.)

**Server — a new platform the spec never had.** Requirements regardless of Phase 3's rung choice: stores the minimum the chosen rung implies; no ads/trackers/third-party analytics server-side either; **no user content in server logs**; no third-party data processors beyond hosting; export never requires server cooperation (clients hold full data); the server is optional forever (local-only mode is first-class); infra fits the ≤ €25/mo envelope (charter D-009). Sync of Documents/photos (blobs) is in scope — Phase 3 must price blob sync per candidate, it dominates payload size.

## 5. NFR deltas

**H1 · Privacy page (load-bearing).** Rewritten before any sync ships (charter D-006). Two-part structure keeps it true:
1. *Default state:* out of the box, every current sentence stays true on the phone apps — no account, no network calls, data only on device. Sync is strictly opt-in.
2. *With sync on*, per rung (truth table for Phase 3):

| H1 sentence | Rung 1 (E2EE, no account) | Rung 2 (E2EE + account) | Rung 3 (server-readable) |
|---|---|---|---|
| No account, no email, no sign-in | ✅ true (pairing/passphrase) | ❌ rewrite: "an account, used only for sync" | ❌ rewrite |
| Data stored only on device | ❌ rewrite: "…and, encrypted, on our server — we cannot read it" | same as rung 1 | ❌ rewrite honestly |
| No ads / trackers / 3rd-party analytics | ✅ floor, always | ✅ | ✅ |
| Contacts no outside services | ❌ rewrite: "only Koi's sync server, only when sync is on" | same | same |
| Export or delete everything, any time | ✅ + erase-everywhere (S-7) | ✅ | ✅ |
| Data rides your phone backup | ✅ unchanged | ✅ | ✅ |

**H2 · Persistence.** The one-JSON-document model is superseded *as the sync unit*: sync requires record-level identity and versioning (S-1/S-2). Local storage format per platform is Phase 4's call; the requirements that survive re-statement: additive-optional evolution (now also on the wire, S-10), corrupt-store recovery that never overwrites in place, full-fidelity JSON export + per-table CSV — generatable client-side with no server.

**Backup story (new).** Sync is not backup. At rung 1, a lost passphrase makes server ciphertext worthless — so **export remains the guaranteed backup**, and Koi-export re-import (§G) is promoted to **required**: it is simultaneously the 2.x migration bridge (charter D-010 makes it load-bearing) and the restore path. Sync may only be *marketed* as backup if the chosen rung has a real recovery story.

**H3 · Localization.** Five locales bind every client including web; +30% string growth binds web design too; the server sends no user-visible strings (keeps l10n client-side, and keeps the server honest at rung 1 — it can't read anything to phrase).

**H4 · Accessibility.** Article 9's bar binds all clients (charter D-012). The consciously postponed audit batch (§G) is promoted to **required before multiplatform launch** — carrying known a11y debt into three new clients triples it.

**H5 · Testing.** Tier 1 (~100 invariant tests) is ported once into the shared domain package and runs on every platform's CI — this is the mechanism behind "derivations identical everywhere" (§2). Import-parity fixtures carry verbatim. **New tier: sync torture suite** — permanent regression tests for the S-requirements: offline conflicting odometers, backdated edits, double import, double recurrence resolution, tombstone + late child, erase with an offline device. (Phase 5's Spike 2 scenarios graduate into this suite.)

**H6 · Performance.** Capture latency is independent of connectivity (S-11). Initial sync of a multi-year garage (thousands of records + document blobs) must be tolerable on mobile data; Phase 3 prices this per candidate.

## 6. §G reopen — proposed verdicts (owner settles item-by-item at this gate)

Charter D-008: broad reopen including income; everything else refused stays refused absent its own SUPERSEDED entry.

| §G item | Verdict | Reason |
|---|---|---|
| Income tracking | **IN** | Owner reopened it explicitly (D-008). Design sketch exists (income record kind, positive hue, excluded from cost charts, ownership "Incomes −" + net row). Touches every money surface — cheapest now, at rebuild time, than ever again. |
| Koi-export re-import | **IN (required)** | Migration bridge from abandoned 2.x (D-010) *and* the backup restore path (§5). Load-bearing twice. |
| Record-level import dedup | **IN (required)** | Same mechanism sync convergence needs (S-9); no longer optional. |
| Accessibility completion pass | **IN (required)** | Article 9 binds all clients; debt must not multiply by four platforms. |
| iCloud backup/sync | **OUT (superseded)** | This investigation *is* the multi-device answer; CloudKit gets its formal refusal in Phase 3's landscape. |
| Android | **OUT of delta (charter)** | Already governed by D-004 — stack-decided in Phase 4. |
| Multi-item service entries | LATER | Real-demand rule stands; presets cover the common case. |
| History search | LATER | Nice-to-have; web makes big ledgers more browsable anyway. |
| Receipts/photos on records | LATER | Natural vault extension — but blob sync must be priced (§4 server) before growing blob surface. |
| Widgets | LATER | Platform extras, post-parity. |
| Trip-computer cross-check | LATER | Cheap, honest, not multi-device-relevant. |
| EV charging economics | LATER | Own cost model; unchanged by platforms. |
| Business/private trip flag + CSV | LATER | Real expensing use case still absent. |
| Multi-currency totals | LATER | Multi-*device*, not multi-currency, is the project. |
| iPad/Mac | LATER | The web companion absorbs most big-screen demand; revisit after launch. |
| Overview + pushed lens IA · grain-as-content · history period jump | PARKED (design track) | Visual design track territory; meets this track at Phase 6. |

All other refusals (pies, gamification, GPS, per-trip economy, station prices, blended economy, stored taxonomy, forced dashboards, silent mutation, data hostage-taking) carry verbatim per charter D-012.

## 7. Gate questions (what the owner signs)

1. **§6 verdict table** — item by item; income IN is the headline (formal SUPERSEDED entry against the refusals table lands in the ledger on lock).
2. **Preference split (S-12)** — proposal: synced = units, economy format, currency; device-local = appearance, notification delivery, digest hour.
3. **Web-requires-sync stance (§4)** — sign that the local-only floor is carried by the phone apps and the privacy page says so.
4. **Notification default (S-13)** — proposal: phones alert, web never does.

---

## State

- 2026-07-17 · Session 1: doc drafted end-to-end (invariant walk, S-1…S-14, platform deltas, NFR deltas, §G verdicts, gate questions). Status → GATE. Nothing pending inside the phase; everything pending is owner signature.
- 2026-07-17 · Gate: owner locked with no amendments. §6 verdicts stand as written; S-12 split, web-requires-sync stance, and phones-only notifications signed as proposed. Ledger: D-013 → LOCKED, D-014…D-017 added.

## Carry-forward

- Sync unit = record, not document: ids globally unique/stable (S-1); per-record versioning replaces `revision`, all entities (S-2).
- Derived values never sync — economy, totals, current km, cap state, synthesized reminders recompute locally (S-3).
- Monotonicity two-tier: hard at entry vs local trail; post-merge violations flagged in a review queue (import "Review now" pattern) — "flag, never fix" now covers sync (S-4).
- No silent loss: concurrent edits converge deterministically and losing input is surfaced, or merged losslessly (S-5).
- Deletes = tombstones, undo survives sync, cascades atomic, late children flagged (S-6); erase-everything propagates and is durable vs late-returning devices (S-7).
- Recurrence materialization and import both idempotent across devices; record-level dedup required (S-8/S-9). Unknown fields round-trip on the wire (S-10).
- Offline-first: capture identical with no network; sync is background (S-11). Preferences split synced/device-local (S-12); notifications per-device, phones-only proposal (S-13); nothing hard-codes single-actor (S-14).
- Platforms: web = read+edit companion, no capture, only meaningful with sync (floor lives on phones); Android if shipped = capture peer; server = new platform (no user content in logs, no 3rd parties, optional forever, ≤ €25/mo, blob sync priced in Phase 3).
- Privacy page: two-part structure (untouched local default + per-rung truth table §5) — Phase 3 input.
- Scope: income IN; Koi-export re-import + record dedup + a11y pass required; iCloud superseded; rest LATER/parked (§6).

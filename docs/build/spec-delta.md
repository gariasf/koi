# Spec deltas

Amendments and open questions against `koi-core-spec.md` that arise during the build.
`koi-core-spec.md` is product truth and is never edited directly (build ritual); this file
records where the build refines, defers, or flags a spec point, for owner review at a gate.

## S-6 delete model (Build Session 3, D-039..D-045)

### Tombstone sync stance — DECIDED: bucket-filter (D-046, 2026-07-25)
The owner chose **bucket-filter** over the sync-down-and-filter stance S-6 originally shipped.
`infra/powersync/sync_rules.yaml` now selects only live rows (`WHERE deleted_at IS NULL`):

- A delete propagates as a checkpoint **row-removal**, not a tombstone row.
- No "filter `deleted_at IS NULL` everywhere" burden on client queries — a deleted row is
  simply absent from the device, so it cannot leak into the trail/economy/money surfaces.
- Cascade atomicity preserved (one checkpoint removes car + children together).
- Undo still works: the inv.31 toast closure holds the row on the deleting device and
  re-INSERTs it (→ PUT → server clears `deleted_at` → the row re-enters the bucket).
- **H1 (product law) satisfied structurally:** a device enrolled *after* a delete bootstraps
  only live rows, so deleted content never ships to it. No timed purge is relied on for this.

Server-side S-6 logic is unchanged (tombstones still exist in Postgres); only the sync surface
changed. Proven on the real stack — the full 13-scenario torture tier passes with row-removal
semantics.

### S-7 obligations
- ~~Stop shipping tombstone content to new devices~~ — **discharged by bucket-filter (D-046):**
  new devices never receive tombstoned rows.
- Purge must still **sweep `dead_letters`** — they retain full client payloads and may hold
  content a user has asked to erase (D-044).

## S-4 review queue (Build Session 4, D-047)

### "Re-enter" replaces "restore" for a deleted record — NEW, needs owner eyes
The "Review now" pattern (§B3) assumes the flagged record is there to be opened and
fixed. Under the delete model it sometimes is not: a delete wins visibility (D-043),
a car never resurrects via PUT (inv.30), and only the deleting device's own undo
resurrects a reading (D-040). So for `delete-conflict` / `edit-after-delete` /
`write-on-tombstone` / `late-child` the queue shows the values from the flag payload
and offers **"enter it again as a new reading"** — a new record with a new id — and
never offers "restore". This keeps §D5 honest (no promise Koi cannot keep) at the
cost of the user's original id and created-at. The alternative (a privileged
server-side restore op) would be a second write path around the protocol; not built,
recorded here as the road not taken.

### Resolving is a latch, and reversible
`resolved_at` means "I have looked at this", not "this is fixed". Resolved items stay
visible in a Reviewed section — a decision is part of the record, not a deletion —
and a resolve is undoable from its toast (§D7), which clears the latch again.
`archived_at` is still out of the sync rules, waiting for the archive flow.

### The app shell in this build is a stack, not §C's four tabs
Deliberate sequencing, not an amendment: this session's app exists to exercise the
sync contracts and land S-4. Home / History / Insights / Garage + the detached `+`
(§C, §D1) arrive with the app surface (BOARD bucket D). Nothing here forecloses it.

### Flag payloads and H1 — a tension worth naming, not a bug
D-046's H1 guarantee ("a device enrolled after a delete never receives the deleted
content") holds for the RECORD itself — bucket-filter means a deleted car/reading
never ships. It does NOT hold for the record's VALUES once they are preserved on a
flag: `late-child`/`delete-conflict`/`write-on-tombstone`/`edit-after-delete` all
carry a snapshot in `displaced_value`/`incoming_value` specifically so the review
queue can name what happened to a record that is no longer there (D-047's own
justification for leaning on the payload). The `flags` bucket has no delete-based
filter, so that snapshot reaches every device, including ones enrolled after the
original delete. This is inherent to having a review queue at all for
delete-related conflicts — not an oversight — but it means S-7 (D-044's
`dead_letters` sweep) needs a sibling: a retention/purge policy for OLD flag
payloads too, once they age past being reviewable. Not built this session; recorded
so S-7 doesn't rediscover it as a surprise.

### "Enter it again" only covers a reading whose car is still live
The honest re-enter path (above) needs somewhere honest to put the record. When the
reading's OWN car is also deleted (`late-child`, definitionally — and any other
reading-on-a-deleted-car case), Koi does not offer a one-tap re-enter: doing so
under the same (deleted) car would insert it tombstone-born (D-042's own
`insertLateChild` path) and it would vanish from the device a second time,
silently. A car PICKER — "enter it under one of your other cars instead" — is the
honest fix and is app-surface work (capture doesn't exist yet, bucket D); this
session states the limitation instead of building around it.

### Dark mode is owed
§D3 makes dark mode co-primary and explicitly not an inversion pass. The scaffold
ships the light pair only; the authored dark palette belongs with the app surface.

### Deferred to S-4 / S-14
- Flag payloads do not yet carry the **counterparty's identity** (the deleter on an
  `edit-after-delete` flag; the displaced writer's device on `delete-conflict` /
  `column-conflict`). Fine for single-user-multi-device ("your other device"); the S-14
  household review UI ("deleted by Alice, edited by Bob") will want it. The data is captured
  server-side (`deleted_by`, `column_versions.by`) and is retrofittable — no schema trap.
- **Car restore** is a future S-4 signal (a distinguishable op), since cars never resurrect
  via PUT (inv.30). Cascade cohort scoping uses `deleted_via='cascade'` + `car_id`.

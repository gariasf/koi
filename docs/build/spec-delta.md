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

### Deferred to S-4 / S-14
- Flag payloads do not yet carry the **counterparty's identity** (the deleter on an
  `edit-after-delete` flag; the displaced writer's device on `delete-conflict` /
  `column-conflict`). Fine for single-user-multi-device ("your other device"); the S-14
  household review UI ("deleted by Alice, edited by Bob") will want it. The data is captured
  server-side (`deleted_by`, `column_versions.by`) and is retrofittable — no schema trap.
- **Car restore** is a future S-4 signal (a distinguishable op), since cars never resurrect
  via PUT (inv.30). Cascade cohort scoping uses `deleted_via='cascade'` + `car_id`.

# Spec deltas

Amendments and open questions against `koi-core-spec.md` that arise during the build.
`koi-core-spec.md` is product truth and is never edited directly (build ritual); this file
records where the build refines, defers, or flags a spec point, for owner review at a gate.

## S-6 delete model (Build Session 3, D-039..D-045)

### Tombstone sync stance — owner decision wanted (D-045)
S-6 ships **sync-down-and-filter** per the Session 3 brief: `deleted_at` is in the PowerSync
sync rules, tombstoned rows sync down, and clients filter `deleted_at IS NULL`. The
adversarial design review surfaced a cleaner alternative that is worth an explicit decision:

- **Bucket-filter** (`WHERE deleted_at IS NULL` in `infra/powersync/sync_rules.yaml`): a
  delete propagates to peers as a checkpoint **row-removal** instead of a tombstone row.
  - No "filter `deleted_at IS NULL` everywhere" burden on every client query (a single
    missed filter leaks a deleted record back into the trail/economy/money surfaces).
  - Cascade atomicity is preserved (one checkpoint removes car + children together).
  - Undo still works: the inv.31 toast closure holds the row on the deleting device and
    re-INSERTs it (→ PUT → server clears `deleted_at` → the row re-enters the bucket).
  - **H1 (product law):** deleted content never ships to a device enrolled *after* the
    delete. Under sync-down-and-filter, a new phone bootstraps the full content of records
    the user destroyed under inv.30's typed confirm ("There is no undo") until S-7 purges.

The two are functionally equivalent for a device that already held the row; they differ on
the new-device-exposure (H1) and the client-filter burden. Kept as sync-down-and-filter for
now to honor the brief; **owner to confirm or switch to bucket-filter before clients ship.**

### S-7 obligations this stance creates
- Purge must **stop shipping tombstone content to new devices** — either switch to
  bucket-filter, or claw tombstone content off replicas (and out of the bucket) at purge.
- Purge must **sweep `dead_letters`** — they retain full client payloads and may hold
  content a user has asked to erase (D-044).

### Deferred to S-4 / S-14
- Flag payloads do not yet carry the **counterparty's identity** (the deleter on an
  `edit-after-delete` flag; the displaced writer's device on `delete-conflict` /
  `column-conflict`). Fine for single-user-multi-device ("your other device"); the S-14
  household review UI ("deleted by Alice, edited by Bob") will want it. The data is captured
  server-side (`deleted_by`, `column_versions.by`) and is retrofittable — no schema trap.
- **Car restore** is a future S-4 signal (a distinguishable op), since cars never resurrect
  via PUT (inv.30). Cascade cohort scoping uses `deleted_via='cascade'` + `car_id`.

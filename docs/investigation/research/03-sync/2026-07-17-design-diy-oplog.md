# Paper design: Koi on DIY op-log over a blind relay (Actual Budget model) — Phase 3
As-of: 2026-07-17. Reuse target verified today: `@actual-app/crdt` 3.1.0 (npm 2026-06-16, MIT, three small deps) exports the HLC `Timestamp`, base-3 `merkle` trie, and protobuf wire schemas. Hetzner CX22 €5.49/mo since 2026-06-15 (engine brief, verified).

## Topology

iPhone + conditional Android (RN/Expo, op-sqlite) and web (wa-sqlite/OPFS) share one TS sync core — Actual's loot-core layout. Server: a single-tenant Node relay on one VPS storing opaque `MessageEnvelope`s in SQLite, plus a blob endpoint. It stores and forwards, merges nothing, reads only HLC timestamps, envelope sizes, tenant id, IPs — merkle diffs need only cleartext timestamps.

**Keys (e2ee-brief mandate, ente model):** a random 256-bit DEK encrypts all payloads (XChaCha20-Poly1305); a KEK derived from a BIP39 recovery code (Argon2id) wraps the DEK on the relay. Rotating the code re-wraps one blob — no re-encryption.

**Pairing — QR, mnemonic as fallback/recovery.** A new device scans a QR encoding `{relay URL, tenant id, recovery code}`, derives the KEK, unwraps the DEK, syncs from zero; typed mnemonic covers web and the printed backup. Signal-style ephemeral provisioning needs a rendezvous protocol — rejected for v1; KEK indirection keeps that upgrade open.

**Key loss at rung 1:** any surviving device → mint a new code, re-wrap the DEK (a settings action). All devices + code lost → ciphertext worthless, data gone by design; no custodial recovery (it would forfeit the rung). JSON export stays the guaranteed backup; sync is never marketed as backup (delta §5).

**Rung: E2EE-no-accounts.** "Account" degenerates to possession of the recovery code. The privacy page's rung-1 column holds verbatim: no account/email/sign-in; "stored encrypted on our server — we cannot read it"; "contacts only Koi's sync server, only when sync is on"; local-only stays the default. Caveats: relay sees IPs and write-time metadata; web-requires-sync per D-016.

## Record model

One SQLite table per entity — `car`, `odometer_reading`, `fuel_log`, `log_entry`, `plan`, `trip`, `insurance_policy`, `document` (metadata), `reminder`, `income`, `review_resolution`, `settings` — mirrored by an append-only `crdt_messages` log, the actual source of truth.

**Message schema:** Actual's proto verbatim — `Message{dataset, row, column, value}` inside `MessageEnvelope{timestamp, isEncrypted, content}` — with two changes: `value` becomes CBOR `{t, v}` (money in integer minor units, dates ISO) and a `schemaVersion` uint on the envelope. **Op-schema versioning:** messages are immutable forever; evolution is additive-optional columns first (S-10's file rule promoted to the wire), registered upcasters second (pure functions at apply time; stored ops never rewritten); CI keeps fixture logs from every prior version.

**Reusable verbatim (MIT):** HLC Timestamp (maxDrift 60 s), merkle trie, protobuf schemas — the subtlest ~1k lines, ~7 years in production. **Rebuilt:** apply loop (Koi schema, quarantine, invariant watcher), single-tenant relay (~300–500 lines; actual-server is coupled to budget files), crypto layer (Actual's flat password scheme fails the KEK mandate), blobs, epoch protocol, pairing, import.

S-1: device-minted UUIDs; uuidv5 where identity must collapse (below). S-2: the per-cell HLC *is* the version metadata — remote and local edits invalidate equality identically. S-3: derived values (economy, current odometer, cap state, synthesized reminders, review queue) never emit messages. S-10: the apply loop writes known `(dataset, column)` cells to tables, quarantines unknown ones — the message is stored and forwarded regardless, so the log round-trips by construction; after an upgrade, quarantined cells re-apply idempotently.

**Scale / compaction:** ~5k records × ~12 fields + edits ≈ 100–150k messages ≈ 10–20 MB — SQLite noise. Decision: **no compaction, no snapshots in v1**; every device and the relay keep the full log. Fresh-device bootstrap downloads the whole log (a few MB compressed); a snapshot channel ("state blob + messages since HLC t") is specced but built only if a spike measures bootstrap > 30 s on mid-tier hardware.

## The odometer walkthrough (flagship)

**Jul 10, device A, offline.** User logs 50,200 km. `@koi/domain` validates against A's local trail (inv. 9, hard). `KoiStore` writes the row locally and emits four messages (`date`, `km`, `source`, `carId` under the new row id) stamped `Timestamp.send()` into `crdt_messages` + merkle. Saved moment instant, zero network (S-11).

**Jul 12, device B, offline.** 50,150 km. B's trail lacks A's reading; validation passes. Same pipeline.

**Both come online.** Each posts `SyncRequest{merkle, since}`; the relay diffs tries and returns the ciphertext envelopes each peer lacks — it can't merge. B decrypts A's messages; `applyMessages()` runs one SQLite transaction: insert each into the log, write the cell only if its HLC beats the current latest. Two *distinct rows* — no cell conflict; both readings exist verbatim on both devices. Nothing rejected, nothing dropped (S-5).

**Observation point.** `applyMessages()` returns the affected `(dataset, row)` set — merge is Koi-owned code, so the post-merge hook is a function call, not an engine event. The watcher re-derives that car's trail via `@koi/domain`: Jul 10 → 50,200, Jul 12 → 50,150 — inv. 9 violated in stored data.

**Flag, never fix (S-4).** The review queue is derived, never synced (S-3): violation id = hash(carId + offending reading ids), so A and B compute the identical item independently. Both show the Home attention card — "2 odometer readings disagree — Review" (the import "Review now" pattern); the detail names both records and opens either. Resolutions: edit/delete one (a normal synced mutation; delete = undoable tombstone), or "keep both" → a `review_resolution` row under the deterministic violation id — syncs, clears the card everywhere, concurrent dismissals collapse. No auto-repair path exists.

## Where the ~100 invariant tests run

`@koi/domain` is pure TS, zero sync imports: validation, all derivation math, the review queue, the Tier-1 tests. Surfaces: **(a) client on write** — every mutation passes domain validation inside `KoiStore` before any message is emitted; **(b) client post-merge** — the watcher after every `applyMessages()` batch; **(c) server: never** — it holds ciphertext; client-only enforcement is a structural fact — exactly the locked behavior. Bypass-proofing: message construction is private to `KoiStore` (lint boundary — no other module can emit ops); the only write credential is the user's own DEK, so what remains is the single-user threat model. CI adds a multi-client in-memory harness for the sync torture suite plus property-based fuzzing — non-optional with a DIY engine, and the largest single test investment.

## The rest of S-coverage

- **S-6.** Tombstone = LWW `deleted` cell; undo = `deleted=false` by id from any device (toast holds an id, not a closure). Car cascade = child tombstones in one batch = one local transaction; peers anchor atomicity on the parent tombstone (derivations exclude children of tombstoned cars). A record arriving for a tombstoned parent → review queue, not dropped, not resurrected.
- **S-7 vs tombstone GC — resolved.** Default: never GC — retention is cheap at this scale and makes months-offline, undo, and S-10 trivial. GC exists only as an explicit **epoch protocol** (relay keeps `(epoch, mode)` per tenant). **ERASE**: delete all envelopes + blobs + wrapped key, epoch++; a stale-epoch device is refused *before upload*, offers local export, wipes — a months-late phone cannot resurrect the dataset, and rung 1 makes erase provable (ciphertext gone, its key retired). **RESET** (same mechanism): rebuild a fresh log from live state — tombstones and dead cells dropped — under epoch++; late devices re-bootstrap, then re-emit pending ops (original HLCs), orphans flagged per S-6. RESET doubles as inv. 30's "delete purges": until one runs, purged records persist as ciphertext history — the owner signs that tension.
- **S-5.** Field-level LWW merges different-field edits losslessly. Same-cell writes converge by HLC; the losing value survives in the retained log, and the apply loop flags a review item when a remote message displaces (or loses to) a locally-authored unsynced value — "Device B also changed monthly cost — keep which?"
- **S-8/S-9.** Deterministic identity: next occurrence = uuidv5(reminderId+anchor+n); import = uuidv5 over source vehicle id / natural record key (vehicle+date+amount+odometer). Offline twins mint the *same* row ids; LWW collapses them.
- **S-11.** Every write is a local transaction + log append; sync is background catch-up; capture identical offline, online, dead-server.
- **S-12.** Synced prefs = `settings` singleton; device-local prefs in platform storage, outside the log.
- **S-14/D-007.** HLC node ids already distinguish writers; envelopes carry key-ids from day one, so household = a collection key wrapped to each member's public key (ente pattern) + a second relay credential — extension, not rewrite.

## Blobs

Scans/PDFs never enter the log — bytes would replicate forever to every device. Channel: **same VPS, same relay process, separate content-addressed endpoint** (~200–300 lines) — not object storage, which adds a second processor (delta §4) and buys nothing at a few GB. Per file: random key, XChaCha20-Poly1305, key wrapped by DEK into the `document` row, addressed by *ciphertext* hash (plaintext hashes leak equality), lazy-downloaded. Epoch/erase covers the objects. Low hundreds of few-MB files fit CX22's 40 GB disk.

## Migration

From the one-JSON-document export (D-010's bridge and the restore path): `@koi/importer` runs fully client-side, offline. Legacy UUIDs stay as row ids (S-1 holds); derived identities via uuidv5. Fresh install: (1) local-only default, zero network; (2) import legacy JSON → one atomic message batch in dependency order (cars/plans → records → document metadata), dates preserved, soft-flags to review; (3) optional sync-on → mint DEK, show recovery code once with print prompt, wrap to relay, initial push; (4) documents encrypt + upload lazily. Second device: QR pairing then full-log bootstrap. Re-import or two-device import converges via S-9 ids.

## Ops & cost

One CX22-class VPS: Node relay + SQLite + blob dir + Caddy TLS. **€7–9/mo** (VPS €5.49 + IPv4, snapshots €1–2, domain ~€1) — a third of D-009's envelope. Snapshots are safe — everything at rest is ciphertext; the real backup is client-side export. Vendor death: structurally impossible — `@actual-app/crdt` is MIT, vendored at build start; "tooling dies" means *you* fix your own code. The bill: **150–250 h to a trustworthy v1** (crdt reuse shaves ~30–40 h; testing dominates) = **4–6 months of the whole 10 h/week budget, zero Koi feature work**, then permanent sole ownership of the silent-divergence bug class (~0.5–1 h/wk, spiking at schema changes).

## Risks & spike candidates

1. **Convergence fuzz harness** (the go/no-go): 3 simulated clients over the real apply loop; fast-check interleavings, clock skew, months-offline gaps, `ClockDriftError` UX (>60 s skew must not crash). Kill: any divergence whose root cause isn't found and fixed within two sessions.
2. **RN bootstrap/capture perf:** 150k-message bootstrap + decrypt on mid-tier hardware. Kill: bootstrap > 60 s on Wi-Fi, or capture-to-saved regresses vs local-only.
3. **Epoch protocol:** simulated months-late device against ERASE and RESET. Kill: any resurrection or silent-loss path.
4. **Web persistence:** wa-sqlite/OPFS + Safari 7-day eviction + key re-entry. Kill: eviction unrecoverable, or OPFS flaky across browsers.

## Honest weaknesses

- **It is a second product.** 4–6 months before Koi work resumes; Evolu delivers the same rung in ~0 engine-hours. The premium is paid for by learning value — the *last*-ranked criterion.
- No community backstop; convergence bugs are solely mine. The crypto composition is assembled from audited primitives but itself unaudited.
- S-10 quarantine, S-5 surfacing, epoch protocol: all bespoke, each only as good as its tests; Evolu ships the first, verified.
- Per-record physical purge waits for a RESET — weaker than inv. 30's spirit; relay metadata (IPs, timing, sizes) leaks activity patterns absent padding.
- `Plan.carIDs` lineage is whole-cell LWW — a losing concurrent swap needs its own detector, same as Evolu.
- Weakest surface: web — bespoke persistence adapter, evictable keys.

## Adversarial review (2026-07-17)

Method: S-1…S-14 walked against the design's stated mechanisms; engine-capability claims re-verified against primary sources (npm registry, Actual master source). Reuse claim **confirmed**: `@actual-app/crdt` 3.1.0 on npm, MIT, published 2026-06-16, deps exactly `uuid`/`murmurhash`/`@bufbuild/protobuf`, exports `Timestamp`, `merkle`, and `MessageSchema`/`MessageEnvelopeSchema`/`SyncRequestSchema`/`SyncResponseSchema`. The flagship odometer walkthrough is mechanically plausible: apply loop is Koi-owned code, per-cell messages create no cell conflict for two distinct rows, merkle diffs need only the cleartext envelope timestamp, and the deterministic violation id works post-convergence. The architecture survives; the specific mechanisms don't all survive as written.

**Verdict: sound-with-fixes.** No fatal finding — every hole has a fix inside the architecture — but four majors materially grow the build.

### Major

1. **Relay auth is unspecified, and an unauthenticated ERASE is a remote wipe of every device (S-7 weaponized).** The design's only stated write credential is the DEK — but a blind relay cannot verify DEK possession. Nothing says what authorizes upload, download, or the epoch endpoints. Trace the attack: anyone holding (or guessing) the tenant id calls ERASE → relay deletes envelopes, epoch++ → every legitimate device is "refused before upload, offers local export, wipes." The epoch protocol turns unauthorized control-plane access into destruction of all device copies. Fix inside the architecture: derive a server-auth secret from the recovery code alongside the KEK (Standard Notes' masterKey/serverPassword split); authenticate epoch bumps end-to-end (e.g. signed with a key derived from the DEK) so even a compromised relay cannot forge an erase; and make the client wipe require explicit on-device confirmation, never automatic. Adds real scope (~10–20 h) the estimate doesn't carry.
2. **S-7 vs the design's own ops section: a VPS snapshot restore resurrects an erase.** "Snapshots are safe — everything at rest is ciphertext" is false with respect to erase durability: a snapshot taken pre-ERASE contains the envelopes *and* the wrapped DEK; the unchanged recovery code still unwraps it. Worse, the restored relay reverts to the old epoch — a months-offline device at that epoch then syncs *normally* and the dataset is fully resurrected in-app. This is exactly the late-returning-device race S-7 exists to close, re-opened at the ops layer. Fix: an erase journal outside the snapshot lineage (separate volume or append-only remote log) replayed after any restore, plus an honest privacy-page sentence about erase latency vs backup retention. "Rung 1 makes erase provable" must be qualified until this exists.
3. **S-5 surfacing is timing-dependent as written.** The rule "flag when a remote message displaces (or loses to) a locally-authored *unsynced* value" has a race: device B edits the same cell offline, then pushes *before* pulling A's message — by pull time B's value is synced, so the losing/displacing exchange flags nowhere. Result: true concurrent edit, deterministic LWW convergence, losing value preserved only in the log, **never surfaced** — S-5(b) violated on a push-before-pull schedule, which is the common schedule. Root cause: HLCs are totally ordered and carry no causality; "B overwrote after seeing A's value" and "B wrote concurrently" are indistinguishable. Fix: emit the prior cell HLC as a `base` field on each message (a third wire-schema change); apply loop flags whenever an incoming write's base ≠ the value it displaces and the node differs; flag id = hash(cell + both HLCs) so both devices derive the same review item. Material design change + torture-suite scenarios.
4. **S-9's natural-key uuidv5 silently collapses legitimate duplicate records.** Spec §B3: money-only fills are common and kept. Two €20.00 money-only fills, same vehicle, same date, no odometer → identical natural key → identical uuidv5 row id → the second fill vanishes into the first at import. Violates "imports never hard-fail; suspect rows are flagged" and S-5's no-silent-loss. Fix: include the occurrence index within the natural-key group in the uuidv5 input — deterministic for the same CSV on two devices (S-9 holds), stable across re-exports only if the source app preserves row order (test against Tester M's fixture). The S-9 identity scheme needs a redesign pass, not a tweak.

### Minor

5. **S-8's `n` is ambiguous, and one reading breaks it.** If `n` = calendar ordinal from the anchor, two devices resolving a *lapsed* recurring reminder on different offline days catch up to different ordinals → different uuidv5 → two pending occurrences, the exact twin S-8 bans. Define `n` = position in the resolution chain (both devices resolving occurrence *m* mint `n = m+1` → same id; the differing catch-up `dueDate` is then a plain LWW cell that converges).
6. **Re-import after a user edit silently reverts the edit.** Same natural key → same row id → import emits cells with fresh HLCs that beat the user's older correction. The importer must skip emission for row ids already present locally, not blind-write; unstated in the design.
7. **maxDrift misquoted; counter overflow unhandled.** `@actual-app/crdt` master uses maxDrift = 5 min (60 s is jlongster's demo value); spike 1's threshold should say 5 min. Also `Timestamp.send()` throws `OverflowError` at counter 65,535 within one logical ms — after merging from a fast-clocked peer the local HLC is pinned ahead of wall clock, and a ~60k-message import then increments the counter without reset, within ~8% of the limit. Importer should chunk batches and handle `OverflowError`.
8. **"Proto verbatim" oversells — it's three forks, not two, and the walkthrough inverts the protocol.** The verbatim `MessageEnvelope` is `{timestamp, isEncrypted, content}` — no key-id field (`keyId` sits on `SyncRequest`, one per request), so "envelopes carry key-ids from day one" (S-14) is a third schema change beyond CBOR values and `schemaVersion`. And in Actual's protocol the *client* diffs merkles (server returns its trie; client computes the divergence point and re-requests) — "the relay diffs tries" is a design choice for the rebuilt relay, fine, but it must be specced, not inherited.
9. **Entry validation against a disputed trail can block capture.** Post-flag, inv. 9's two-directional hard stop makes *every* backdated entry between the conflicting readings impossible (must be ≥ 50,200 and ≤ 50,150) until the review resolves. Correct by the letter, but an unaddressed capture-blocking UX; the review card should be reachable from the validation error.
10. **Settings singleton identity unspecified.** Two devices minting random row ids for the `settings` singleton never merge; needs a well-known id (the uuidv5 pattern already in the design).
11. **The time headline double-counts the reuse saving.** The 150–250 h base (engine brief) scopes Actual's *flat* crypto; this design mandates KEK indirection + QR pairing + recovery-print UX, which the e2ee brief prices at 30–60 h — roughly cancelling the "crdt reuse shaves 30–40 h" line — and finding 1 adds relay auth on top. Honest headline: 180–300 h, i.e. 5–7 months of the full budget, top of the stated range or past it. €7–9/mo money cost stands (verified price base unchanged).
12. **Household caveat missing:** member *revocation* under a single DEK means re-encrypting the whole log (content-key rotation = full re-encrypt, per e2ee brief). Still extension-not-rewrite (S-14 holds — nothing hard-codes single-actor), but "a collection key wrapped to each member's public key" should carry that cost note, and ERASE authority becomes a shared-fate policy question.

### Net effect

The rung-1 claim survives (recovery-code-derived auth keeps "no account" true), the invariant story survives (walkthrough verified mechanically plausible), offline depth survives. What changes: the wire schema grows a `base` field and per-envelope key-id, the epoch protocol needs authentication plus an erase journal, the S-8/S-9 identity functions need precise definitions and fixtures, and the honest build estimate moves to 180–300 h. All fixes live inside the architecture — but they widen the gap this design must justify against Evolu's ~0 engine-hours at the same rung in the Phase 5 spike.

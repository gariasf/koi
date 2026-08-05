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

## ③ local-only → sync-on migration (Build Session 5, D-052)

### No migration write path exists, by design — the backlog was always there
`init()` has always applied the full synced schema (Session 4 onward), and PowerSync's
own triggers queue every write into the local `ps_crud` table the instant it happens,
regardless of whether anything is connected. So "local-only" is not a separate schema,
database, or code path — it is simply **never having called `connect()`**. Turning sync
on is one call; every write the user ever made while local-only is already sitting in the
queue, in order, keyed by the same base_version machinery a same-device edit always uses
(D-037 law 3: "same-device sequential edits, including the baseless offline
create-then-edit flow, never self-conflict") — because from the server's point of view, a
row created and then edited three months apart while fully offline looks identical to one
created and edited three seconds apart online. No new server logic was needed. Proven, not
just reasoned: `sync-tests/local-first.test.ts` seeds a real backlog (creates, edits, a
delete-then-undo, a car-with-children delete) on an unconnected database, then connects,
then asserts server state directly — every row exactly once, versions correct, zero
missing-base-version or column-conflict flags from the single-device case.

### The in-app sync card's copy — NOT the real privacy page, recorded for the gate
§C8's privacy card ("Your data never leaves this device. No account, cloud sync or
analytics.") is real product copy on the release-gated privacy page (its rewrite is its
own owner-reviewed task, per BOARD bucket F) — this session did not touch it. What exists
now is a stand-in on the garage screen (the real Settings surface is bucket D), and its
copy must not lie in either state:

- **Sync off (default):** "Your data never leaves this device. No account, cloud sync or
  analytics." — identical to §C8's existing line; still true.
- **Sync on:** "This device syncs to your own server, so your other devices see the same
  records. It never leaves servers you run." — deliberately narrower than any privacy-page
  claim: it says WHERE data goes (a server the user runs) and does not repeat "no
  account"/"no analytics" claims that stay true regardless, nor invent an "operator can
  read" disclosure that belongs to the real privacy-page rewrite (D-016's web-requires-sync
  wording note applies there, not here).

Sync can be turned back off (a pause, not an erase): future writes stop uploading, but
nothing already sent is clawed back, and disabling never touches the checkpoint or
generates a synced tombstone-adjacent event. No confirmation dialog either direction —
turning on costs nothing undoable (D-013 §D5 "nothing is fixed silently" is about repairs,
not about consent for an already-opt-in action), and turning off cannot lose data.

### Two independently-local-only devices joining the same household
Proven (`sync-tests/local-first.test.ts`, scenario B): two devices each accumulate their
own local-only history (different cars, different readings, no shared state) and both
connect for the first time. Both backlogs drain; nothing is lost; no id collisions (UUIDv7).
One thing recorded, not solved: if both devices independently added "the same" conceptual
car before ever syncing, the result is two car rows in the garage — an honest outcome, not
a bug (flag-never-fix), and dedup is S-9's import-remap territory, not this migration's job.

### Deferred to S-4 / S-14
- Flag payloads do not yet carry the **counterparty's identity** (the deleter on an
  `edit-after-delete` flag; the displaced writer's device on `delete-conflict` /
  `column-conflict`). Fine for single-user-multi-device ("your other device"); the S-14
  household review UI ("deleted by Alice, edited by Bob") will want it. The data is captured
  server-side (`deleted_by`, `column_versions.by`) and is retrofittable — no schema trap.
- **Car restore** is a future S-4 signal (a distinguishable op), since cars never resurrect
  via PUT (inv.30). Cascade cohort scoping uses `deleted_via='cascade'` + `car_id`.

## Real auth: passkey-primary, recovery codes (Build Session 6, D-053..D-056)

### Where sign-in surfaces — DECIDED: inline with the sync toggle, no separate step
§C8 has never described a login/account screen (D-006's "no account" default). Sync now
requires a real identity, so this session had to decide where that identity gets established
relative to the Session 5 sync toggle (`app/index.tsx`'s "Turn on sync") — a product-surface
call, made explicitly rather than left implicit:

**Tapping "Turn on sync" IS the sign-in step.** There is no separate "sign in" or "set up
account" screen before it. `enableSync` (`src/sync/provider.tsx`) calls `ensureSignedIn`
(`src/auth/flow.ts`) first: it tries registering a passkey (which only succeeds once — the
founding passkey; every later attempt is refused server-side, D-053), and falls back to
signing in with an existing one when the account already has a passkey (a second device, or
the same device after being signed out). Only once that resolves does sync actually connect.
The passkey ceremony itself is a native OS sheet (Face ID/Touch ID), so from the screen's
point of view this reads as one tap with a system prompt in the middle — no new screen was
needed for it. **One new screen WAS needed**: a one-time "save your recovery codes" reveal
(`app/index.tsx`, shown right after a fresh registration succeeds — see D-054), since codes
shown nowhere are useless. Reasoning for "inline, not a separate step": the product has never
had an account concept before, and adding a standalone "Account" surface ahead of the one
thing that needs it (sync) would be a bigger, earlier commitment to that concept than the
brief asked for — this can always grow into a real Settings > Account surface once bucket D
(the real app shell) exists; nothing here forecloses it.

### What a device with no passkey and no recovery-code UI can do — a stated gap
If passkey sign-in AND registration both fail (the account already has a passkey that lives
somewhere this device's iCloud Keychain cannot reach), `ensureSignedIn` throws and the sync
toggle shows the error in the existing `connectError` banner — there is no in-app path to
recovery-code entry (D-054: proven server-side only this session, no client screen). This is
recorded here as a real, current limitation, not silently absorbed into "just tap again."

### First-time setup shows two Face ID prompts — known roughness for bucket D
Registering a passkey does not sign you in (better-auth creates a session only on the
authentication path), so `ensureSignedIn` always follows a successful registration with a
sign-in — two consecutive system prompts the very first time a device turns sync on. A
returning device shows one. Functionally correct and honest, but it reads as a stutter; the
real Settings/onboarding surface (bucket D) should either explain the second prompt or find a
way to avoid needing it. Recorded rather than papered over.

### Two Fastify/better-auth integration findings, useful beyond this session
- The reconstructed `Request` in the Fastify catch-all route must always declare
  `content-type: application/json` for non-GET/HEAD calls, regardless of what the original
  caller sent — omitting it 415s any no-body POST (e.g. a bare bootstrap/ping call) before
  better-auth's own endpoint logic ever runs. Cost real time to find (a hung `test:sync` run,
  not a readable error) — worth remembering if `app.ts`'s catch-all route is ever touched again.
- `betterAuth()`'s return type must NOT be given an explicit `ReturnType<typeof betterAuth>`
  annotation (or any other widened `Auth<BetterAuthOptions>` shape) — it erases the specific
  plugin endpoints (`auth.api.verifyJWT`, `.getToken`, the custom recovery/test-bootstrap
  endpoints) that calling code needs typed. Let `createAuth`'s return type infer naturally from
  the literal `betterAuth({...})` call instead.

## The app surface: the wireframe pass (Build Session 7, D-057..D-059)

The pass itself is `docs/build/wireframes.md` — ASCII/block screens for the four tabs, capture,
record pages, reminders, the vault, onboarding and Settings, plus the required keep/rework/throw
comparison against what `@koi/mobile` already has (§15 there). This section records only the
**amendments to §C** the drawing produced. Everything the wireframes leave open for the owner is
listed in `wireframes.md` §16 and is deliberately *not* recorded here as decided.

### Where the S-4 review queue lives — DECIDED (D-057)
§C's shell is four tabs + the detached `+`; the review queue (D-047) is not in §C at all. It now
**participates in Home's state selection**: `Needs you` fires on an overdue reminder **or** an open
review item; `All clear` requires zero of both. The band renders only when the queue is non-empty,
sits under the reminder hero when both exist, and becomes the hero when nothing is overdue. A flag
gets no Snooze and no Mark done. The queue page is pushed inside the Home tab; Settings ›
`Review notes` is the second, always-present door so resolved items stay reachable. Zero cars wins
the screen. Cap reminders never drive the state. Full reasoning in `wireframes.md` §14.1.

### Where sync + account live — DECIDED (D-058)
§C8's Settings sheet, under a pushed **`Sync`** page (not "Sync & devices" — there is no device
registry). "Turn on sync" remains the sign-in step (unchanged from Session 6, only relocated off the
garage). The recovery-codes reveal moves intact; recovery-code *entry* is wireframed and marked NOT
BUILT (D-054), reachable only from the failed-sign-in banner. Sync is never offered in onboarding.
No sync badge anywhere in the shell (accepted consequence, recorded). Several changes to shipped
copy and behaviour, each because the current version is not true — the privacy card and the erase
dialog carrying **three states, not two** (adversarially reviewed after the pass first drew only
two — see below), no pending count while never synced, `Erase this device` + sync-off-first for any
device that has ever synced, and a sentence for the two-Face-ID stutter. Details and exact strings
in `wireframes.md` §12; reasoning in §14.2.

**The privacy card and the erase dialog are keyed on "has this device ever synced," not on the
toggle — three states, not two** (the release-gated privacy **page** is untouched — bucket F). The
first draft of this pass keyed both surfaces on the sync toggle alone; the adversarial review
caught that this makes them lie the moment a device pauses sync after using it (an account and
server-side records both outlive the pause, per D-052), which is exactly what §H1 calls product law:
- **Never synced (the default):** "Your data never leaves this device. No account, cloud sync or
  analytics. Export any time." — §C8 verbatim, still literally true.
- **Syncing:** "No ads, trackers or analytics. Export any time." + "This device syncs to your own
  server, so your other devices see the same records. It never leaves servers you run." — the second
  sentence is spec-delta's own reviewed wording, unchanged; the first is D-006's floor, which does
  not stop being true when sync is turned on.
- **Paused** (has synced before, sync now off): "No ads, trackers or analytics. Export any time." +
  "Sync is paused. Records you already sent are still on your server." The never-synced claims
  ("no account", "never leaves this device") never return once an account exists — not on this
  device, not by pausing sync, not ever short of the S-7 erase-everywhere this build does not have.
  The erase dialog uses the same discriminator: `Erase this device` (turning sync off first, if not
  already) applies to any device that has ever synced, syncing or paused alike — `Erase everything`
  is reserved for a device that has genuinely never had an account.

### Dark mode — DECIDED (D-059)
Wireframes carry colour **roles**, not palettes. The authored dark palette (plus the
`positive === fuel` fix, the faint-ink contrast fix, and the `StatusBar`/`userInterfaceStyle`
mismatch) is a new bucket-D board item, sequenced before History's build session. The `Appearance`
control has its slot in Settings and ships in the same increment as the palette.

### Amendments to §C the wireframes make

Each of these fills a hole §C leaves; none contradicts it.

- **§C1 Home.** State precedence is a four-row table including the review-queue cases (D-057).
  `Upcoming` vs `Later` (and therefore Coming-up vs All-clear) is defined by **the reminder's own
  earliest advance-alert window** being open — it invents no number, reuses the user's own alert
  configuration, and makes "All quiet for the next few weeks" literally true. Multiple overdue
  reminders render as compact rows under the hero, **never** in `Later` (the label would contradict
  the row). `All clear` gains one quiet `All reminders ›` row — a state that says "quiet, not empty"
  must let you check. The month pulse gets an explicit rule for the current month's km (newest
  reading inside the month minus the last reading at or before its start; no reading inside the
  month → dash + "No readings this month." and no €/km), which is the only reading that never
  invents distance for an unfinished period.
- **§C2 History.** Row anatomy is fixed per record kind (a table in `wireframes.md` §3.2),
  including what the fold rule (inv.7) means for what the feed shows, and it extends the fold to
  service/expense entry odometers. Month whispers describe the **filtered** view, revealed archived
  rows never join them, and a month with records but no money reads "4 records" rather than
  "0,00 €". Filter chips are multi-select within the type dimension, reset on cold launch, survive
  tab switches. A flagged record carries a quiet `{attention}` dot on its own row — otherwise inv.12's
  "the user decides" has no anchor in the ledger.
- **§C3 Insights.** `Where it went`'s top-5 truncation gains an ink `Other (N kinds)` row so the bars
  reconcile with the headline. A page with no records says so instead of showing a `0,00 €` headline.
  Record lists are amount-descending. `All time` keeps the rate as its headline **and** carries the
  lifetime total in its sentence. An empty page inside the range is rendered, never skipped.
  Ownership's subject under a swap lineage, the `≈` on interpolated distance, and `By week`'s
  bucketing are recommendations pending owner sign-off (§16), not decisions.
- **§C4 Garage / car page.** Archived cars are rows, not dimmed photo cards. The attention dot fires
  on overdue-or-over-cap. "Insurance in N days" uses a 60-day window, matching §B1's own advance-alert
  default so the chip and the notification cannot disagree. `Full history ›` switches to the History
  tab with the car scope chip set. The car form's `Remove` requires **the car's name** typed (§I9's
  "demands its name understood"), not a generic word. The car photo gets an entry point (a row at
  the head of the form). The form's odometer field is explicitly the acquisition **baseline**; new
  readings are only ever minted by the odometer sheet.
- **§C5 Capture.** The derived-pill rule is "your last two edits win". A car picker rides in the
  **sheet header**, not the chooser, because capture is entered from four doors and only the sheet is
  common to all of them. Save gates are defined per type. The trip sheet gains §B1's `note` field (a
  persisted field with no door is unreachable data, and the importer writes into it). Decimal
  precision is fixed per unit (€ 2 · L 2 · €/L 3 · km 0) with the decimal key disabled on odometer
  wells. A dirty guard **wins** over a notification deep-link's modal teardown — a half-typed fill is
  unrecoverable, a notification is still in Notification Center.
- **§C6 Record pages.** Which kinds get a Computed panel is fixed (a table in `wireframes.md` §8.1),
  and a "part of June's total" line is explicitly **refused** — it would give one figure two homes.
  The fuel panel gains a **composition line** ("Includes this fill and 1 partial before it.") because
  the basis line's litres are the interval's, not the fill's, and without it two litre figures on one
  page look like a bug. Two degraded states are added for cases the domain and the importer actually
  produce: chain-not-started, and a money-only fill. The verdict reuses inv.4's ±5% dead band so the
  record page and the fuel lens cannot disagree about "your usual". A fill's delete confirmation gains
  a third clause: **the next fill's interval is measured again**. The milestone set is fixed at eight
  kinds, and an import is explicitly not one.
- **§C7 Reminders.** A synthesized cap reminder is read-only with **no detail page** — its row pushes
  the car page, where the gauge already lives. The detail gains an **`Anchor` row**, without which
  inv.32's "never scheduled into the past" and "a 31st anchor never decays" are unverifiable by the
  user. Zero alerts is legal and says "no alerts" plainly. A km target behind the current odometer is a
  **soft** confirm. The pre-prompt fires after `Save → dismiss → toast`, because §D1 forbids a sheet
  presenting another. A morning-digest tap lands on the reminders list (a bundled note has no single
  target). A per-reminder occurrence history is **refused** — it would need a column.
- **§C8 Vault / onboarding / settings.** The vault's user-facing title is **"Insurance & papers"**
  ("vault" stays internal), reached by **one** Care row rather than §C4's two. The renewal flow gains a
  post-date string and a third action, **"It lapsed"** — otherwise a genuinely lapsed policy can only
  be recorded as a fake renewal. `InsurancePolicy.premium` is a **fact, never a charge** (the inv.15
  purchase-price pattern), so the same money cannot be counted twice. Onboarding's three fields are
  make / model / fuel type, and the one local suggestion is anchored to **"the first car exists"**
  rather than to "onboarding ran" (a user who skips beat 2 would otherwise burn it unshown). A
  signed-in second device with no records yet reads "Waiting for your records to arrive." instead of
  "Add your car to begin", which is the cheapest possible prevention of the duplicate-car outcome
  D-052 scenario B documents. Unit and currency rows show no example at all when there is no number to
  convert. The currency page repeats that it relabels and never converts. Export rows carry "Exports
  what's on this device." while sync is on and the queue is non-empty. A faint version row sits at the
  foot of the sheet — with no analytics and no crash reporting, the user is the only telemetry channel.

### Two facts about the spec's own text, so they are not re-derived
- **Article 7 is already renegotiated** (D-012: articles 1–6 and 8 hold verbatim, article 7 within
  D-005/D-006). The binding text for any surface that touches sync or accounts is **D-006's privacy
  floor**, not article 7's "no accounts, no servers, no network calls… permanent". The public
  reconciliation is the bucket-F privacy-page rewrite.
- **Income tracking is IN scope** (D-008/D-014 formally superseded the refusals-table income row). It
  has no surface yet, and `wireframes.md` §16 #9 says why it stays off the capture chooser for the
  shell build — plus the colour-law collision it will bring (the income sketch wants the *positive*
  hue, which §D3 reserves).
- **H2's "one JSON document" no longer describes persistence** (the build is SQLite via PowerSync), so
  "Export JSON" is a *generated* full-fidelity document rather than a copy of the store, and H2's
  `.corrupt` backup behaviour does not describe reality. No surface change; recorded so nobody wires
  Export JSON to a file that does not exist.

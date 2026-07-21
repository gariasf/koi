# E2EE approaches (cross-cutting) — Phase 3 sync landscape brief
As-of: 2026-07-17

## What it is
Not an engine — the encryption-layer question that gates Koi's #1 criterion. Whatever engine is picked, E2EE means: content keys exist only on devices; the server stores/forwards ciphertext. The design space is (a) how the key is born, (b) how devices share it, (c) what a blind server costs in features. Prior art is mature and audited (Signal, Bitwarden, Standard Notes, ente, Actual Budget); the local-first-specific integrations are younger (Evolu shipping; Ink & Switch Keyhive/Beelay pre-alpha, unaudited, project window 2024–2026).

## Key models
- **Passphrase-derived (KDF)** — Bitwarden: PBKDF2-600k default (Argon2id optional) over the master password; master key never leaves the device (whitepaper, accessed 2026-07-17). Standard Notes 004: Argon2id (64 MiB, 5 iter) → root key split into local masterKey + serverPassword; random *items keys* wrapped by masterKey; XChaCha20-Poly1305 payloads. Human secret ⇒ brute-force bounded only by the KDF; works on every platform including web.
- **Generated high-entropy key / mnemonic** — Evolu: data encrypted with a key derived from an auto-generated BIP39 mnemonic; second device joins via `evolu.restoreAppOwner(mnemonic)`; no account, relay sees only OwnerId, timestamps, encrypted blobs, IPs, with PADMÉ padding vs traffic analysis (evolu.dev/docs/privacy, accessed 2026-07-17). No KDF-brute-force worry; the mnemonic *is* the recovery code — lose it with all devices and data is gone.
- **Device keys + pairing (no human secret)** — Signal: new device shows a QR with a provisioning address + ephemeral Curve25519 pubkey; primary sends an encrypted provisioning message (keys, account info, one-time linking token); history transfers via a one-time 256-bit AES key (signal.org blog, accessed 2026-07-17). Best UX; requires an existing device online, plus a separate encrypted-backup story or total-loss = total-loss.
- **Platform keychain** — store the sync key as a synchronizable iCloud Keychain item: zero-UX multi-device on Apple hardware, but useless for Android/web, and trusts Apple's recovery HSMs. Fine as a *convenience layer* over a mnemonic, not as the only copy.

**Recovery/rotation done right (ente, accessed 2026-07-17):** masterKey (random) wrapped by a KEK derived from the password (Argon2id, SENSITIVE limits); a recoveryKey is generated at signup and stored wrapped by masterKey. Password change = re-wrap masterKey only, no data re-encryption; forgotten password = decrypt via recoveryKey. Contrast Actual Budget's flat model: key derived directly from password, "you will not be able to recover your data if you forget your encryption password", encryption is one-way, and each device just re-enters the same password (actualbudget.org docs, accessed 2026-07-17). **Lesson: use KEK→DEK indirection from day one** — indirection is what makes rotation and recovery codes cheap, and it needs no account, only an opaque wrapped-key blob on the relay.

## What a blind server costs
- All invariant checks run client-side — no server hook, no server-side merge. For Koi this *aligns* with the locked "flag, never fix": post-merge, each client re-runs the shared TS invariant package over affected cars and queues violations. The odometer answer is concretely **yes, client-on-merge**, and it's the only place it can run.
- No server-rendered web, no "log in from any browser": the web client must obtain the key (passphrase entry or QR pairing) before showing anything.
- No password reset that preserves data — unless the KEK/recovery-code layer above exists.
- No server-side search/index/dedupe; reminders must fire from device-local scheduling or content-free pushes.
- Web key handling: WebCrypto non-extractable CryptoKey in IndexedDB prevents key *export*, but XSS can still *use* the key; and Safari ITP deletes script-writable storage (incl. IndexedDB) after 7 days without interaction — home-screen-installed web apps are exempt (webkit.org/blog/10218, accessed 2026-07-17). So the web companion must treat local keys as evictable and re-derivable from the passphrase/mnemonic, never the sole copy.
- Blobs: encrypt-then-upload with a random per-file key wrapped by the master key (ente's model); content-addressing by plaintext hash leaks equality — address by ciphertext hash. Erase-everything = delete all owner blobs + bump a sync epoch so a device returning months later discards instead of resurrecting; crypto-erasure (destroy the key) covers backups. Evolu ships `resetAppOwner()`; Actual ships "reset sync key".
- Household sharing later: per-member public keys wrapping a shared collection key (ente collections) is the proven simple path; BeeKEM/Keyhive CGKA is the research-grade path (pre-alpha, no audit, accessed 2026-07-17). Put a key-id field in the envelope now (S-14).

## Which engine classes compose with E2EE
- **Dumb-relay oplog (DIY/Actual-style, Evolu): yes** — server stores opaque messages; the whole prior-art stack applies.
- **CRDT message relays (Automerge/Yjs over a blob relay): yes**; Beelay is building exactly this, but pre-alpha.
- **Server-side-SQL engines: partially/no.** Electric "syncs ciphertext as well as plaintext" but shape where-clauses need plaintext routing columns (electric.ax/docs/guides/security, accessed 2026-07-17); PowerSync has an official envelope-encryption pattern → **E2EE-with-account**, forfeiting server validation (blog 2025-10-08); Zero and InstantDB evaluate queries/permissions server-side → **no E2EE possible**.

## Fit vs Koi criteria
1. **Privacy 5/5** — this layer is what reaches **E2EE-no-accounts** (mnemonic + blind relay, Evolu/Actual model); cost = recovery burden on the user unless KEK+recovery-code is built. 2. **Invariants 4/5** — client-on-merge only, which matches the locked behavior; no server backstop. 3. **Offline 4/5** — orthogonal; the classes that accept E2EE (oplog/CRDT relays) are also the deep-offline ones. 4. **Solo maintainability 3/5** — crypto plumbing (envelope format, KDF, wrapped keys, QR pairing, blob pipeline) is real bespoke work unless adopting Evolu wholesale; libsodium/WebCrypto exist for RN+web. 5. **Cost 5/5** — blind relays are the cheapest server class (€5/mo VPS). 6. **Maturity 4/5** — the cryptographic patterns are audited and old; the TS local-first packagings are young (Evolu MIT, ~1.9k stars, @evolu/common 7.4.1 2025-11-29, small bus factor; Keyhive unaudited).

## Cost sketch
No fee of its own: rides on relay/VPS (€5–8/mo incl. blob storage). Time cost: ~30–60 h for a DIY KEK/recovery/pairing layer atop an oplog; ~0 h if Evolu's model is adopted as-is (then bound to Evolu's flat-mnemonic recovery UX).

## Red flags
- Unrecoverable-by-design data loss (Actual's model) if KEK/recovery indirection is skipped.
- Web clients: XSS can use stored keys; Safari 7-day eviction of IndexedDB for non-installed sites.
- E2EE forecloses server-side validation forever — acceptable for Koi, but one-way.
- Keyhive/Beelay not production-usable; don't wait for it.
- Content-key rotation under any model = full re-encrypt (Standard Notes mitigates via progressive re-encryption).

## Verdict
**Shortlist (as the required layer, not an engine)** — E2EE over a dumb-relay oplog is the only route to Koi's top privacy rung; mandate KEK→DEK indirection + printed recovery code + Signal-style QR pairing, and strike server-side-SQL engines from any E2EE-no-accounts path.

## Sources
- https://www.evolu.dev/docs/privacy + https://github.com/evoluhq/evolu — BIP39 mnemonic, blind relay, PADMÉ, restore/reset owner; MIT, 7.4.1 2025-11-29 (accessed 2026-07-17)
- https://ente.com/architecture — masterKey/KEK/recoveryKey, Argon2id, cheap password change (accessed 2026-07-17)
- https://github.com/standardnotes/snjs/blob/main/packages/snjs/specification.md — 004 spec: Argon2id, XChaCha20-Poly1305, items keys, progressive re-encryption (accessed 2026-07-17)
- https://actualbudget.org/docs/getting-started/sync/ — password-derived key, unrecoverable, one-way (accessed 2026-07-17)
- https://bitwarden.com/help/bitwarden-security-white-paper/ — PBKDF2-600k/Argon2id, HKDF stretch (accessed 2026-07-17)
- https://signal.org/blog/a-synchronized-start-for-linked-devices/ — QR provisioning + one-time history key (accessed 2026-07-17)
- https://electric.ax/docs/guides/security — "syncs ciphertext as well as plaintext" (accessed 2026-07-17)
- https://docs.powersync.com/client-sdks/advanced/data-encryption — envelope pattern (accessed 2026-07-17); Zero/InstantDB/PowerSync/Electric details per sibling briefs in this folder
- https://www.inkandswitch.com/keyhive/notebook/ + https://github.com/inkandswitch/keyhive — BeeKEM/Beelay, pre-alpha, unaudited (accessed 2026-07-17)
- https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/ — 7-day script-writable storage cap; home-screen exemption (accessed 2026-07-17)

## Verification (adversarial, 2026-07-17)

Method: every load-bearing claim re-checked against primary sources (official docs, specs, source code, npm registry, GitHub API), not the brief's citations alone. Result: no claim refuted; four citation-level corrections; verdict stands.

**Confirmed**
- Bitwarden: PBKDF2-SHA256 600,000 iterations default; Argon2id selectable after account creation; "The Master Key and Stretched Master Key are never stored on or transmitted to Bitwarden servers." — https://bitwarden.com/help/bitwarden-security-white-paper/
- Standard Notes 004: Argon2id memory 67,108,864 B (64 MiB), 5 iterations; root key halves = `masterKey` + `serverPassword`; random `itemsKey` encrypted with `rootKey.masterKey`; XChaCha20+Poly1305 (256-bit key, 192-bit nonce); progressive re-encryption on item modification is verbatim in the spec. — https://raw.githubusercontent.com/standardnotes/snjs/main/packages/snjs/specification.md
- Evolu key model: source (`packages/common/src/local-first/Owner.ts`) imports `@scure/bip39`; `OwnerSecret` (32 B entropy) ↔ mnemonic via `entropyToMnemonic`; `createAppOwner`, `restoreAppOwner`, `resetAppOwner` all present in code; docs confirm `evolu.restoreAppOwner(mnemonic)` restore flow. Relay view "OwnerId, Timestamps, Encrypted binary blobs, IP addresses" and PADMÉ padding verbatim on the privacy page. — https://github.com/evoluhq/evolu, https://www.evolu.dev/docs/privacy
- Evolu health: MIT, 1,866 stars, repo pushed 2026-07-16 (active); npm `@evolu/common` latest stable 7.4.1 published 2025-11-29 (as brief states). Bus factor confirmed hard: steida has 2,605 of ~3,000 commits (~85%); next human contributor has 109. — GitHub API, https://registry.npmjs.org/@evolu/common
- Signal linking: QR carries provisioning address + "locally-generated Curve25519 keypair" public key; encrypted provisioning message with "shared keys, account information, and a one-time-use linking token"; history archive encrypted with "a strong, random, one-time-use 256-bit AES key". — https://signal.org/blog/a-synchronized-start-for-linked-devices/
- ente: random masterKey wrapped by KEK derived with Argon2id at `OPSLIMIT_SENSITIVE`/`MEMLIMIT_SENSITIVE` (progressive fallback halves memory); recoveryKey and masterKey "encrypted with each other" and stored server-side; password change re-uploads only a new encryptedMasterKey (no data re-encryption); per-file random fileKeys wrapped by collectionKey; sharing = collectionKey sealed to recipient publicKey (`crypto_box_seal`). — https://ente.com/architecture
- Actual Budget: key generated from password; "you will not be able to recover your data if you forget your encryption password"; "It is not possible to turn off encryption. This is a one way process."; key reset (sync reset + new key) exists if a local copy survives; other devices re-enter the same password. — https://actualbudget.org/docs/getting-started/sync/
- Safari ITP: deletes "all of a website's script-writable storage after seven days of Safari use without user interaction on the site", IndexedDB explicitly listed; home-screen web apps "have their own counter" and data deletion there is treated as "a serious bug". — https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
- WebCrypto: `extractable=false` blocks only `exportKey`/`wrapKey`; the key remains usable for encrypt/decrypt/sign by any same-origin script — the XSS-can-use-the-key claim holds. — https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey/extractable
- Electric: "Electric syncs ciphertext as well as it syncs plaintext" verbatim on the security guide. The brief's `electric.ax` domain is current — electric-sql.com now 301-redirects to it. — https://electric.ax/docs/guides/security
- Zero: permissions/queries evaluated server-side via Context passed to server query/mutator functions; server reads row data (e.g. `prev.authorID` checks) — E2EE incompatible as claimed. — https://zero.rocicorp.dev/docs/permissions
- InstantDB: "On the backend every object that satisfies a query will run through the `view` rule"; rules reference `data`/`newData` field values — server reads plaintext, E2EE incompatible as claimed. — https://www.instantdb.com/docs/permissions
- Keyhive/Beelay: "DO NOT use this release in production applications"; "This code has also not been through a security audit"; pre-alpha crates released 2025-03-10; repo still active (pushed 2026-07-09, 227 stars, Apache-2.0). — https://www.inkandswitch.com/keyhive/notebook/, https://github.com/inkandswitch/keyhive
- iCloud Keychain: `kSecAttrSynchronizable` items sync through iCloud; since iOS 14/macOS 11 the keychain syncs cryptographic keys (not just passwords); tvOS excluded. — https://developer.apple.com/documentation/security/ksecattrsynchronizable
- PowerSync blog date/pattern: "Building an E2EE Chat App with PowerSync + Supabase" published 2025-10-08; syncs an opaque cipher envelope (algorithm, aad, nonce, ciphertext, KDF params) in raw-table columns, decrypted into local mirror tables. PowerSync requires authenticated sync (JWT), so "E2EE-with-account" is fair. — https://www.powersync.com/blog/building-an-e2ee-chat-app-with-powersync-supabase

**Corrected (citation-level; no substance change)**
- PowerSync citation: the cited docs page (https://docs.powersync.com/usage/use-case-examples/data-encryption — note the client-sdks path in the brief resolves there) mentions E2EE only in passing and does **not** describe the envelope pattern; the envelope pattern lives in the 2025-10-08 blog post above. Substance of the claim is correct; the pointer was to the wrong document.
- Electric "shape where-clauses need plaintext routing columns": **not stated** on the cited security page — it is an inference. It is, however, sound: the shapes guide confirms "Electric evaluates where clauses when processing changes from Postgres and matching them to shape logs," i.e. server-side evaluation over column values, so filter columns cannot be ciphertext. — https://electric.ax/docs/guides/shapes
- Standard Notes source: the `standardnotes/snjs` repo has been **archived (read-only) since 2022-07-06**; the 004 spec is frozen there but remains the canonical protocol. Context: Standard Notes was acquired by Proton (announced 2024-04-10) and remains open source. Fine as pattern prior art; don't treat snjs as a live dependency. — https://github.com/standardnotes/snjs, https://proton.me/blog/proton-standard-notes-join-forces
- Evolu privacy-page citation over-reaches slightly: that page confirms the relay view and PADMÉ but does **not** mention BIP39/`restoreAppOwner`/`resetAppOwner`; those are confirmed in source code and other docs pages (see Confirmed above). Added nuance for maturity scoring: stable `@evolu/common` has had no release since 7.4.1 (2025-11-29); v8 is in prerelease (`8.0.0-next.5`, 2026-05-07), signalling API churn ahead for anyone adopting now.

**Unverifiable**
- Time-cost estimate (~30–60 h DIY KEK/recovery/pairing layer) — researcher's judgment, not checkable against sources; magnitude is plausible given the scope listed.

**Verdict check:** the shortlist verdict rests on (a) blind-relay/oplog + E2EE being proven prior art — confirmed across five audited products; (b) server-side-SQL engines being E2EE-hostile — confirmed for Zero/InstantDB (impossible) and Electric/PowerSync (plaintext routing columns / account required); (c) KEK→DEK indirection making recovery cheap — confirmed via ente and Standard Notes specs. No basis found to move the verdict in either direction.

# @koi/domain

Koi's pure domain core — the one package every client and the server import.
Dependency-free, deterministic, engine-agnostic: the same inputs produce
**byte-identical** results under V8, JSC and Hermes (Spike Ⓒ, D-030). It runs
client-side on every write and server-side on every upload (D-022): "flag, never fix".

## The purity contract (D-025)

No ambient time, no locale, no timezone, no randomness, no crypto, no I/O:

- **Money** — integer minor units under `Number.isSafeInteger` guards; parsing and
  formatting take explicit separator conventions (inv.20: `"20.000"` es-ES is 20000,
  never 20.0).
- **Civil dates** — plain `YYYY-MM-DD` strings, proleptic-Gregorian integer math.
  No `Date`, no DST. Cycle anchors clamp on short months and never decay (inv.13/24).
- **Ordering** — NFC-normalize, then compare by Unicode code point. Never
  `localeCompare`: collation is engine/OS-dependent; merges must recompute
  identically everywhere.
- **Ids** — injected (`IdSource`), never generated here. UUIDv7 lexical order ==
  creation order.
- **Economy** — L/100km full-tank → full-tank only; a broken chain yields no number,
  never a wrong one (inv.1–3).

Enforced twice: ESLint bans (`eslint.config.js` — Intl/Date/tz/crypto/locale
methods/`Math.random`, load-bearing, not style) and the golden-vector suite below.
`date-fns` v4 is the only sanctioned calendar dependency (D-025) for future
bucket-level logic; the primitives deliberately need none of it.

## Golden-vector conformance (Spike Ⓒ)

`conformance/vectors.ts` re-runs the spike's 11 vectors through the real API; the
canonical JSON must stay byte-identical to `conformance/golden.json`
(md5 `f93b1d6b1717043d97f16b0a17416681`, 720 bytes). A diff is a
cross-engine-convergence event to investigate, never a fixture to update casually.

```sh
pnpm test                # Vitest (V8) — includes the byte-identity assertion
pnpm conformance         # bundled vectors under node
pnpm conformance:all     # node + macOS jsc + hermes (~/.jsvu/bin/hermes or $HERMES_BIN)
```

Still owed (BOARD bucket C): the **on-device, RN-bundled Hermes** run — lands with
the `@koi/mobile` app; CI's standalone-Hermes job is the spike's proxy, not the
discharge of that obligation.

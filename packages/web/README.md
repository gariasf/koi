# @koi/web — skeleton

Becomes the read-mostly web companion: Vite + React SPA + TanStack Router, served as
static `dist/` behind Caddy, zero runtime server process (D-025). Scope is locked
(D-016, delta §4): read + occasional edits, **no capture**; import console; full
export; WCAG 2.2 AA. Only meaningful with sync enabled — the privacy page must say so.

Charts: Recharts, sharing only TS series-building selectors with mobile
(Skia-on-web refused, D-026). Boarded risk: Safari-ITP evicts the PowerSync web DB
after ~7 idle days → re-auth/re-sync recovery UX (bucket D).

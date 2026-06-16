# Koi — marketing site

Two-page static brochure site for **Koi**, the calm iOS car-companion app.
No build step, no framework, no backend — plain HTML + one CSS file.

- `index.html` — landing (hero, Glance preview, features, "Private by default", CTA, footer)
- `privacy.html` — privacy policy (local-first, plain language)
- `styles.css` — tokens, bundled Geist / Geist Mono `@font-face`, all components
- `favicon.svg` — the sage ripple mark · `assets/icon.png` — app icon (apple-touch / OG)
- `assets/fonts/**` — Geist + Geist Mono (woff2)

## Preview
Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000   # → http://localhost:8000
```

## Deploy
Any static host. For **GitHub Pages**: push, then Settings → Pages → Source: `main` / root.
The site is fully relative-linked, so it also works from a subpath.

## Before launch — replace placeholders
- **App Store buttons** (`href="#"` in both CTAs) → the real App Store URL once live.
- The privacy copy describes a **strictly local-first app** (no account, no servers, on-device
  only). If the shipped app ever adds cloud sync, accounts, or analytics, **rewrite the policy
  to match** before that ships, and bump the "Last updated" date.
- Contact is `accounts@gariasf.com` (privacy page). Update if it changes.

## Design
Warm-paper canvas (`#F4F2EC`) + sage accent (`#7C8B6F`) over the Sure design language —
Geist type, flat surfaces, soft shadow + 1px hairline borders, no gradients (one decorative
sage "bloom" behind the hero mark). Sentence case; numbers in Geist Mono. Recreated from the
high-fidelity comps in `../site_handoff_koi/`.

# Koi — marketing site

Static brochure site for **Koi**, the calm iOS car-companion app. Plain HTML + one CSS file, no
framework, no backend. Localized in **English, Spanish, Catalan, Norwegian and French**, generated
from a single source so the languages stay in sync.

## How it works

The served pages are **generated** — don't hand-edit `index.html` or `*/index.html`.

- `translations.json` — the source of truth: every string, per locale (`en` is canonical).
- `tools/build.py` — renders each page once per locale into static HTML with baked-in `<html lang>`,
  reciprocal `hreflang` (+ `x-default`), per-locale `<title>`/meta/OG, a crawlable language switcher,
  and a tiny pre-render autodetect redirect on the English (x-default) page.
- `styles.css` — tokens, the bundled Geist / Geist Mono `@font-face` (only the weights in use), all components.
- `404.html`, `robots.txt`, `sitemap.xml`, `site.webmanifest` — static.
- `assets/` — fonts (woff2), the Glance screenshot, icons, and the 1200×630 `og.png`.

```sh
python3 tools/build.py          # regenerate all locales after editing translations.json or the templates
python3 -m http.server 8000     # preview → http://localhost:8000  (paths are root-absolute)
```

Output: `/` + `/privacy-policy/` (English, x-default) and `/{es,ca,nb,fr}/` + `/{…}/privacy-policy/`.
A first-time visitor is redirected to their browser language; the switcher (footer) overrides and
persists the choice.

## Deploy

**GitHub Pages**, custom domain `koi.gariasf.com` (the `CNAME` file). Settings → Pages → Source
`main` / root, **Enforce HTTPS on**. The repo must stay **public** — free Pages won't serve a private
repo. Commit the generated HTML (no build runs on Pages).

## Before launch — replace placeholders

- **App Store**: the CTA is "Coming soon to the App Store" — swap to the real App Store link (and add
  it to the JSON-LD `installUrl`) once live.
- The privacy copy describes a **strictly local-first app**. If the app ever adds cloud sync, accounts
  or analytics, rewrite the policy (and the per-locale strings) and bump the "Last updated" date.
- Contact is `hello@gariasf.com` (obfuscated in markup; JS reveals it).

## Design

Warm-paper canvas (`#F4F2EC`) + sage accent (`#7C8B6F`): Geist type, flat surfaces, soft shadow + 1px
hairlines, no gradients (one decorative sage "bloom" behind the hero mark). Sentence case; numbers in
Geist Mono.

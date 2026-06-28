# koi-site

The website for Koi, a calm iOS car companion. Live at
[koi.gariasf.com](https://koi.gariasf.com).

A small [Hugo](https://gohugo.io) site in English, Spanish, Catalan, Norwegian
and French. No backend, no tracking; the only JavaScript is the language memory,
the contact-address builder, and the screens carousel.

## Run

```sh
hugo server        # live preview at http://localhost:1313
hugo --gc --minify # build into public/
```

Hugo extended is not required. The version the site is built with is pinned in
`.github/workflows/deploy.yml`.

## Where things live

- `i18n/<lang>.toml` holds every string, one file per locale (`en` is the source).
- `layouts/` are the templates: `index.html` (home), `privacy-policy/list.html`,
  the `_default/baseof.html` shell, and the `partials/` (head, langbar, carousel, scripts).
- `content/` are thin per-language stubs so each page exists in each locale; the
  copy comes from `i18n/`, not from these files.
- `assets/styles.css` is run through Hugo's pipeline (minified, fingerprinted), so
  the served filename changes with its contents and never gets stuck behind a CDN cache.
- `static/` is served as-is: `assets/` (fonts, screenshots, icons), `CNAME`,
  `favicon.svg`, `404.html`, `robots.txt`, `site.webmanifest`.
- `hugo.toml` is the config: languages, output formats, sitemap.

Hugo handles the per-locale routing (`en` at the root, the rest under `/<lang>/`),
the reciprocal `hreflang` links, and the sitemap. The first-visit redirect to the
browser's language lives in `partials/head.html` and runs only on the English page.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds with Hugo
and publishes to GitHub Pages. The custom domain comes from `static/CNAME`; HTTPS
is enforced. Nothing generated is committed (see `.gitignore`).

## Design

Warm-paper canvas (`#F4F2EC`) with a sage accent (`#7C8B6F`). Geist type, flat
surfaces, a soft shadow and 1px hairlines, no gradients beyond one quiet "bloom"
behind the hero mark. Sentence case, numbers in Geist Mono.

## License

[MIT](LICENSE).

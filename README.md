# koi-site

The website for Koi, a calm iOS car companion. Live at
[koi.gariasf.com](https://koi.gariasf.com).

Plain HTML and one stylesheet, in English, Spanish, Catalan, Norwegian and
French. No framework, no backend, no tracking.

## Build

The served pages are generated, so edit `translations.json` or the templates in
`tools/build.py`, not the HTML.

```sh
python3 tools/build.py        # regenerate every locale
python3 -m http.server 8000   # preview at http://localhost:8000
```

`build.py` writes one set of static pages per language, each with the right
`lang`, reciprocal `hreflang`, localized title and metadata, a language
switcher, and a first-visit redirect to the browser's language.

## Layout

- `translations.json` holds every string, per locale (`en` is the source).
- `tools/build.py` is the generator.
- `styles.css` is the design system: tokens, the bundled Geist faces, the components.
- `index.html` and `*/index.html` are generated; do not edit them by hand.
- `404.html`, `robots.txt`, `sitemap.xml`, `site.webmanifest` are static.
- `assets/` holds the fonts, app screenshots, and icons.

## Deploy

GitHub Pages from `main`, custom domain via the `CNAME` file, HTTPS enforced.
Commit the generated HTML; nothing builds on Pages, so the repo stays public to
serve.

## Design

Warm-paper canvas (`#F4F2EC`) with a sage accent (`#7C8B6F`). Geist type, flat
surfaces, a soft shadow and 1px hairlines, no gradients beyond one quiet "bloom"
behind the hero mark. Sentence case, numbers in Geist Mono.

## License

[MIT](LICENSE).

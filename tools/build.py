#!/usr/bin/env python3
"""Static i18n generator for the Koi marketing site.

Renders every page once per locale into plain HTML with baked-in <html lang>, reciprocal
<link rel="alternate" hreflang> (+ x-default), per-locale <title>/meta/OG, a crawlable language
switcher, and (on the English/x-default page only) a tiny pre-render autodetect redirect.

Source of truth: translations.json. No framework, no runtime text-swapping, no server.
Run from the site root:  python3 tools/build.py
"""
import html
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGIN = "https://koi.gariasf.com"
LOCALES = ["en", "es", "ca", "nb", "fr"]
LABELS = {"en": "EN", "es": "ES", "ca": "CA", "nb": "NB", "fr": "FR"}
OG_LOCALE = {"en": "en_US", "es": "es_ES", "ca": "ca_ES", "nb": "nb_NO", "fr": "fr_FR"}

T = json.load(open(os.path.join(ROOT, "translations.json"), encoding="utf-8"))


def loc_prefix(locale):
    return "" if locale == "en" else f"/{locale}"


def page_url(locale, page):
    # page: "home" -> "/", "privacy" -> "/privacy-policy/"
    base = loc_prefix(locale) + "/"
    return base if page == "home" else f"{loc_prefix(locale)}/privacy-policy/"


def hreflang_block(page):
    out = []
    for lc in LOCALES:
        out.append(f'<link rel="alternate" hreflang="{lc}" href="{ORIGIN}{page_url(lc, page)}">')
    out.append(f'<link rel="alternate" hreflang="x-default" href="{ORIGIN}{page_url("en", page)}">')
    return "\n".join(out)


def switcher(current, page):
    items = []
    for lc in LOCALES:
        cur = ' aria-current="true"' if lc == current else ""
        items.append(f'<a hreflang="{lc}" href="{page_url(lc, page)}" data-lang="{lc}"{cur}>{LABELS[lc]}</a>')
    return '<nav class="langbar" aria-label="Language">' + "".join(items) + "</nav>"


AUTODETECT = """<script>
/* Pre-render redirect: send a first-time visitor to the page in their browser language.
   Runs only on the English (x-default) page; an explicit choice (saved by the switcher) wins. */
(function(){try{
  var saved=localStorage.getItem("koi_lang");
  if(saved){ if(saved!=="en"){ location.replace("__SELF_PREFIX__"+saved+"/__REST__"); } return; }
  var L=navigator.languages||[navigator.language||""];
  for(var i=0;i<L.length;i++){ var c=String(L[i]).toLowerCase().split("-")[0];
    if(c==="en") return;
    if(c==="nb"||c==="nn"||c==="no"){ location.replace("/nb/__REST__"); return; }
    if(c==="es"||c==="ca"||c==="fr"){ location.replace("/"+c+"/__REST__"); return; }
  }
}catch(e){}})();
</script>"""

LANG_SAVE = """<script>
/* Remember an explicit language choice so the autodetect redirect respects it next time. */
document.querySelectorAll(".langbar a[data-lang]").forEach(function(a){
  a.addEventListener("click", function(){ try{ localStorage.setItem("koi_lang", a.dataset.lang); }catch(e){} });
});
</script>"""

EMAIL_SCRIPT = """<script>
  // Build the contact address at runtime — keeps plaintext + mailto: out of the served HTML,
  // so the JS-less harvesters that do almost all email scraping find nothing to grab.
  document.querySelectorAll("a.eml").forEach(function (a) {
    var e = a.getAttribute("data-e");
    if (!e) return;
    var addr = atob(e);
    a.setAttribute("href", "mailto:" + addr);
    if (a.hasAttribute("data-show")) a.textContent = addr;
    a.removeAttribute("data-e");
  });
</script>"""

JSONLD = """<script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Koi","applicationCategory":"LifestyleApplication","operatingSystem":"iOS","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"publisher":{"@type":"Organization","name":"gariasf","url":"https://koi.gariasf.com"}}</script>"""

ICON_SVG = '<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9.2" stroke="#7C8B6F" stroke-width="{w}"/><circle cx="12" cy="12" r="5.1" stroke="#7C8B6F" stroke-width="{w}" opacity=".7"/><circle cx="12" cy="12" r="1.9" fill="#7C8B6F"/></svg>'


def head(locale, page, body_attr, title_key, desc_key, ogdesc_key, extra=""):
    canonical = ORIGIN + page_url(locale, page)
    autodetect = ""
    if locale == "en":
        rest = "" if page == "home" else "privacy-policy/"
        autodetect = AUTODETECT.replace("__SELF_PREFIX__", "/").replace("__REST__", rest)
    return f"""<!DOCTYPE html>
<html lang="{locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#F4F2EC">
<title>{{{{t:{title_key}}}}}</title>
<meta name="description" content="{{{{t:{desc_key}}}}}">
<link rel="canonical" href="{canonical}">
{hreflang_block(page)}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/fonts/geist/Geist-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/geist/Geist-Medium.woff2" as="font" type="font/woff2" crossorigin>
<meta property="og:type" content="website">
<meta property="og:site_name" content="Koi">
<meta property="og:url" content="{canonical}">
<meta property="og:title" content="{{{{t:{title_key}}}}}">
<meta property="og:description" content="{{{{t:{ogdesc_key}}}}}">
<meta property="og:image" content="{ORIGIN}/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Koi">
<meta property="og:locale" content="{OG_LOCALE[locale]}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{{{t:{title_key}}}}}">
<meta name="twitter:description" content="{{{{t:{ogdesc_key}}}}}">
<meta name="twitter:image" content="{ORIGIN}/assets/og.png">
<link rel="stylesheet" href="/styles.css">
{JSONLD}
{extra}{autodetect}
</head>"""


def home_template(locale):
    priv = page_url(locale, "privacy")
    return head(locale, "home", "home", "meta.home.title", "meta.home.desc", "meta.home.ogdesc") + f"""
<body data-page="home">
<a class="skip" href="#main">{{{{t:skip}}}}</a>

<nav class="nav">
  <div class="container nav-inner">
    <a class="wordmark" href="/" aria-label="Koi home">{ICON_SVG.format(s=26, w='1.6')}<span>koi</span></a>
    <div class="nav-links">
      <a class="navlink eml" href="{priv}#contact" data-e="aGVsbG9AZ2FyaWFzZi5jb20=">{{{{t:nav.contact}}}}</a>
      <a class="navlink" href="{priv}">{{{{t:nav.privacy}}}}</a>
    </div>
  </div>
</nav>

<main id="main" tabindex="-1">
<header class="hero">
  <div class="mark-wrap">
    <div class="bloom" aria-hidden="true"></div>
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" style="position:relative;" aria-hidden="true"><circle cx="12" cy="12" r="9.2" stroke="#7C8B6F" stroke-width="1.3"/><circle cx="12" cy="12" r="5.1" stroke="#7C8B6F" stroke-width="1.3" opacity=".65"/><circle cx="12" cy="12" r="1.9" fill="#7C8B6F"/></svg>
  </div>
  <h1>{{{{t:hero.title}}}}</h1>
  <p>{{{{t:hero.sub}}}}</p>
  <div id="get" class="cta-row">
    <span class="mono soon">{{{{t:hero.soon}}}}</span>
  </div>
</header>

<section class="container">
  <div class="preview-card">
    <div class="preview-head">
      <div class="eyebrow">{{{{t:glance.eyebrow}}}}</div>
      <h2>{{{{t:glance.h}}}}</h2>
      <p>{{{{t:glance.p}}}}</p>
    </div>
    <div class="shots">
      <img class="shot" src="/assets/shots/glance-coming.png" width="414" height="900" alt="{{{{t:glance.alt}}}}" loading="lazy">
    </div>
  </div>
</section>

<section id="private" class="container section">
  <div class="dark-panel">
    <div>
      <div class="badge"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span>{{{{t:priv.badge}}}}</span></div>
      <h2>{{{{t:priv.h}}}}</h2>
      <p>{{{{t:priv.p}}}}</p>
      <a class="panel-link" href="{priv}"><span>{{{{t:priv.readPolicy}}}}</span><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></a>
    </div>
    <div class="checks">
      <div class="check-row"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9DB082" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>{{{{t:checks.1}}}}</span></div>
      <div class="check-row"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9DB082" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>{{{{t:checks.2}}}}</span></div>
      <div class="check-row"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9DB082" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>{{{{t:checks.3}}}}</span></div>
      <div class="check-row"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9DB082" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>{{{{t:checks.4}}}}</span></div>
    </div>
  </div>
</section>
</main>

<footer class="footer">
  <div class="container footer-inner">
    <div class="footer-brand">{ICON_SVG.format(s=20, w='1.7')}<span class="wm">koi</span><span class="tag">{{{{t:footer.tag}}}}</span></div>
    <div class="footer-links">
      <a class="navlink eml" href="{priv}#contact" data-e="aGVsbG9AZ2FyaWFzZi5jb20=">{{{{t:nav.contact}}}}</a>
      <a class="navlink" href="{priv}">{{{{t:nav.privacy}}}}</a>
      {switcher(locale, "home")}
      <span class="mono meta">© 2026 koi</span>
    </div>
  </div>
</footer>

{EMAIL_SCRIPT}
{LANG_SAVE}
</body>
</html>
"""


def privacy_template(locale):
    home = page_url(locale, "home")
    rows = "".join(
        f'<div class="summary-row"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6E8156" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>{{{{t:pp.sum.{i}}}}}</span></div>'
        for i in range(1, 5))
    secs = "".join(
        f'<div><h2>{{{{t:pp.s{i}.h}}}}</h2><p>{{{{t:pp.s{i}.p}}}}</p></div>'
        for i in [1, 2, 3])
    secs += '<div><h2>{{t:pp.s4.h}}</h2><p>{{t:pp.s4.p1}}<span class="ink">{{t:pp.s4.appstore}}</span>{{t:pp.s4.p2}}</p></div>'
    secs += "".join(
        f'<div><h2>{{{{t:pp.s{i}.h}}}}</h2><p>{{{{t:pp.s{i}.p}}}}</p></div>'
        for i in [5, 6, 7, 8])
    secs += '<div id="contact"><h2>{{t:pp.s9.h}}</h2><p>{{t:pp.contact.p1}}<a class="plink eml" href="mailto:koi@example.invalid" data-e="aGVsbG9AZ2FyaWFzZi5jb20=" data-show>hello [at] gariasf [dot] com</a>{{t:pp.contact.p2}}</p></div>'
    return head(locale, "privacy", "priv", "meta.priv.title", "meta.priv.desc", "meta.priv.ogdesc") + f"""
<body data-page="priv">
<a class="skip" href="#main">{{{{t:skip}}}}</a>

<nav class="nav">
  <div class="container nav-inner">
    <a class="wordmark" href="{home}" aria-label="Koi home">{ICON_SVG.format(s=26, w='1.6')}<span>koi</span></a>
    <a class="navlink nav-back" href="{home}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>{{{{t:pp.back}}}}</a>
  </div>
</nav>

<main id="main" tabindex="-1" class="privacy-body">
  <div class="eyebrow">{{{{t:pp.eyebrow}}}}</div>
  <h1>{{{{t:pp.h1}}}}</h1>
  <p class="privacy-intro">{{{{t:pp.intro}}}}</p>
  <p class="mono privacy-updated">{{{{t:pp.updated}}}}</p>

  <div class="summary-card">{rows}</div>

  <div class="sections">{secs}</div>

  <div class="back-foot">
    <a href="{home}"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>{{{{t:pp.backfoot}}}}</a>
    {switcher(locale, "privacy")}
  </div>
</main>

{EMAIL_SCRIPT}
{LANG_SAVE}
</body>
</html>
"""


def render(template, locale):
    d = T[locale]
    return re.sub(r"\{\{t:([^}]+)\}\}", lambda m: html.escape(d[m.group(1)]), template)


def write(path, content):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full) or ".", exist_ok=True)
    open(full, "w", encoding="utf-8").write(content)
    print("wrote", path)


def main():
    for lc in LOCALES:
        pre = loc_prefix(lc).lstrip("/")
        home_dir = pre
        priv_dir = (pre + "/privacy-policy").lstrip("/") if pre else "privacy-policy"
        write(os.path.join(home_dir, "index.html") if home_dir else "index.html", render(home_template(lc), lc))
        write(os.path.join(priv_dir, "index.html"), render(privacy_template(lc), lc))

    # sitemap + robots
    urls = []
    for page in ("home", "privacy"):
        for lc in LOCALES:
            urls.append(f"  <url><loc>{ORIGIN}{page_url(lc, page)}</loc></url>")
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(urls) + "\n</urlset>\n"
    write("sitemap.xml", sitemap)
    write("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {ORIGIN}/sitemap.xml\n")


if __name__ == "__main__":
    main()

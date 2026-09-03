#!/usr/bin/env node
/**
 * Bundles a handful of built pages into ONE self-contained HTML file so the
 * site can be reviewed in a browser with no server, no install and no deploy.
 *
 * This is a REVIEW ARTEFACT, not the site. It exists because the real site is
 * 159 pages across a filesystem and the person who needs to approve the design
 * is on a phone somewhere. Pages not included here are simply not linked.
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = 'dist';
const ROUTES = [
  ['/', 'Home'],
  ['/collections', 'Collections'],
  ['/collections/chafing-dishes', 'Chafing dishes'],
  ['/products/roll-top-chafing-dish-9l-stainless-steel', 'Product — steel chafer'],
  ['/products/hammered-copper-roll-top-chafing-dish-9l', 'Product — copper chafer'],
  ['/products/hammered-charger-plate-13-inch-antique-brass', 'Product — charger plate'],
  ['/in-use', 'In use'],
  ['/in-use/banquet-and-wedding-buffet', 'In use — banquet'],
  ['/wholesale', 'Wholesale'],
  ['/shop', 'Shop'],
  ['/factory', 'The factory'],
  ['/materials-and-finishes', 'Materials'],
  ['/chafing-dish-manufacturer', 'pSEO page'],
  ['/journal/buying-metalware-from-moradabad-without-getting-burned', 'Journal'],
  ['/contact', 'Contact'],
];

const included = new Set(ROUTES.map(([r]) => r));
const fileFor = (route) => path.join(dist, route === '/' ? 'index.html' : route.replace(/^\//, '') + '/index.html');

// --- stylesheet ------------------------------------------------------------
const cssFile = fs.readdirSync(path.join(dist, '_astro')).find((f) => f.endsWith('.css'));
let css = fs.readFileSync(path.join(dist, '_astro', cssFile), 'utf8');
// The bundled @font-face rules point at hashed .woff2 files that will not exist
// inside a single-file artifact. Drop them and load Inter from Google instead,
// otherwise the broken local face wins the cascade and the page falls back to
// a system font that changes every measurement on the page.
css = css.replace(/@font-face\s*\{[^}]*_astro[^}]*\}/g, '');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const sections = ROUTES.map(([route, label]) => {
  const html = fs.readFileSync(fileFor(route), 'utf8');
  let body = html.slice(html.indexOf('<body'), html.lastIndexOf('</body>'));
  body = body.replace(/^<body[^>]*>/, '');

  // Strip executable scripts — their ES-module imports resolve against paths
  // that do not exist here. The JSON product index stays; the basket bundle
  // appended at the end of this file replaces the rest.
  body = body.replace(/<script(?![^>]*type="application\/json")[\s\S]*?<\/script>/g, '');

  // Rewrite internal links: included routes become preview hashes, everything
  // else is visibly marked rather than silently dead.
  body = body.replace(/href="(\/[^"#]*?)"/g, (m, href) => {
    const clean = href.replace(/\/$/, '') || '/';
    if (included.has(clean)) return `href="#${clean}"`;
    if (href.startsWith('/#') || href === '/') return m;
    return `href="#" data-not-in-preview="${esc(clean)}" title="Not included in this preview — ${esc(clean)}"`;
  });

  return { route, label, body };
});

const nav = ROUTES.map(([route, label]) =>
  `<option value="${route}">${esc(label)}</option>`
).join('');

const out = `<title>Tripadi Site Preview</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
<style>
${css}

/* --- preview chrome (not part of the site) --- */
#pv-bar{position:sticky;top:0;z-index:60;display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;
  padding:10px 20px;background:#1b1916;color:#f2eee6;font:500 12px/1.4 "Inter",system-ui,sans-serif}
#pv-bar strong{font-weight:600;letter-spacing:.02em}
#pv-bar select{background:#2c2823;color:#f2eee6;border:1px solid #4a443a;border-radius:6px;
  padding:5px 8px;font:inherit}
#pv-bar .pv-note{color:#a29b8e;font-weight:400}
#pv-bar a{color:#c9a76a}
[data-not-in-preview]{opacity:.55;cursor:not-allowed}
.pv-page{display:none}
.pv-page.pv-on{display:block}
@media (max-width:640px){#pv-bar .pv-note{display:none}}
</style>

<div id="pv-bar">
  <strong>Tripadi International — site preview</strong>
  <select id="pv-jump" aria-label="Jump to page">${nav}</select>
  <span class="pv-note">15 of 159 pages · placeholders where photographs go · forms and checkout inert</span>
</div>

${sections.map((s) => `<div class="pv-page" data-route="${s.route}">${s.body}</div>`).join('\n')}

<script>
(function () {
  var pages = document.querySelectorAll('.pv-page');
  var jump = document.getElementById('pv-jump');

  function show(route) {
    var found = false;
    pages.forEach(function (p) {
      var on = p.getAttribute('data-route') === route;
      p.classList.toggle('pv-on', on);
      if (on) found = true;
    });
    if (!found) return show('/');
    jump.value = route;
    window.scrollTo(0, 0);
    if (window.TripadiBasket) window.TripadiBasket.init();
  }

  function routeFromHash() {
    var h = decodeURIComponent(location.hash.replace(/^#/, ''));
    return h.indexOf('/') === 0 ? h : '/';
  }

  window.addEventListener('hashchange', function () { show(routeFromHash()); });
  jump.addEventListener('change', function () { location.hash = jump.value; });

  // Links to pages outside the preview should say so rather than do nothing.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-not-in-preview]');
    if (a) { e.preventDefault(); alert('This page exists in the real site but is not one of the 15 included in this preview:\\n\\n' + a.getAttribute('data-not-in-preview')); }
  });

  show(routeFromHash());
})();
</script>
`;

fs.writeFileSync(process.argv[2] || 'preview.html', out);
console.log('preview written:', (Buffer.byteLength(out) / 1024 / 1024).toFixed(2), 'MB,', ROUTES.length, 'pages');

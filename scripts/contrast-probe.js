/**
 * F-02 contrast probe — the ground truth for WCAG AA on our pages.
 *
 * This is NOT run by node. Paste it into the browser console (or a
 * javascript_tool call) against a page being measured. It has no dependencies.
 *
 *   HOW TO USE
 *   1. npm run build            — measure the BUILT output. The server on :4321
 *                                 is `astro preview` and serves dist/, so source
 *                                 edits are invisible until you rebuild. Three
 *                                 rounds of edits once produced byte-identical
 *                                 numbers before anyone noticed (sol-053).
 *   2. Open the page at 1280x900. Narrower viewports collapse the ladder and
 *      undercount: swp-planner reported 16 groups collapsed and 21 expanded.
 *   3. Paste this file. It returns { light, dark } for the whole page.
 *
 *   WHY IT LOOKS LIKE THIS — four wrong methods preceded it (sol-053):
 *   - Counting `text-*` classes statically is wrong: it never learns the real
 *     ground, and the ground is half the ratio.
 *   - Regex-parsing the computed colour is wrong: Tailwind v4 emits `oklch()`,
 *     so `0.869` was once read as a red channel. Colour is resolved by drawing
 *     it on a canvas over white and over black and solving for RGB and alpha,
 *     which handles every notation the browser can produce.
 *   - Screenshotting before `.reveal`'s 0.7s fade completes is wrong.
 *   - Toggling the theme and reading immediately is wrong: `transition-colors`
 *     cross-fades, and mid-fade the probe reported 99 groups / 399 nodes where
 *     the truth was 1. Hence `__prep()` kills every transition and animation
 *     before anything is read.
 *
 *   THE TELL THAT CATCHES ALL OF THEM: check the grounds in the output. Every
 *   one must be a colour this design actually contains, or a legitimate
 *   composite of two. A mid-grey like #6C727E in a navy-and-gold palette is not
 *   a ground — it is a frame of an animation.
 *
 *   Grounds under a gradient are reported as skipped rather than guessed, and
 *   nodes still at opacity < 0.99 are skipped as mid-animation.
 *
 *   `textNodesLaidOut` is returned on purpose: a result of 0 failures is only
 *   meaningful if layout actually ran. In a hidden/background tab every
 *   getBoundingClientRect can return 0 and a broken probe looks like a clean
 *   page. Check that number is in the hundreds before believing a zero.
 *
 *   The companion wall is src/tests/paletteContrast.test.ts. Neither is
 *   sufficient alone: this probe sees the real ground but only the state the
 *   page is in — it cannot see the planner's portfolio-depleted row, which
 *   renders only when the money runs out. The test sees every branch but never
 *   the ground.
 */
(() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const cache = new Map();

  // Resolve any CSS colour notation to {r,g,b,a} by drawing it over two known
  // grounds: over white gives R*a + 255*(1-a), over black gives R*a.
  const res = (s) => {
    if (cache.has(s)) return cache.get(s);
    let o = null;
    try {
      const rd = (g) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = g; ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = s; ctx.fillRect(0, 0, 1, 1);
        return ctx.getImageData(0, 0, 1, 1).data;
      };
      const w = rd('#ffffff'), b = rd('#000000');
      const a = 1 - (w[0] - b[0]) / 255;
      o = a <= 0.001 ? { r: 0, g: 0, b: 0, a: 0 } : { r: b[0] / a, g: b[1] / a, b: b[2] / a, a };
    } catch (e) { o = null; }
    cache.set(s, o); return o;
  };

  const over = (f, g) => ({
    r: f.r * f.a + g.r * (1 - f.a),
    g: f.g * f.a + g.g * (1 - f.a),
    b: f.b * f.a + g.b * (1 - f.a), a: 1,
  });
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (x, y) => { const [p, q] = [lum(x), lum(y)].sort((m, n) => n - m); return (p + 0.05) / (q + 0.05); };
  const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();

  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TITLE', 'HEAD', 'META', 'LINK']);

  window.__prep = () => {
    let st = document.getElementById('__probe_css');
    if (!st) { st = document.createElement('style'); st.id = '__probe_css'; document.head.appendChild(st); }
    st.textContent =
      '*,*::before,*::after{transition:none!important;animation:none!important}' +
      '.reveal,.reveal-scale{opacity:1!important;transform:none!important}';
    document.querySelectorAll('.reveal,.reveal-scale').forEach((e) => e.classList.add('visible'));
    document.querySelectorAll('details').forEach((d) => (d.open = true));
  };

  window.__probe = () => {
    cache.clear();
    const pb = res(getComputedStyle(document.documentElement).backgroundColor);
    const base = pb && pb.a > 0.999 ? pb : { r: 255, g: 255, b: 255, a: 1 };

    // The ground under a node: composite every background up the ancestor chain
    // until something opaque stops it.
    const groundOf = (el) => {
      const L = [];
      for (let n = el; n; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.backgroundImage && cs.backgroundImage !== 'none') return { unknown: 'gradient' };
        if (parseFloat(cs.opacity) < 0.99) return { unknown: 'mid-animation' };
        const c = res(cs.backgroundColor);
        if (!c) return { unknown: 'unparsed' };
        if (c.a > 0.001) { L.push(c); if (c.a > 0.999) break; }
      }
      let g = { ...base };
      for (let i = L.length - 1; i >= 0; i--) g = over(L[i], g);
      return { ground: g };
    };

    const rows = []; let seen = 0, skipped = 0;
    for (const el of document.body.querySelectorAll('*')) {
      if (SKIP.has(el.tagName)) continue;
      const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
      if (!text) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      seen++;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (parseFloat(cs.opacity) < 0.99) continue;
      const fr = res(cs.color); if (!fr) continue;
      const g = groundOf(el); if (g.unknown) { skipped++; continue; }
      const fg = fr.a > 0.999 ? fr : over(fr, g.ground);
      const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight, 10) || 400;
      const need = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;
      const cr = ratio(fg, g.ground);
      if (cr >= need) continue;
      const cls = (el.className && typeof el.className === 'string' ? el.className : '')
        .split(/\s+/)
        .filter((c) => /^(text-|dark:text-)/.test(c) && !/^text-(xs|sm|base|lg|xl|\dxl|\[|left|right|center|hero)/.test(c))
        .join(' ');
      rows.push({
        cr: +cr.toFixed(2), need, fg: hex(fg), bg: hex(g.ground), size, weight,
        cls: cls || '(no colour class)', text: text.slice(0, 44).replace(/\s+/g, ' '),
      });
    }

    const gm = new Map();
    for (const r of rows) {
      const k = `${r.cls}|${r.fg}|${r.bg}|${r.size}|${r.weight}`;
      if (!gm.has(k)) gm.set(k, { ...r, n: 0, s: [] });
      const g = gm.get(k); g.n++; if (!g.s.length) g.s.push(r.text);
    }
    const out = [...gm.values()].sort((a, b) => a.cr - b.cr);
    return {
      textNodesLaidOut: seen,          // believe a zero only if this is in the hundreds
      groups: out.length, nodes: rows.length, skipped,
      rows: out.map((g) =>
        `${String(g.cr).padStart(5)}:1/${g.need} x${String(g.n).padStart(3)} ${g.fg} on ${g.bg} ` +
        `${g.size}px/${g.weight} ${g.cls} «${g.s[0]}»`),
    };
  };

  const root = document.documentElement;
  __prep(); root.classList.remove('dark'); const light = __probe();
  root.classList.add('dark'); __prep(); const dark = __probe();
  root.classList.remove('dark');
  return JSON.stringify({ url: location.pathname, light, dark }, null, 1);
})()

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Smoke test over the BUILT output, not the source.
//
// This exists because of sol-014: articles "randomly disappeared from the live
// site" when the orchestrator wrote a category outside the Zod enum and Astro
// silently dropped them at build time. The build reported success. Nothing
// failed. The only symptom was a page that wasn't there.
//
// Unit tests cannot catch that class of fault, because the code is fine - it
// is the output that is missing. So this checks what actually shipped.
//
// Skips cleanly when dist/ is absent so `npm test` still works on its own;
// run `npm run build` first for it to do anything.

const DIST = 'dist';
const hasDist = fs.existsSync(DIST);

const htmlFiles = (): string[] => {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.html')) out.push(p);
    }
  };
  walk(DIST);
  return out;
};

// Strip <script> and <style> blocks before scanning for rendered-value bugs.
// The bundled JS legitimately contains the tokens we are hunting for, and the
// prose on /solutions discusses them by name - both produced false positives
// on a naive substring match.
const visibleText = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');

describe.skipIf(!hasDist)('built output', () => {
  it('every page in src/pages produced an HTML file', () => {
    const routes = fs
      .readdirSync('src/pages', { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.astro'))
      .map((e) => e.name.replace(/\.astro$/, ''))
      .filter((n) => n !== 'index');

    const missing = routes.filter(
      (r) => !fs.existsSync(path.join(DIST, r, 'index.html')) &&
             !fs.existsSync(path.join(DIST, `${r}.html`))
    );
    expect(missing, `routes with no built page: ${missing.join(', ')}`).toEqual([]);
    expect(fs.existsSync(path.join(DIST, 'index.html'))).toBe(true);
  });

  it('every article in the content collection produced a page', () => {
    // The sol-014 guard. A frontmatter value outside the Zod enum makes Astro
    // drop the article at build time without failing the build.
    const dir = 'src/content/direct-tax';
    if (!fs.existsSync(dir)) return;
    const slugs = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => f.replace(/\.mdx$/, ''));

    const built = new Set(htmlFiles());
    const missing = slugs.filter((s) =>
      ![...built].some((b) => b.includes(s))
    );
    expect(
      missing,
      `articles written but not published: ${missing.join(', ')}`
    ).toEqual([]);
  });

  it('no page renders a broken value into visible content', () => {
    // Patterns chosen to match values that reached the page, not source code
    // or prose that merely mentions them.
    const patterns: Array<[string, RegExp]> = [
      ['doubled rupee', /₹₹/],
      ['NaN in a rendered value', /(>\s*NaN\s*<|₹\s*NaN|NaN\s*%)/],
      ['object stringified into markup', /\[object Object\]/],
      ['undefined in a rendered value', /(>\s*undefined\s*<|₹\s*undefined)/],
    ];

    const failures: string[] = [];
    for (const file of htmlFiles()) {
      const text = visibleText(fs.readFileSync(file, 'utf-8'));
      for (const [label, re] of patterns) {
        if (re.test(text)) failures.push(`${file}: ${label}`);
      }
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('no page is suspiciously empty', () => {
    // A page that builds but renders almost nothing is the shape of a layout
    // or data failure that still exits zero.
    const thin = htmlFiles()
      .map((f) => [f, fs.statSync(f).size] as const)
      .filter(([, size]) => size < 2000);
    expect(thin.map(([f, s]) => `${f} (${s}b)`), 'suspiciously small pages').toEqual([]);
  });

  it('the sitemap was generated', () => {
    expect(fs.existsSync(path.join(DIST, 'sitemap-index.xml'))).toBe(true);
  });
});

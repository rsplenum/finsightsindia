#!/usr/bin/env node
/**
 * The pSEO pages live at the root of the site (/chafing-dish-manufacturer),
 * which is right for the keyword but means a generated slug could collide with
 * a real page. Astro resolves the static page and silently drops the generated
 * one, so the failure would be invisible. This makes it loud.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pagesDir = path.join(root, 'src/pages');

const staticSlugs = new Set(
  fs
    .readdirSync(pagesDir, { withFileTypes: true })
    .map((e) => (e.isDirectory() ? e.name : e.name.replace(/\.(astro|ts|md|mdx|html)$/, '')))
    .filter((n) => !n.startsWith('[') && n !== 'index')
);

// Rebuild the generated slugs from the same matrix the site uses.
const pseo = JSON.parse(fs.readFileSync(path.join(root, 'src/data/pseo.json'), 'utf8'));
const generated = [];
for (const t of pseo.topics) for (const i of pseo.intents) generated.push(i.url_pattern.replace('{topic}', t.slug));
for (const ts of pseo.combinations.market_topics) for (const m of pseo.markets) generated.push(`${ts}-supplier-in-${m.slug}`);
for (const ts of pseo.combinations.buyer_topics) for (const b of pseo.buyers) generated.push(`${pseo.topics.find((t) => t.slug === ts).plural_slug}-for-${b.slug}`);

const collisions = generated.filter((s) => staticSlugs.has(s));
const dupes = generated.filter((s, i) => generated.indexOf(s) !== i);

if (collisions.length || dupes.length) {
  if (collisions.length) console.error(`\n  ✗ ${collisions.length} pSEO slug(s) collide with a real page:\n    ${collisions.join('\n    ')}`);
  if (dupes.length) console.error(`\n  ✗ duplicate generated slug(s):\n    ${[...new Set(dupes)].join('\n    ')}`);
  console.error('\n  Rename in src/data/pseo.json.\n');
  process.exit(1);
}

console.log(`  ✓ ${generated.length} pSEO slugs, no collisions with ${staticSlugs.size} static routes`);

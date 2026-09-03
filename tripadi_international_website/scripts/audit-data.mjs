#!/usr/bin/env node
/**
 * Data readiness report.
 *
 * The site was built before the real product photographs, prices and company
 * details arrived. Everything provisional is flagged in the data itself; this
 * script is what turns those flags into a list somebody can work through.
 *
 * Exit code is 0 by default so it never blocks a build. Run with STRICT=1 to
 * make it fail while anything is still provisional — that is the check to put
 * in CI once the questionnaire has been answered.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const company = read('src/data/company.json');
const products = read('src/data/products.json');
const categories = read('src/data/categories.json');
const useCases = read('src/data/use-cases.json');

const issues = { blocking: [], photos: [], data: [] };

// --- Company facts still carrying a placeholder --------------------------
for (const key of company._provisional ?? []) {
  issues.blocking.push(`company.json → "${key}" is a placeholder, not a supplied fact`);
}

// --- Product data --------------------------------------------------------
const unverified = products.filter((p) => !p.verified);
if (unverified.length) {
  issues.blocking.push(
    `products.json → ${unverified.length} of ${products.length} products are marked verified:false (names, dimensions, capacities and MOQs are drafted, not confirmed)`
  );
}
for (const p of products) {
  if (p.retail?.provisional_price) {
    issues.blocking.push(`products.json → ${p.id} carries a provisional retail price (₹${p.retail.price_inr})`);
  }
}

// --- Referential integrity ----------------------------------------------
const productIds = new Set(products.map((p) => p.id));
const categorySlugs = new Set(categories.map((c) => c.slug));
const useCaseSlugs = new Set(useCases.map((u) => u.slug));

for (const p of products) {
  if (!categorySlugs.has(p.category)) issues.data.push(`products.json → ${p.id} references unknown category "${p.category}"`);
  for (const uc of p.use_cases ?? []) {
    if (!useCaseSlugs.has(uc)) issues.data.push(`products.json → ${p.id} references unknown use case "${uc}"`);
  }
}
for (const u of useCases) {
  for (const id of u.products) {
    if (!productIds.has(id)) issues.data.push(`use-cases.json → "${u.slug}" references unknown product "${id}"`);
  }
}
const slugs = products.map((p) => p.slug);
const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
if (dupes.length) issues.data.push(`products.json → duplicate slugs: ${[...new Set(dupes)].join(', ')}`);

// --- Photographs ---------------------------------------------------------
const expected = new Set();
for (const p of products) {
  expected.add(p.images.hero);
  (p.images.gallery ?? []).forEach((g) => expected.add(g));
  if (p.images.lifestyle) expected.add(p.images.lifestyle);
}
categories.forEach((c) => expected.add(c.hero));
useCases.forEach((u) => expected.add(u.hero));
[
  '/lifestyle/hero-buffet.jpg', '/lifestyle/factory-floor.jpg', '/lifestyle/factory-polishing.jpg',
  '/lifestyle/moradabad-workshop.jpg', '/lifestyle/tool-room.jpg', '/lifestyle/wholesale-crates.jpg',
  '/lifestyle/journal-chafing-dishes.jpg', '/lifestyle/journal-metals.jpg', '/lifestyle/journal-moradabad.jpg',
  '/brand/og-default.jpg', '/brand/favicon.svg', company.owner.photo,
].forEach((p) => expected.add(p));

const missing = [...expected].filter((src) => !fs.existsSync(path.join(root, 'public', src.replace(/^\//, ''))));

// --- Report --------------------------------------------------------------
const pad = (n) => String(n).padStart(3, ' ');
console.log('\n  TRIPADI INTERNATIONAL — DATA READINESS\n  ' + '─'.repeat(52));
console.log(`  ${pad(products.length)}  products in the catalogue`);
console.log(`  ${pad(categories.length)}  categories`);
console.log(`  ${pad(useCases.length)}  use-case settings`);
console.log(`  ${pad(expected.size - missing.length)}/${expected.size}  images present`);
console.log('  ' + '─'.repeat(52));

if (missing.length) {
  console.log(`\n  PHOTOGRAPHS MISSING (${missing.length})`);
  console.log('  Drop the file at the path shown and the placeholder disappears.\n');
  missing.slice(0, 40).forEach((m) => console.log(`    public${m}`));
  if (missing.length > 40) console.log(`    …and ${missing.length - 40} more`);
}

if (issues.blocking.length) {
  console.log(`\n  MUST BE CONFIRMED BEFORE GO-LIVE (${issues.blocking.length})`);
  console.log('  Answer docs/questionnaire.md, then update the data files.\n');
  issues.blocking.slice(0, 25).forEach((m) => console.log(`    · ${m}`));
  if (issues.blocking.length > 25) console.log(`    …and ${issues.blocking.length - 25} more`);
}

if (issues.data.length) {
  console.log(`\n  DATA ERRORS (${issues.data.length}) — these are bugs, not gaps\n`);
  issues.data.forEach((m) => console.log(`    · ${m}`));
}

console.log('');

// Referential errors always fail. Provisional content fails only under STRICT.
if (issues.data.length) process.exit(1);
if (process.env.STRICT === '1' && (issues.blocking.length || missing.length)) process.exit(1);

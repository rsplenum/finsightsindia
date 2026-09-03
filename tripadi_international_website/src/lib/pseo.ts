import pseo from '../data/pseo.json';
import { allProducts, type Product } from './catalog';

export type PseoKind = 'intent' | 'market' | 'buyer';

export interface PseoPage {
  slug: string;
  kind: PseoKind;
  topic: (typeof pseo.topics)[number];
  intent?: (typeof pseo.intents)[number];
  market?: (typeof pseo.markets)[number];
  buyer?: (typeof pseo.buyers)[number];
  h1: string;
  title: string;
  description: string;
  products: Product[];
}

/** Which pieces a topic actually covers. A topic with no filter means all of them. */
export function topicProducts(topic: (typeof pseo.topics)[number]): Product[] {
  const f = topic.filter as { category?: string; categories?: string[]; metal?: string };
  return allProducts.filter((p) => {
    if (f.category && p.category !== f.category) return false;
    if (f.categories && !f.categories.includes(p.category)) return false;
    if (f.metal && p.metal !== f.metal) return false;
    return true;
  });
}

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Spec ranges computed from the real catalogue rather than written by hand, so
 * a page can never claim a capacity or an MOQ we do not actually offer.
 */
export function specRange(products: Product[]) {
  if (!products.length) return null;
  const moqs = products.map((p) => p.moq);
  const weights = products.map((p) => p.weight_kg);
  const finishes = new Set(products.flatMap((p) => p.finishes));
  const metals = new Set(products.map((p) => p.metal));
  return {
    count: products.length,
    moqMin: Math.min(...moqs),
    moqMax: Math.max(...moqs),
    weightMin: Math.min(...weights),
    weightMax: Math.max(...weights),
    finishCount: finishes.size,
    metalCount: metals.size,
    finishes: [...finishes],
  };
}

export function buildPseoPages(): PseoPage[] {
  const pages: PseoPage[] = [];
  const { topics, intents, markets, buyers, combinations } = pseo;

  // Family A — topic × commercial intent.
  for (const topic of topics) {
    for (const intent of intents) {
      const slug = intent.url_pattern.replace('{topic}', topic.slug);
      pages.push({
        slug,
        kind: 'intent',
        topic,
        intent,
        h1: intent.h1
          .replace('{Topic}', topic.keyword_label)
          .replace('{topic_lower}', topic.plural),
        title: `${topic.keyword_label} ${intent.label.toLowerCase()} — Moradabad, India | Tripadi International`,
        description: `${topic.lede} ${intent.angle.slice(0, 100)}…`,
        products: topicProducts(topic),
      });
    }
  }

  // Family B — topic × market.
  for (const topicSlug of combinations.market_topics) {
    const topic = topics.find((t) => t.slug === topicSlug);
    if (!topic) continue;
    for (const market of markets) {
      pages.push({
        slug: `${topic.slug}-supplier-in-${market.slug}`,
        kind: 'market',
        topic,
        market,
        h1: `${topic.keyword_label} supplier for ${market.in_label}`,
        title: `${topic.keyword_label} supplier in ${titleCase(market.label)} — Direct from the Factory | Tripadi International`,
        description: `${topic.title} made in our own factory in Moradabad and supplied to ${market.in_label}. ${market.logistics}.`,
        products: topicProducts(topic),
      });
    }
  }

  // Family C — topic × buyer type.
  for (const topicSlug of combinations.buyer_topics) {
    const topic = topics.find((t) => t.slug === topicSlug);
    if (!topic) continue;
    for (const buyer of buyers) {
      pages.push({
        slug: `${topic.plural_slug}-for-${buyer.slug}`,
        kind: 'buyer',
        topic,
        buyer,
        h1: `${topic.title} for ${buyer.for_label}`,
        title: `${topic.title} for ${titleCase(buyer.for_label)} — Manufacturer & Exporter | Tripadi International`,
        description: `${topic.title} specified for ${buyer.for_label}. ${buyer.angle}`,
        products: topicProducts(topic),
      });
    }
  }

  return pages;
}

/**
 * Every static route that exists in src/pages. A generated slug that collides
 * with one of these would be silently shadowed by Astro, so the build fails
 * loudly instead — see scripts/check-slug-collisions.mjs.
 */
export const RESERVED_SLUGS = [
  'about', 'catalogue', 'collections', 'contact', 'enquiry', 'export',
  'factory', 'in-use', 'index', 'journal', 'materials-and-finishes',
  'privacy', 'private-label', 'products', 'robots.txt', 'shipping-and-returns',
  'shop', 'terms', '404',
];

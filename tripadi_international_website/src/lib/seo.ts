import { companyInfo } from './catalog';

/** JSON-LD for the organisation. Emitted once, on every page. */
export function organisationSchema(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: companyInfo.name,
    url: siteUrl,
    description: companyInfo.positioning,
    founder: { '@type': 'Person', name: companyInfo.owner.name },
    foundingDate: companyInfo.founded,
    address: {
      '@type': 'PostalAddress',
      addressLocality: companyInfo.address.city,
      addressRegion: companyInfo.address.state,
      postalCode: companyInfo.address.postal_code,
      addressCountry: 'IN',
    },
    email: companyInfo.email,
    telephone: companyInfo.phone,
    areaServed: companyInfo.export_markets,
  };
}

export function productSchema(product: any, siteUrl: string) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.id,
    description: product.summary,
    material: product.materials?.join(', '),
    image: [new URL(product.images.hero, siteUrl).toString()],
    brand: { '@type': 'Brand', name: companyInfo.name },
    manufacturer: { '@type': 'Organization', name: companyInfo.name },
  };
  // Only publish an offer when the price is real. A provisional price in
  // structured data is a price Google will show and a buyer will hold us to.
  if (product.retail?.available && product.retail.price_inr && !product.retail.provisional_price) {
    schema.offers = {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.retail.price_inr,
      availability: 'https://schema.org/InStock',
      url: new URL(`/products/${product.slug}`, siteUrl).toString(),
    };
  }
  return schema;
}

export function breadcrumbSchema(trail: { name: string; url: string }[], siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: new URL(item.url, siteUrl).toString(),
    })),
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

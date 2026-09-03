import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site ?? 'https://www.tripadiinternational.com').toString();
  return new Response(
    [
      'User-agent: *',
      'Allow: /',
      // Nothing useful for a crawler, and pages that would look thin in an index.
      'Disallow: /enquiry',
      'Disallow: /shop/cart',
      'Disallow: /shop/checkout',
      'Disallow: /shop/order-received',
      '',
      `Sitemap: ${sitemap}`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
};

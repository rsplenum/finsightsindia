import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const directTaxArticles = await getCollection('direct-tax');
  
  return rss({
    title: 'FinSight India - Direct Tax Guide',
    description: 'Expert analysis, loopholes, and strategic guidance on Indian Taxation.',
    site: context.site,
    items: directTaxArticles.map((post) => ({
      title: post.data.title,
      description: post.data.summary,
      pubDate: new Date('2025-04-01T00:00:00.000Z'),
      link: `/tax-code/${post.id}/`,
    })),
  });
}

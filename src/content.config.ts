import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const directTaxCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/direct-tax' }),
  schema: z.object({
    title: z.string(),
    category: z.enum(['slabs', 'gains', 'deductions', 'tds', 'advance', 'indirect', 'income', 'penalties']),
    categoryName: z.string(),
    readTime: z.string(),
    updatedDate: z.string(),
    statutoryAct: z.string(),
    statutoryAct2025: z.string().optional(),
    coverImage: z.string(),
    summary: z.string(),
  }),
});

export const collections = {
  'direct-tax': directTaxCollection,
};

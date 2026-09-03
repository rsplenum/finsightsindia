import products from '../data/products.json';
import categories from '../data/categories.json';
import useCases from '../data/use-cases.json';
import company from '../data/company.json';

export type Product = (typeof products)[number];
export type Category = (typeof categories)[number];
export type UseCase = (typeof useCases)[number];

export const allProducts = products as Product[];
export const allCategories = ([...categories] as Category[]).sort((a, b) => a.order - b.order);
export const allUseCases = ([...useCases] as UseCase[]).sort((a, b) => a.order - b.order);
export const companyInfo = company;

export function productsInCategory(slug: string): Product[] {
  return allProducts.filter((p) => p.category === slug);
}

export function productsForUseCase(slug: string): Product[] {
  const uc = allUseCases.find((u) => u.slug === slug);
  if (!uc) return [];
  // Preserve the curated order from use-cases.json — it is a specification
  // sequence, not an alphabetical list.
  return uc.products
    .map((id) => allProducts.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));
}

export function categoryOf(product: Product): Category | undefined {
  return allCategories.find((c) => c.slug === product.category);
}

export function featuredProducts(limit = 6): Product[] {
  const featured = allProducts.filter((p) => p.featured);
  return featured.length >= limit ? featured.slice(0, limit) : [...featured, ...allProducts.filter((p) => !p.featured)].slice(0, limit);
}

/** Products in the same category, then the same metal, never the product itself. */
export function relatedProducts(product: Product, limit = 3): Product[] {
  const sameCategory = allProducts.filter((p) => p.category === product.category && p.id !== product.id);
  const sameMetal = allProducts.filter((p) => p.metal === product.metal && p.category !== product.category);
  return [...sameCategory, ...sameMetal].slice(0, limit);
}

export function productsByMetal(metal: string): Product[] {
  return allProducts.filter((p) => p.metal === metal);
}

export const metalLabels: Record<string, string> = {
  'stainless-steel': 'Stainless Steel',
  brass: 'Brass',
  copper: 'Copper',
};

export function formatINR(paise: number | null | undefined): string {
  if (paise == null) return 'Price on request';
  return '₹' + paise.toLocaleString('en-IN');
}

export function dimensionsLabel(d: { length: number; width: number; height: number }): string {
  return `${d.length} × ${d.width} × ${d.height} mm`;
}

/** WhatsApp deep link pre-filled with the product context. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${companyInfo.whatsapp}?text=${encodeURIComponent(message)}`;
}

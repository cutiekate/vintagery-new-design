import type { ShopifyProduct } from "./shopify";

/** Shopify option names that hold a clothing size. */
const SIZE_OPTION = /^(розмір|size)$/i;

export const PRICE_RANGES = [
  { id: "under-2000", label: "До 2 000 грн", min: 0, max: 2000 },
  { id: "2000-5000", label: "2 000 – 5 000 грн", min: 2000, max: 5000 },
  { id: "over-5000", label: "Від 5 000 грн", min: 5000, max: Infinity },
] as const;

export type PriceRangeId = (typeof PRICE_RANGES)[number]["id"];

export interface CatalogFilters {
  size?: string | undefined;
  price?: string | undefined;
}

function availableVariants(product: ShopifyProduct) {
  return product.node.variants.edges.map((e) => e.node).filter((v) => v.availableForSale);
}

function sizeOf(variant: ShopifyProduct["node"]["variants"]["edges"][number]["node"]) {
  return variant.selectedOptions.find((o) => SIZE_OPTION.test(o.name.trim()))?.value;
}

/** All distinct sizes that can still be bought, in first-seen order. */
export function collectSizes(products: ShopifyProduct[]): string[] {
  const sizes = new Set<string>();
  for (const p of products) {
    for (const v of availableVariants(p)) {
      const s = sizeOf(v);
      if (s) sizes.add(s);
    }
  }
  return [...sizes];
}

/**
 * Price ranges: "До 2 000" includes 2 000; each next range starts just above
 * the previous limit (2 000 – 5 000 includes 5 000; "Від 5 000" is above 5 000).
 */
export function priceInRange(amount: number, rangeId: string): boolean {
  const range = PRICE_RANGES.find((r) => r.id === rangeId);
  if (!range) return true;
  return range.min === 0 ? amount <= range.max : amount > range.min && amount <= range.max;
}

export function filterProducts(products: ShopifyProduct[], filters: CatalogFilters): ShopifyProduct[] {
  return products.filter((p) => {
    let variants = availableVariants(p);
    if (filters.size) {
      variants = variants.filter((v) => sizeOf(v) === filters.size);
      if (variants.length === 0) return false;
    }
    if (filters.price) {
      const prices = variants.length
        ? variants.map((v) => Number(v.price.amount))
        : [Number(p.node.priceRange.minVariantPrice.amount)];
      if (!prices.some((amount) => priceInRange(amount, filters.price!))) return false;
    }
    return true;
  });
}

import { describe, expect, it } from "vitest";
import { collectSizes, filterProducts, priceInRange } from "@/lib/catalog-filters";
import type { ShopifyProduct } from "@/lib/shopify";

function product(title: string, size: string, amount: string, available = true): ShopifyProduct {
  return {
    node: {
      id: title,
      title,
      description: "",
      handle: title,
      priceRange: { minVariantPrice: { amount, currencyCode: "UAH" } },
      images: { edges: [] },
      options: [{ name: "Розмір", values: [size] }],
      variants: {
        edges: [
          {
            node: {
              id: `${title}-v`,
              title: size,
              price: { amount, currencyCode: "UAH" },
              availableForSale: available,
              selectedOptions: [{ name: "Розмір", value: size }],
            },
          },
        ],
      },
    },
  };
}

const jacket = product("jacket", "EUR 40 / UK 12", "1500.0");
const coat = product("coat", "XS–S", "6500.0");
const sold = product("sold", "L", "900.0", false);
const all = [jacket, coat, sold];

describe("catalog filters", () => {
  it("offers only sizes that can still be bought", () => {
    expect(collectSizes(all)).toEqual(["EUR 40 / UK 12", "XS–S"]);
  });

  it("size filter keeps only items in that size", () => {
    expect(filterProducts(all, { size: "XS–S" }).map((p) => p.node.id)).toEqual(["coat"]);
  });

  it("'До 2 000 грн' includes exactly 2 000", () => {
    expect(priceInRange(2000, "under-2000")).toBe(true);
    expect(priceInRange(2001, "under-2000")).toBe(false);
  });

  it("'2 000 – 5 000 грн' starts above 2 000 and includes 5 000", () => {
    expect(priceInRange(2000, "2000-5000")).toBe(false);
    expect(priceInRange(5000, "2000-5000")).toBe(true);
  });

  it("'Від 5 000 грн' keeps the 6 500 грн coat, not the 1 500 грн jacket", () => {
    expect(filterProducts([jacket, coat], { price: "over-5000" }).map((p) => p.node.id)).toEqual(["coat"]);
  });

  it("size and price together must both match", () => {
    expect(filterProducts([jacket, coat], { size: "XS–S", price: "under-2000" })).toEqual([]);
  });
});

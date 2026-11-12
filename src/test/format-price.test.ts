import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/shopify";

describe("formatPrice", () => {
  it("shows the jacket price as 1 500 грн", () => {
    expect(formatPrice({ amount: "1500.0", currencyCode: "UAH" })).toBe("1\u00a0500\u00a0грн");
  });
});

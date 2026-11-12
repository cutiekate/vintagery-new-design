import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ShopifyProduct } from "@/lib/shopify";

// The store talks to Shopify only through these functions; replace them with fakes so each
// test decides what "Shopify" answers. cartLines and CART_QUERY stay real.
vi.mock("@/lib/shopify", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/shopify")>()),
  createShopifyCart: vi.fn(),
  addLineToShopifyCart: vi.fn(),
  updateShopifyCartLine: vi.fn(),
  removeLineFromShopifyCart: vi.fn(),
  storefrontApiRequest: vi.fn(),
}));

const shopify = await import("@/lib/shopify");
const { useCartStore, MAX_QUANTITY_PER_ITEM } = await import("@/stores/cartStore");

const createCart = vi.mocked(shopify.createShopifyCart);
const addLine = vi.mocked(shopify.addLineToShopifyCart);
const updateLine = vi.mocked(shopify.updateShopifyCartLine);
const removeLine = vi.mocked(shopify.removeLineFromShopifyCart);
const query = vi.mocked(shopify.storefrontApiRequest);

const product = { node: { id: "p1", title: "Дублянка Richard Draper" } } as ShopifyProduct;

function item(variantId = "v-coat", quantity = 1) {
  return {
    product,
    variantId,
    variantTitle: "XS–S",
    price: { amount: "6500.0", currencyCode: "UAH" },
    quantity,
    selectedOptions: [{ name: "Розмір", value: "XS–S" }],
  };
}

function newCart(quantity = 1, warning?: string) {
  createCart.mockResolvedValue({
    cartId: "cart-1",
    checkoutUrl: "https://shop/checkout?channel=online_store",
    lineId: "line-1",
    quantity,
    warning,
  });
}

const state = () => useCartStore.getState();

beforeEach(() => {
  vi.clearAllMocks();
  useCartStore.setState({ items: [], cartId: null, checkoutUrl: null, isLoading: false });
});

describe("cart: adding", () => {
  it("creates a Shopify cart for the first item", async () => {
    newCart();

    const result = await state().addItem(item());

    expect(result).toEqual({ status: "added", warning: undefined });
    expect(createCart).toHaveBeenCalledWith("v-coat", 1);
    expect(state().cartId).toBe("cart-1");
    expect(state().items).toHaveLength(1);
    expect(state().items[0]).toMatchObject({ lineId: "line-1", quantity: 1 });
  });

  it("never asks Shopify for more than one of a one-of-a-kind item", async () => {
    newCart();

    await state().addItem(item("v-coat", 3));

    expect(MAX_QUANTITY_PER_ITEM).toBe(1);
    expect(createCart).toHaveBeenCalledWith("v-coat", 1);
  });

  it("refuses a second copy of an item already in the cart, without calling Shopify", async () => {
    newCart();
    await state().addItem(item());

    const result = await state().addItem(item());

    expect(result).toEqual({ status: "already-in-cart" });
    expect(updateLine).not.toHaveBeenCalled();
    expect(addLine).not.toHaveBeenCalled();
    expect(state().items[0]?.quantity).toBe(1);
  });

  it("adds a different item as a new line in the same cart", async () => {
    newCart();
    await state().addItem(item("v-coat"));
    addLine.mockResolvedValue({ success: true, lineId: "line-2", quantity: 1 });

    const result = await state().addItem(item("v-jacket"));

    expect(result.status).toBe("added");
    expect(addLine).toHaveBeenCalledWith("cart-1", "v-jacket", 1);
    expect(state().items.map((i) => i.variantId)).toEqual(["v-coat", "v-jacket"]);
  });

  it("reports an item Shopify has sold out of and keeps it out of the cart", async () => {
    newCart(0, "Товару немає в наявності");

    const result = await state().addItem(item());

    expect(result).toEqual({ status: "unavailable", warning: "Товару немає в наявності" });
    expect(state().items).toEqual([]);
    expect(state().cartId).toBeNull();
  });

  it("starts a fresh cart when the saved one has expired", async () => {
    useCartStore.setState({ cartId: "expired", checkoutUrl: "https://old" });
    addLine.mockResolvedValue({ success: false, cartNotFound: true });
    newCart();

    const result = await state().addItem(item());

    expect(result.status).toBe("added");
    expect(createCart).toHaveBeenCalledOnce();
    expect(state().cartId).toBe("cart-1");
  });

  it("returns failed, not a crash, when Shopify can't be reached", async () => {
    createCart.mockRejectedValue(new Error("network down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await state().addItem(item());

    expect(result).toEqual({ status: "failed" });
    expect(state().isLoading).toBe(false);
  });
});

describe("cart: quantities and removal", () => {
  beforeEach(async () => {
    newCart();
    await state().addItem(item());
    vi.clearAllMocks();
  });

  it("does not raise a quantity past the one-of-a-kind limit", async () => {
    await state().updateQuantity("v-coat", 2);

    expect(updateLine).not.toHaveBeenCalled();
    expect(state().items[0]?.quantity).toBe(1);
  });

  it("removes the item when its quantity drops to zero", async () => {
    removeLine.mockResolvedValue({ success: true });

    await state().updateQuantity("v-coat", 0);

    expect(removeLine).toHaveBeenCalledWith("cart-1", "line-1");
    expect(state().items).toEqual([]);
    expect(state().cartId).toBeNull();
  });
});

describe("cart: syncing with Shopify", () => {
  const remoteCart = (lines: Array<{ id: string; quantity: number }>) =>
    query.mockResolvedValue({
      data: {
        cart: {
          id: "cart-1",
          totalQuantity: lines.reduce((sum, l) => sum + l.quantity, 0),
          lines: {
            edges: lines.map((l) => ({ node: { ...l, merchandise: { id: "x" } } })),
          },
        },
      },
    });

  it("trims a cart saved before the limit existed back to one", async () => {
    useCartStore.setState({
      cartId: "cart-1",
      items: [{ ...item(), lineId: "line-1", quantity: 3 }],
    });
    remoteCart([{ id: "line-1", quantity: 3 }]);
    updateLine.mockResolvedValue({ success: true, lineId: "line-1", quantity: 1 });

    await state().syncCart();

    expect(updateLine).toHaveBeenCalledWith("cart-1", "line-1", 1);
    expect(state().items[0]?.quantity).toBe(1);
  });

  it("drops lines Shopify no longer has", async () => {
    useCartStore.setState({
      cartId: "cart-1",
      items: [
        { ...item("v-coat"), lineId: "line-1" },
        { ...item("v-jacket"), lineId: "line-2" },
      ],
    });
    remoteCart([{ id: "line-2", quantity: 1 }]);

    await state().syncCart();

    expect(state().items.map((i) => i.variantId)).toEqual(["v-jacket"]);
  });

  it("clears the cart when Shopify's copy is empty", async () => {
    useCartStore.setState({ cartId: "cart-1", items: [{ ...item(), lineId: "line-1" }] });
    remoteCart([]);

    await state().syncCart();

    expect(state().items).toEqual([]);
    expect(state().cartId).toBeNull();
  });
});

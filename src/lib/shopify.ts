import { toast } from "sonner";

export const SHOPIFY_API_VERSION = "2026-10";
export const SHOPIFY_STORE_PERMANENT_DOMAIN =
  "vintagery-clothing-store-vj5xf-hia2tx0z.myshopify.com";
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
// Storefront tokens are public, read-only and designed for browser use.
export const SHOPIFY_STOREFRONT_TOKEN = "e72a6565e32b30233d96f3c40ada9254";

export interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: ShopifyMoney;
  availableForSale: boolean;
  selectedOptions: Array<{ name: string; value: string }>;
}

export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
    handle: string;
    priceRange: { minVariantPrice: ShopifyMoney };
    images: { edges: Array<{ node: { url: string; altText: string | null } }> };
    variants: { edges: Array<{ node: ShopifyVariant }> };
    options: Array<{ name: string; values: string[] }>;
  };
}

const PRODUCT_FIELDS = `
  id
  title
  description
  handle
  priceRange { minVariantPrice { amount currencyCode } }
  images(first: 5) { edges { node { url altText } } }
  variants(first: 20) {
    edges {
      node {
        id
        title
        price { amount currencyCode }
        availableForSale
        selectedOptions { name value }
      }
    }
  }
  options { name values }
`;

export const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges { node { ${PRODUCT_FIELDS} } }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  query GetProduct($handle: String!) {
    product(handle: $handle) { ${PRODUCT_FIELDS} }
  }
`;

export async function storefrontApiRequest(query: string, variables: Record<string, unknown> = {}) {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 402) {
    if (typeof window !== "undefined") {
      toast.error("Shopify: потрібна оплата", {
        description:
          "Доступ до Shopify API потребує активного тарифу Shopify. Оновіть план на https://admin.shopify.com",
      });
    }
    return undefined;
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  if (data.errors) {
    throw new Error(
      `Error calling Shopify: ${data.errors.map((e: { message: string }) => e.message).join(", ")}`,
    );
  }
  return data;
}

export async function fetchProducts(first = 50, query?: string): Promise<ShopifyProduct[]> {
  const data = await storefrontApiRequest(PRODUCTS_QUERY, { first, query });
  return data?.data?.products?.edges ?? [];
}

export async function fetchProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
  const node = data?.data?.product;
  return node ? { node } : null;
}

const CURRENCY_LABELS: Record<string, string> = { UAH: "грн", USD: "$", EUR: "€" };

// Deterministic formatting (no Intl) so server and browser render identical text.
export function formatPrice(money: ShopifyMoney) {
  const amount = parseFloat(money.amount);
  const fixed = amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
  const [int = "0", frac] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  const number = frac ? `${grouped},${frac}` : grouped;
  return `${number}\u00a0${CURRENCY_LABELS[money.currencyCode] ?? money.currencyCode}`;
}

/* ---------- Cart (Storefront API) ---------- */

const CART_LINES_FIELDS = `
  lines(first: 100) { edges { node { id quantity merchandise { ... on ProductVariant { id } } } } }
`;

export const CART_QUERY = `
  query cart($id: ID!) {
    cart(id: $id) { id totalQuantity ${CART_LINES_FIELDS} }
  }
`;

// Shopify does not reject a quantity above stock: it lowers the line to what is available and
// reports it in `warnings`. Read both so the local cart never shows more than Shopify holds.
const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { id checkoutUrl ${CART_LINES_FIELDS} }
      userErrors { field message }
      warnings { code message }
    }
  }
`;

const CART_LINES_ADD_MUTATION = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { id ${CART_LINES_FIELDS} }
      userErrors { field message }
      warnings { code message }
    }
  }
`;

const CART_LINES_UPDATE_MUTATION = `
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { id ${CART_LINES_FIELDS} }
      userErrors { field message }
      warnings { code message }
    }
  }
`;

const CART_LINES_REMOVE_MUTATION = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { id }
      userErrors { field message }
    }
  }
`;

type UserError = { field: string[] | null; message: string };
type CartWarning = { code: string; message: string };

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  merchandise: { id: string };
}

type CartWithLines = { lines?: { edges?: Array<{ node: ShopifyCartLine }> } } | null | undefined;

export function cartLines(cart: CartWithLines): ShopifyCartLine[] {
  return (cart?.lines?.edges ?? []).map((e) => e.node);
}

function findLine(cart: CartWithLines, variantId: string): ShopifyCartLine | undefined {
  return cartLines(cart).find((l) => l.merchandise.id === variantId);
}

function firstWarning(warnings: CartWarning[] | undefined): string | undefined {
  if (!warnings?.length) return undefined;
  console.warn("Shopify cart warnings:", warnings);
  return warnings[0]?.message;
}

export interface CartLineResult {
  success: boolean;
  cartNotFound?: boolean;
  lineId?: string | undefined;
  /** Quantity Shopify actually holds for the line; may be lower than requested. */
  quantity?: number | undefined;
  warning?: string | undefined;
}

export function formatCheckoutUrl(checkoutUrl: string): string {
  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set("channel", "online_store");
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}

function isCartNotFoundError(userErrors: UserError[]): boolean {
  return userErrors.some(
    (e) =>
      e.message.toLowerCase().includes("cart not found") ||
      e.message.toLowerCase().includes("does not exist"),
  );
}

export async function createShopifyCart(
  variantId: string,
  quantity: number,
): Promise<{
  cartId: string;
  checkoutUrl: string;
  lineId: string;
  quantity: number;
  warning?: string | undefined;
} | null> {
  const data = await storefrontApiRequest(CART_CREATE_MUTATION, {
    input: { lines: [{ quantity, merchandiseId: variantId }] },
  });

  if (data?.data?.cartCreate?.userErrors?.length > 0) {
    console.error("Cart creation failed:", data.data.cartCreate.userErrors);
    return null;
  }
  const cart = data?.data?.cartCreate?.cart;
  if (!cart?.checkoutUrl) return null;
  const line = findLine(cart, variantId);
  if (!line) return null;
  return {
    cartId: cart.id,
    checkoutUrl: formatCheckoutUrl(cart.checkoutUrl),
    lineId: line.id,
    quantity: line.quantity,
    warning: firstWarning(data?.data?.cartCreate?.warnings),
  };
}

export async function addLineToShopifyCart(
  cartId: string,
  variantId: string,
  quantity: number,
): Promise<CartLineResult> {
  const data = await storefrontApiRequest(CART_LINES_ADD_MUTATION, {
    cartId,
    lines: [{ quantity, merchandiseId: variantId }],
  });
  const userErrors: UserError[] = data?.data?.cartLinesAdd?.userErrors || [];
  if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
  if (userErrors.length > 0) {
    console.error("Add line failed:", userErrors);
    return { success: false };
  }
  const line = findLine(data?.data?.cartLinesAdd?.cart, variantId);
  return {
    success: true,
    lineId: line?.id,
    quantity: line?.quantity ?? 0,
    warning: firstWarning(data?.data?.cartLinesAdd?.warnings),
  };
}

export async function updateShopifyCartLine(
  cartId: string,
  lineId: string,
  quantity: number,
): Promise<CartLineResult> {
  const data = await storefrontApiRequest(CART_LINES_UPDATE_MUTATION, {
    cartId,
    lines: [{ id: lineId, quantity }],
  });
  const userErrors: UserError[] = data?.data?.cartLinesUpdate?.userErrors || [];
  if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
  if (userErrors.length > 0) {
    console.error("Update line failed:", userErrors);
    return { success: false };
  }
  const line = cartLines(data?.data?.cartLinesUpdate?.cart).find((l) => l.id === lineId);
  return {
    success: true,
    lineId,
    // A line Shopify dropped entirely (nothing left in stock) is gone from the cart.
    quantity: line?.quantity ?? 0,
    warning: firstWarning(data?.data?.cartLinesUpdate?.warnings),
  };
}

export async function removeLineFromShopifyCart(
  cartId: string,
  lineId: string,
): Promise<{ success: boolean; cartNotFound?: boolean }> {
  const data = await storefrontApiRequest(CART_LINES_REMOVE_MUTATION, {
    cartId,
    lineIds: [lineId],
  });
  const userErrors: UserError[] = data?.data?.cartLinesRemove?.userErrors || [];
  if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
  if (userErrors.length > 0) {
    console.error("Remove line failed:", userErrors);
    return { success: false };
  }
  return { success: true };
}

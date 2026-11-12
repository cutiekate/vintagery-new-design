import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  CART_QUERY,
  addLineToShopifyCart,
  cartLines,
  createShopifyCart,
  removeLineFromShopifyCart,
  storefrontApiRequest,
  updateShopifyCartLine,
  type ShopifyMoney,
  type ShopifyProduct,
} from "@/lib/shopify";

// Every Vintagery item is one of a kind, so a variant can sit in the cart at most once.
// Shopify inventory is the real guard; this keeps the UI from offering more than exists.
export const MAX_QUANTITY_PER_ITEM = 1;

export interface CartItem {
  lineId: string | null;
  product: ShopifyProduct;
  variantId: string;
  variantTitle: string;
  price: ShopifyMoney;
  quantity: number;
  selectedOptions: Array<{ name: string; value: string }>;
}

export type AddItemResult =
  | { status: "added"; warning?: string | undefined }
  | { status: "already-in-cart" }
  | { status: "unavailable"; warning?: string | undefined }
  | { status: "failed" };

interface CartStore {
  items: CartItem[];
  cartId: string | null;
  checkoutUrl: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  addItem: (item: Omit<CartItem, "lineId">) => Promise<AddItemResult>;
  /** Resolves to Shopify's warning when it held less than requested. */
  updateQuantity: (variantId: string, quantity: number) => Promise<string | undefined>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  getCheckoutUrl: () => string | null;
}

function clampQuantity(quantity: number) {
  return Math.min(Math.max(quantity, 0), MAX_QUANTITY_PER_ITEM);
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => {
      // Mirror the quantity Shopify reports; a line it emptied leaves the cart.
      const applyQuantity = (variantId: string, quantity: number) => {
        const items =
          quantity > 0
            ? get().items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i))
            : get().items.filter((i) => i.variantId !== variantId);
        if (items.length === 0) get().clearCart();
        else set({ items });
      };

      return {
        items: [],
        cartId: null,
        checkoutUrl: null,
        isLoading: false,
        isSyncing: false,

        addItem: async (item) => {
          const { items, cartId, clearCart } = get();
          const existingItem = items.find((i) => i.variantId === item.variantId);
          if (existingItem && existingItem.quantity >= MAX_QUANTITY_PER_ITEM) {
            return { status: "already-in-cart" };
          }
          const requested = clampQuantity(item.quantity);
          set({ isLoading: true });
          try {
            if (!cartId) {
              const result = await createShopifyCart(item.variantId, requested);
              if (!result) return { status: "failed" };
              if (result.quantity === 0) return { status: "unavailable", warning: result.warning };
              set({
                cartId: result.cartId,
                checkoutUrl: result.checkoutUrl,
                items: [{ ...item, quantity: result.quantity, lineId: result.lineId }],
              });
              return { status: "added", warning: result.warning };
            }
            if (existingItem) {
              if (!existingItem.lineId) return { status: "failed" };
              const newQuantity = clampQuantity(existingItem.quantity + requested);
              const result = await updateShopifyCartLine(cartId, existingItem.lineId, newQuantity);
              if (result.success) {
                applyQuantity(item.variantId, result.quantity ?? newQuantity);
                return { status: "added", warning: result.warning };
              }
              if (result.cartNotFound) clearCart();
              return { status: "failed" };
            }
            const result = await addLineToShopifyCart(cartId, item.variantId, requested);
            if (result.success) {
              if (!result.quantity) return { status: "unavailable", warning: result.warning };
              set({
                items: [
                  ...get().items,
                  { ...item, quantity: result.quantity, lineId: result.lineId ?? null },
                ],
              });
              return { status: "added", warning: result.warning };
            }
            if (result.cartNotFound) {
              // Cart expired — start a fresh one with this item.
              clearCart();
              return get().addItem(item);
            }
            return { status: "failed" };
          } catch (error) {
            console.error("Failed to add item:", error);
            return { status: "failed" };
          } finally {
            set({ isLoading: false });
          }
        },

        updateQuantity: async (variantId, quantity) => {
          if (quantity <= 0) {
            await get().removeItem(variantId);
            return undefined;
          }
          const { items, cartId, clearCart } = get();
          const item = items.find((i) => i.variantId === variantId);
          if (!item?.lineId || !cartId) return undefined;
          const target = clampQuantity(quantity);
          if (target === item.quantity) return undefined;
          set({ isLoading: true });
          try {
            const result = await updateShopifyCartLine(cartId, item.lineId, target);
            if (result.success) {
              applyQuantity(variantId, result.quantity ?? target);
              return result.warning;
            }
            if (result.cartNotFound) clearCart();
          } catch (error) {
            console.error("Failed to update quantity:", error);
          } finally {
            set({ isLoading: false });
          }
          return undefined;
        },

        removeItem: async (variantId) => {
          const { items, cartId, clearCart } = get();
          const item = items.find((i) => i.variantId === variantId);
          if (!item?.lineId || !cartId) return;
          set({ isLoading: true });
          try {
            const result = await removeLineFromShopifyCart(cartId, item.lineId);
            if (result.success) {
              const newItems = get().items.filter((i) => i.variantId !== variantId);
              if (newItems.length === 0) clearCart();
              else set({ items: newItems });
            } else if (result.cartNotFound) {
              clearCart();
            }
          } catch (error) {
            console.error("Failed to remove item:", error);
          } finally {
            set({ isLoading: false });
          }
        },

        clearCart: () => set({ items: [], cartId: null, checkoutUrl: null }),
        getCheckoutUrl: () => get().checkoutUrl,

        // Pull quantities from Shopify, then trim any line over the per-item limit
        // (carts saved before the limit existed can hold more).
        syncCart: async () => {
          const { cartId, isSyncing, clearCart } = get();
          if (!cartId || isSyncing) return;
          set({ isSyncing: true });
          try {
            const data = await storefrontApiRequest(CART_QUERY, { id: cartId });
            if (!data) return;
            const cart = data?.data?.cart;
            if (!cart || cart.totalQuantity === 0) {
              clearCart();
              return;
            }
            const remote = new Map(cartLines(cart).map((l) => [l.id, l.quantity]));
            const items = get()
              .items.map((i) => ({ ...i, quantity: (i.lineId && remote.get(i.lineId)) || 0 }))
              .filter((i) => i.quantity > 0);
            if (items.length === 0) {
              clearCart();
              return;
            }
            set({ items });
            for (const item of items) {
              if (item.lineId && item.quantity > MAX_QUANTITY_PER_ITEM) {
                const result = await updateShopifyCartLine(
                  cartId,
                  item.lineId,
                  MAX_QUANTITY_PER_ITEM,
                );
                if (result.success) {
                  applyQuantity(item.variantId, result.quantity ?? MAX_QUANTITY_PER_ITEM);
                }
              }
            }
          } catch (error) {
            console.error("Failed to sync cart with Shopify:", error);
          } finally {
            set({ isSyncing: false });
          }
        },
      };
    },
    {
      name: "shopify-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        cartId: state.cartId,
        checkoutUrl: state.checkoutUrl,
      }),
    },
  ),
);

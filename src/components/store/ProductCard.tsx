import { Link } from "@tanstack/react-router";
import { Check, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { notifyAddResult } from "@/lib/cart-feedback";
import { formatPrice, type ShopifyProduct } from "@/lib/shopify";
import { MAX_QUANTITY_PER_ITEM, useCartStore } from "@/stores/cartStore";

export function ProductCard({ product, index }: { product: ShopifyProduct; index: number }) {
  const addItem = useCartStore((s) => s.addItem);
  const [adding, setAdding] = useState(false);
  const p = product.node;
  const images = p.images.edges;
  const firstVariant = p.variants.edges.find((v) => v.node.availableForSale)?.node;
  const hasChoices = p.variants.edges.length > 1;
  const inCartQuantity = useCartStore(
    (s) => s.items.find((i) => i.variantId === firstVariant?.id)?.quantity ?? 0,
  );
  // The cart lives in localStorage; wait for hydration so SSR and first render match.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const isInCart = hydrated && inCartQuantity >= MAX_QUANTITY_PER_ITEM;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstVariant || isInCart) return;
    setAdding(true);
    const result = await addItem({
      product,
      variantId: firstVariant.id,
      variantTitle: firstVariant.title,
      price: firstVariant.price,
      quantity: 1,
      selectedOptions: firstVariant.selectedOptions ?? [],
    });
    setAdding(false);
    notifyAddResult(result, p.title, { position: "top-center" });
  };

  return (
    <Link
      to="/product/$handle"
      params={{ handle: p.handle }}
      className="group block animate-rise"
      style={{ animationDelay: `${(index % 6) * 80}ms` }}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border-2 border-ink bg-muted transition-shadow duration-300 group-hover:shadow-card">
        {images[0] ? (
          <>
            <img
              src={images[0].node.url}
              alt={images[0].node.altText ?? p.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {images[1] && (
              <img
                src={images[1].node.url}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center font-script text-2xl text-muted-foreground">
            Vintagery
          </div>
        )}
        <span className="eyebrow absolute left-3 top-3 rounded-full bg-mustard px-3 py-1 text-[0.6rem] text-mustard-foreground">
          № {String(index + 1).padStart(3, "0")}
        </span>
        {firstVariant && !hasChoices && (
          <button
            onClick={handleAdd}
            disabled={isInCart}
            aria-label={isInCart ? "Уже в кошику" : "Додати в кошик"}
            title={isInCart ? "Уже в кошику" : undefined}
            className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 transition-all duration-300 hover:bg-ink group-hover:opacity-100 disabled:bg-ink disabled:opacity-100 max-md:opacity-100"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isInCart ? (
              <Check className="h-5 w-5" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </button>
        )}
        {!firstVariant && (
          <span className="eyebrow absolute bottom-3 left-3 rounded-full bg-ink px-3 py-1 text-[0.6rem] text-ink-foreground">
            Продано
          </span>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-sm font-semibold leading-snug transition-colors group-hover:text-primary md:text-base">
            {p.title}
          </h3>
          {p.description && (
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{p.description}</p>
          )}
        </div>
        <span className="whitespace-nowrap rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
          {formatPrice(p.priceRange.minVariantPrice)}
        </span>
      </div>
    </Link>
  );
}

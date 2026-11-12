import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notifyAddResult } from "@/lib/cart-feedback";
import { productQueryOptions } from "@/lib/product-queries";
import { formatPrice } from "@/lib/shopify";
import { MAX_QUANTITY_PER_ITEM, useCartStore } from "@/stores/cartStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$handle")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQueryOptions(params.handle));
    if (!product) throw notFound();
    return {
      title: product.node.title,
      description: product.node.description,
      image: product.node.images.edges[0]?.node.url,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Vintagery" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.title} — Vintagery`;
    const description =
      loaderData.description?.slice(0, 160) || "Вінтажна річ у єдиному екземплярі від Vintagery.";
    const meta = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (loaderData.image) {
      meta.push(
        { property: "og:image", content: loaderData.image },
        { name: "twitter:image", content: loaderData.image },
      );
    }
    return { meta };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-5 py-32 text-center">
      <h1 className="font-display text-4xl">Річ не знайдено</h1>
      <p className="mt-4 text-muted-foreground">Можливо, її вже хтось забрав додому.</p>
      <Link to="/" className="eyebrow mt-8 inline-block underline underline-offset-4">
        До каталогу
      </Link>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { handle } = Route.useParams();
  const { data } = useSuspenseQuery(productQueryOptions(handle));
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const [activeImage, setActiveImage] = useState(0);

  const product = data!;
  const p = product.node;
  const variants = p.variants.edges.map((e) => e.node);
  const showOptions = !(p.options.length === 1 && p.options[0]?.values[0] === "Default Title");

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const first = variants.find((v) => v.availableForSale) ?? variants[0];
    return Object.fromEntries((first?.selectedOptions ?? []).map((o) => [o.name, o.value]));
  });

  const variant = useMemo(
    () =>
      variants.find((v) => v.selectedOptions.every((o) => selected[o.name] === o.value)) ??
      variants[0],
    [variants, selected],
  );

  const inCartQuantity = useCartStore(
    (s) => s.items.find((i) => i.variantId === variant?.id)?.quantity ?? 0,
  );
  // The cart is persisted in localStorage, so only trust it after hydration to keep SSR markup stable.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const isInCart = hydrated && inCartQuantity >= MAX_QUANTITY_PER_ITEM;

  const handleAdd = async () => {
    if (!variant) return;
    const result = await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions ?? [],
    });
    notifyAddResult(result, p.title);
  };

  const images = p.images.edges;

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-16">
      <Link
        to="/"
        className="eyebrow inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Каталог
      </Link>

      <div className="mt-8 grid gap-10 md:grid-cols-[1.2fr_1fr] lg:gap-16">
        <div className="flex flex-col gap-4">
          <div className="aspect-[3/4] overflow-hidden rounded-3xl border-2 border-ink bg-muted shadow-card">
            {images[activeImage] ? (
              <img
                src={images[activeImage].node.url}
                alt={images[activeImage].node.altText ?? p.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-script text-3xl text-muted-foreground">
                Vintagery
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {images.map((img, i) => (
                <button
                  key={img.node.url}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "aspect-square overflow-hidden rounded-xl border-2 transition-colors",
                    i === activeImage ? "border-primary" : "border-transparent opacity-70",
                  )}
                >
                  <img src={img.node.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:sticky md:top-24 md:self-start">
          <p className="eyebrow text-primary">Єдиний екземпляр</p>
          <h1 className="mt-3 font-display text-3xl leading-tight md:text-4xl">{p.title}</h1>
          <p className="mt-5 inline-block rounded-full bg-mustard px-5 py-2 font-display text-2xl text-mustard-foreground">
            {variant ? formatPrice(variant.price) : formatPrice(p.priceRange.minVariantPrice)}
          </p>

          {showOptions &&
            p.options.map((option) => (
              <div key={option.name} className="mt-8">
                <p className="eyebrow mb-3 text-muted-foreground">{option.name}</p>
                <div className="flex flex-wrap gap-2">
                  {option.values.map((value) => {
                    const active = selected[option.name] === value;
                    return (
                      <button
                        key={value}
                        onClick={() => setSelected((s) => ({ ...s, [option.name]: value }))}
                        className={cn(
                          "min-w-12 rounded-full border-2 px-4 py-2 text-sm transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "hover:border-primary",
                        )}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

          <Button
            variant="ink"
            size="xl"
            className="mt-10 w-full"
            onClick={handleAdd}
            disabled={isLoading || isInCart || !variant?.availableForSale}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : !variant?.availableForSale ? (
              "Продано"
            ) : isInCart ? (
              <>
                <Check /> Уже в кошику
              </>
            ) : (
              "Додати в кошик"
            )}
          </Button>

          {p.description && (
            <div className="mt-10 border-t pt-6">
              <p className="eyebrow mb-3 text-muted-foreground">Опис</p>
              <p className="whitespace-pre-line leading-relaxed">{p.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDown } from "lucide-react";
import heroImg from "@/assets/hero-vintage-rack.jpg";
import detailsImg from "@/assets/vintage-details.jpg";
import { productsQueryOptions } from "@/lib/product-queries";
import { ProductCard } from "@/components/store/ProductCard";
import { CatalogFilters } from "@/components/store/CatalogFilters";
import { LavaLamp } from "@/components/store/LavaLamp";
import { VintageryFm } from "@/components/store/VintageryFm";
import { collectSizes, filterProducts } from "@/lib/catalog-filters";
import { SHARE_IMAGE, SITE_URL } from "@/lib/site";

// Shown under the title in search results and link previews (Telegram, Viber, Facebook…).
const SHARE_DESCRIPTION =
  "Вінтажний одяг 70-х, 80-х і 90-х, відібраний вручну. Кожна річ — у єдиному екземплярі. Поставте платівку й знайдіть свою.";

type CatalogSearch = { size?: string | undefined; price?: string | undefined };

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vintagery — вінтажний одяг з історією" },
      { name: "description", content: SHARE_DESCRIPTION },
      { property: "og:site_name", content: "Vintagery" },
      { property: "og:title", content: "Vintagery — вінтажний одяг з історією" },
      { property: "og:description", content: SHARE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:locale", content: "uk_UA" },
      { property: "og:image", content: SHARE_IMAGE.url },
      { property: "og:image:width", content: String(SHARE_IMAGE.width) },
      { property: "og:image:height", content: String(SHARE_IMAGE.height) },
      { property: "og:image:alt", content: SHARE_IMAGE.alt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Vintagery — вінтажний одяг з історією" },
      { name: "twitter:description", content: SHARE_DESCRIPTION },
      { name: "twitter:image", content: SHARE_IMAGE.url },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): CatalogSearch => ({
    size: typeof search["size"] === "string" && search["size"] ? search["size"] : undefined,
    price: typeof search["price"] === "string" && search["price"] ? search["price"] : undefined,
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQueryOptions()),
  component: Index,
});

const marqueeWords = [
  "Відібрано вручну",
  "Єдиний екземпляр",
  "Друге життя речей",
  "70-ті · 80-ті · 90-ті",
  "Свідома мода",
];

function Index() {
  const { data: products } = useSuspenseQuery(productsQueryOptions());
  const { size, price } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const sizes = collectSizes(products);
  const visible = filterProducts(products, { size, price });
  const setFilters = (next: CatalogSearch) =>
    navigate({ search: next, replace: true, resetScroll: false, hash: "catalog" });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-clip">
        <LavaLamp className="opacity-55" />
        {/* Side by side only from lg: narrower, the arch is squeezed and its rings run into the text */}
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-12 md:px-10 md:pb-24 md:pt-16 lg:grid-cols-[1.1fr_1fr]">
          <div className="relative z-10">
            <p className="eyebrow inline-block animate-rise rounded-full bg-mustard px-4 py-2 text-mustard-foreground">
              Вінтажний одяг · з 1970-х до сьогодні
            </p>
            <h1
              className="mt-6 animate-rise text-4xl leading-[1.05] md:text-5xl lg:text-6xl"
              style={{ animationDelay: "120ms" }}
            >
              Речі, що <em className="text-[1.15em]">пам’ятають</em> більше, ніж ми
            </h1>
            <p
              className="mt-6 max-w-md animate-rise text-base leading-relaxed text-muted-foreground"
              style={{ animationDelay: "200ms" }}
            >
              Кожна річ — у єдиному екземплярі. Встигніть, поки вона ваша.
            </p>
            <a
              href="#catalog"
              className="eyebrow mt-10 inline-flex h-14 animate-rise items-center gap-3 rounded-full bg-primary px-8 text-primary-foreground shadow-card transition-all hover:-translate-y-0.5 hover:bg-sunset"
              style={{ animationDelay: "280ms" }}
            >
              До каталогу <ArrowDown className="h-4 w-4" />
            </a>
          </div>

          <div
            className="relative mx-auto w-[calc(100%-5rem)] max-w-md animate-rise sm:w-full"
            style={{ animationDelay: "160ms" }}
          >
            {/* Rainbow bands following the arch's outline, cut flat at its base. On phones the
                arch is narrowed so the bands fit on screen. */}
            <div className="absolute -inset-x-20 -top-20 bottom-0 overflow-hidden" aria-hidden>
              <div className="arch-rainbow absolute inset-x-20 bottom-0 top-20 rounded-t-full" />
            </div>
            <div className="relative overflow-hidden rounded-t-full border-4 border-ink shadow-card">
              <img
                src={heroImg}
                alt="Вішак з вінтажним одягом у світлій кімнаті"
                width={1600}
                height={1104}
                className="aspect-[4/5] w-full object-cover sepia-[0.25]"
              />
            </div>
            <span className="absolute -left-4 top-1/3 -rotate-12 rounded-full bg-ink px-5 py-3 font-script text-xl text-mustard shadow-card">
              groovy!
            </span>
          </div>
        </div>
        <div className="stripes-70 h-12" aria-hidden />
      </section>

      {/* Marquee */}
      <div className="overflow-hidden bg-ink py-4 text-mustard">
        <div className="flex w-max animate-marquee">
          {[...marqueeWords, ...marqueeWords, ...marqueeWords, ...marqueeWords].map((w, i) => (
            <span key={i} className="eyebrow flex items-center whitespace-nowrap px-6">
              {w}
              <span className="ml-12 text-lg text-sunset">✺</span>
            </span>
          ))}
        </div>
      </div>

      {/* Catalog */}
      <section id="catalog" className="mx-auto max-w-7xl scroll-mt-16 px-5 py-20 md:px-10 md:py-28">
        <div className="mb-12 flex flex-col justify-between gap-4 border-b-2 border-ink pb-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow inline-block rounded-full bg-mustard px-4 py-2 text-mustard-foreground">
              Колекція
            </p>
            <h2 className="mt-2 text-4xl md:text-5xl">
              Нові <em>надходження</em>
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {products.length > 0
              ? size || price
                ? `Знайдено ${visible.length} з ${products.length}`
                : `${products.length} позицій у наявності`
              : ""}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed py-24 text-center">
            <p className="font-script text-3xl text-primary">Товарів поки немає</p>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Нова колекція вже в дорозі. Зазирніть трохи згодом.
            </p>
          </div>
        ) : (
          <>
            <CatalogFilters sizes={sizes} size={size} price={price} onChange={setFilters} />
            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed py-20 text-center">
                <p className="font-script text-3xl text-primary">Нічого не знайшлося</p>
                <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                  Спробуйте інший розмір або ціну.
                </p>
                <button
                  type="button"
                  onClick={() => setFilters({})}
                  className="eyebrow mt-6 rounded-full bg-primary px-6 py-3 text-primary-foreground hover:bg-sunset"
                >
                  Скинути фільтри
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:gap-x-8">
                {visible.map((product, i) => (
                  <ProductCard key={product.node.id} product={product} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <VintageryFm />

      {/* Story */}
      <section id="story" className="scroll-mt-20 overflow-hidden bg-secondary">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:px-10 md:py-28">
          <img
            src={detailsImg}
            alt="Складені вінтажні светри та шкіряний ремінь"
            width={1024}
            height={1280}
            loading="lazy"
            className="aspect-[4/5] w-full rounded-t-full border-4 border-ink object-cover shadow-card"
          />
          <div className="relative z-10">
            <p className="eyebrow inline-block rounded-full bg-mustard px-4 py-2 text-mustard-foreground">
              Про Vintagery
            </p>
            <h2 className="mt-3 text-4xl leading-[1.05] md:text-5xl">
              Мода, яка <em>не минає</em>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Ми шукаємо одяг, створений з любов’ю до матеріалу та крою: вовна, що гріє
              десятиліттями, шкіра, що з роками стає тільки кращою, денім із власним характером.
              Кожну річ перевіряємо, чистимо та даємо їй друге життя.
            </p>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                ["01", "Відбір вручну"],
                ["02", "Чистка та догляд"],
                ["03", "Один екземпляр"],
              ].map(([n, label]) => (
                <div key={n} className="rounded-2xl border-2 border-ink bg-paper p-4">
                  <dt className="font-script text-3xl text-primary">{n}</dt>
                  <dd className="mt-1 text-sm">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}

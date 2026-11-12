## Project rules

- Products, cart and checkout come only from the Shopify Storefront API (`src/lib/shopify.ts`, cart state in `src/stores/cartStore.ts`); never add mock products or hand-built checkout URLs — checkout must use the cart's `checkoutUrl` with `channel=online_store`, opened in a new tab.
- Product data loads through route loaders + `useSuspenseQuery` with shared options in `src/lib/product-queries.ts`, so SSR and client share one cache.
- Do not edit a file whose header says it is automatically generated (e.g. `src/routeTree.gen.ts`).
- Do not put secret values in the repo.

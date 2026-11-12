import { queryOptions } from "@tanstack/react-query";
import { fetchProductByHandle, fetchProducts } from "./shopify";

export const productsQueryOptions = () =>
  queryOptions({
    queryKey: ["shopify", "products"],
    queryFn: () => fetchProducts(50),
    staleTime: 60_000,
  });

export const productQueryOptions = (handle: string) =>
  queryOptions({
    queryKey: ["shopify", "product", handle],
    queryFn: () => fetchProductByHandle(handle),
    staleTime: 60_000,
  });

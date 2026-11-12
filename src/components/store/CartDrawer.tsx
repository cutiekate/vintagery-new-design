import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingBag, Minus, Plus, X, ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MAX_QUANTITY_PER_ITEM, useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/shopify";
import { VinylRecord } from "./VinylRecord";

function itemsLabel(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} річ`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} речі`;
  return `${n} речей`;
}

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { items, isLoading, isSyncing, updateQuantity, removeItem, getCheckoutUrl, syncCart } =
    useCartStore();

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (isOpen) syncCart();
  }, [isOpen, syncCart]);

  const totalItems = mounted ? items.reduce((sum, i) => sum + i.quantity, 0) : 0;

  // Spin the record whenever the count goes up — but not when the saved cart first loads.
  const [spinKey, setSpinKey] = useState(0);
  const prevTotal = useRef<number | null>(null);
  useEffect(() => {
    if (!mounted) return;
    if (prevTotal.current !== null && totalItems > prevTotal.current) setSpinKey((k) => k + 1);
    prevTotal.current = totalItems;
  }, [mounted, totalItems]);
  useEffect(() => {
    if (spinKey === 0) return;
    const t = setTimeout(() => setSpinKey(0), 1400);
    return () => clearTimeout(t);
  }, [spinKey]);
  const totalPrice = items.reduce((sum, i) => sum + parseFloat(i.price.amount) * i.quantity, 0);
  const currency = items[0]?.price.currencyCode ?? "UAH";

  const changeQuantity = async (variantId: string, quantity: number) => {
    const warning = await updateQuantity(variantId, quantity);
    if (warning) toast.warning("Кількість змінено", { description: warning });
  };

  const handleCheckout = () => {
    const checkoutUrl = getCheckoutUrl();
    if (checkoutUrl) {
      window.open(checkoutUrl, "_blank");
      setIsOpen(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Відкрити кошик"
          className="relative inline-flex h-10 items-center gap-2 px-2 text-foreground transition-colors hover:text-primary"
        >
          {spinKey > 0 ? (
            <VinylRecord key={spinKey} className="vinyl-spin h-5 w-5" />
          ) : (
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
          )}
          <span className="eyebrow hidden sm:inline">Кошик</span>
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {totalItems}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="flex h-full w-full flex-col bg-paper sm:max-w-md">
        <SheetHeader className="flex-shrink-0 border-b pb-5 text-left">
          <SheetTitle className="font-display text-2xl font-semibold">Ваш кошик</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? "Поки що тут порожньо" : itemsLabel(totalItems)}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" strokeWidth={1} />
            <p className="max-w-[16rem] text-sm text-muted-foreground">
              Знайдіть річ з історією у нашому каталозі — вона чекає саме на вас.
            </p>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto py-4">
              <ul className="divide-y">
                {items.map((item) => {
                  const img = item.product.node.images?.edges?.[0]?.node;
                  return (
                    <li key={item.variantId} className="flex gap-4 py-4">
                      <div className="h-24 w-20 flex-shrink-0 overflow-hidden bg-muted">
                        {img && (
                          <img
                            src={img.url}
                            alt={img.altText ?? item.product.node.title}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-display text-sm font-semibold leading-tight">
                            {item.product.node.title}
                          </h4>
                          <button
                            aria-label="Видалити"
                            onClick={() => removeItem(item.variantId)}
                            className="text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        {item.variantTitle !== "Default Title" && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.selectedOptions.map((o) => o.value).join(" · ")}
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-2">
                          {MAX_QUANTITY_PER_ITEM > 1 ? (
                            <div className="flex items-center border">
                              <button
                                aria-label="Менше"
                                className="flex h-7 w-7 items-center justify-center hover:bg-muted"
                                onClick={() => changeQuantity(item.variantId, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-7 text-center text-sm">{item.quantity}</span>
                              <button
                                aria-label="Більше"
                                className="flex h-7 w-7 items-center justify-center hover:bg-muted disabled:opacity-40"
                                disabled={item.quantity >= MAX_QUANTITY_PER_ITEM}
                                onClick={() => changeQuantity(item.variantId, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Єдиний екземпляр</span>
                          )}
                          <span className="text-sm font-semibold">
                            {formatPrice({
                              amount: String(parseFloat(item.price.amount) * item.quantity),
                              currencyCode: item.price.currencyCode,
                            })}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex-shrink-0 space-y-4 border-t pt-5">
              <div className="flex items-baseline justify-between">
                <span className="eyebrow text-muted-foreground">Разом</span>
                <span className="font-display text-2xl">
                  {formatPrice({ amount: String(totalPrice), currencyCode: currency })}
                </span>
              </div>
              <Button
                variant="ink"
                size="xl"
                className="w-full"
                onClick={handleCheckout}
                disabled={items.length === 0 || isLoading || isSyncing}
              >
                {isLoading || isSyncing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    Оформити замовлення <ArrowUpRight />
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Оплата відкриється у новій вкладці
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

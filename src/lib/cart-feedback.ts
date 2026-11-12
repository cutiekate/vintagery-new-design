import { toast } from "sonner";
import type { AddItemResult } from "@/stores/cartStore";

type ToastOptions = Parameters<typeof toast.success>[1];

/** Shows the toast that matches what happened when an item was added to the cart. */
export function notifyAddResult(result: AddItemResult, title: string, options: ToastOptions = {}) {
  switch (result.status) {
    case "added":
      if (result.warning)
        toast.warning("Додано не все", { description: result.warning, ...options });
      else toast.success("Додано в кошик", { description: title, ...options });
      return;
    case "already-in-cart":
      toast.info("Ця річ уже у вашому кошику", {
        description: "Кожна річ у нас існує в єдиному екземплярі.",
        ...options,
      });
      return;
    case "unavailable":
      toast.error("Цю річ уже забрали", {
        description: result.warning ?? "На жаль, її більше немає в наявності.",
        ...options,
      });
      return;
    case "failed":
      toast.error("Не вдалося додати в кошик", options);
  }
}

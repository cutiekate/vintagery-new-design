# Vintagery

Інтернет-магазин вінтажного одягу. Товари, кошик і оплата — через Shopify Storefront API.

**Мета:** покупці купують вінтажні речі, які люблять і носять.
**Показник:** замовлення, оформлені через оплату Shopify, щотижня.

## Стек

TanStack Start (React 19, SSR), Vite, Tailwind CSS 4, TanStack Query, Zustand. Продакшн-збірка — Cloudflare Worker (Nitro, пресет `cloudflare-module`).

## Розробка

Потрібен Node.js 20.19+ (рекомендовано 24) і npm.

```sh
npm install
npm run dev      # http://localhost:8080
npm run build    # продакшн-збірка в .output/
npm run test
npm run lint
```

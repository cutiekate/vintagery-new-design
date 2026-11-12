# Vintagery

[![CI](https://github.com/cutiekate/vintagery-new-design/actions/workflows/ci.yml/badge.svg)](https://github.com/cutiekate/vintagery-new-design/actions/workflows/ci.yml)

Інтернет-магазин вінтажного одягу: **[vintagery-new-design.vercel.app](https://vintagery-new-design.vercel.app)**. Товари, кошик і оплата — через Shopify Storefront API.

**Мета:** покупці купують вінтажні речі, які люблять і носять.
**Показник:** замовлення, оформлені через оплату Shopify, щотижня.

## Стек

TanStack Start (React 19, SSR), Vite, Tailwind CSS 4, TanStack Query, Zustand, TypeScript. Деплой — Vercel (Nitro визначає платформу сам; поза Vercel збирає Cloudflare Worker).

## Розробка

Потрібен Node.js 20.19+ (рекомендовано 24) і npm.

```sh
npm install
npm run dev        # http://localhost:8080
npm run build      # продакшн-збірка в .output/
npm test           # тести (Vitest)
npm run lint       # ESLint + Prettier
npm run typecheck  # TypeScript
```

## Тести і CI

Кожен пуш і pull request у GitHub Actions проходить лінтер, перевірку типів, тести й збірку ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

Тести в [`src/test/`](src/test/):

- **кошик** (`cart-store.test.ts`) — Shopify підмінений заглушками: перше додавання створює кошик, кожна річ лише в одному екземплярі, розпродана річ не потрапляє в кошик, протухлий кошик створюється заново, синхронізація прибирає зайве;
- **фільтри каталогу** — розміри й ціни;
- **ціни** — форматування гривні;
- **маршрутизація** — головна сторінка знаходиться.

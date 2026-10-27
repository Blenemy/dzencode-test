# Inventory — приходы и продукты

Тестовое задание dZENcode «SPA-приложение: Orders & Products» (уровень Middle).

**Прод:** https://dzen.topchyidev.shop

> Проект в разработке. Полное описание функций, архитектуры и соответствия пунктам ТЗ
> появится в этом файле по мере готовности.

## Стек

| Часть          | Технологии                                               |
| -------------- | -------------------------------------------------------- |
| web            | Next.js 16 (App Router, SSR), React 19, TypeScript       |
| api            | Express 5, Prisma 7, MySQL 8.4, TypeScript               |
| общий код      | `packages/shared`: схемы валидации, типы DTO, форматтеры |
| инфраструктура | Docker Compose, nginx-шлюз, GitHub Actions → GHCR → VPS  |

## Быстрый старт (Docker)

Нужны Docker с Compose v2.

```bash
cp .env.example .env
docker compose up -d --build
```

Приложение: http://localhost:8080, проверка API: http://localhost:8080/api/health.

## Разработка с хоста

Нужны Node.js 22 и Docker (только для MySQL).

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp .env.example .env
npm run dev
```

`npm run dev` поднимает MySQL в Docker, собирает `packages/shared` и запускает api (http://localhost:4000)
и web (http://localhost:3000) с перезагрузкой при изменениях.

## Скрипты

| Команда              | Что делает                            |
| -------------------- | ------------------------------------- |
| `npm run dev`        | MySQL + api + web в режиме разработки |
| `npm run build`      | сборка shared, api и web              |
| `npm run lint`       | ESLint по всем пакетам                |
| `npm run typecheck`  | проверка типов во всех пакетах        |
| `npm run format`     | Prettier                              |
| `npm run db:migrate` | новая миграция Prisma (разработка)    |

## Структура

```
apps/api         REST API (Express + Prisma)
apps/web         фронтенд (Next.js)
packages/shared  общий код api и web
docker/gateway   nginx: единая точка входа в стек
```

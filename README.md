# Inventory — приходы и продукты

Тестовое задание dZENcode «SPA-приложение: Orders & Products», уровень Middle.

Прод: https://dzen.topchyidev.shop · демо-доступ `demo@dzen.test` / `demo12345`

## Как поднять локально

Нужен Docker с Compose v2.

```bash
git clone https://github.com/Blenemy/dzencode-test.git
cd dzencode-test
cp .env.example .env
docker compose up -d --build
```

- приложение: http://localhost:8080
- Swagger: http://localhost:8080/api/docs

Демо-пользователь и демо-данные создаются автоматически.

Режим разработки с перезагрузкой (нужны Node.js 22 и Docker для MySQL):

```bash
npm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run dev
```

Web откроется на http://localhost:3000, api на http://localhost:4000.

Тесты: `npm run test:web` (unit), `npm run test:api` (интеграционные, нужна MySQL из
`docker compose up -d mysql`), `npm run test:e2e` (Playwright против запущенного Docker-стека).

## Что сделано

**Обязательная часть**

- Next.js 16 (App Router) + React 19, Redux Toolkit + RTK Query, TypeScript.
- Страницы: приходы, продукты, группы, пользователи, настройки, вход и регистрация.
- Navigation Menu и TopMenu: дата и время идут в реальном времени, рядом счётчик открытых вкладок через Socket.io.
- Приходы: клик открывает приход рядом со списком. В строке число продуктов, дата в двух форматах и
  сумма в USD и UAH. Удаление идёт через попап.
- Продукты: фильтр по типу и спецификации хранится в URL. Есть пагинация, поля по макету,
  добавление продукта.
- Анимации переходов между страницами и компонентами (motion).
- Bootstrap 5 из SCSS, вёрстка по БЭМ, адаптив до телефона.
- REST API на Express 5 + Prisma 7 + MySQL 8.4, документация в Swagger.
- Формы на react-hook-form + zod; схемы валидации общие с сервером.
- Docker Compose: MySQL, миграции, api, web, nginx-шлюз.
- Деплой: GitHub Actions → GHCR → VPS.
- Схема БД для MySQL Workbench: `db/inventory.mwb`, она же в SQL — `db/schema.sql`.

**Junior+**

- SSR: данные страниц рендерятся на сервере и сразу попадают в кеш RTK Query.
- i18n: русский и английский (next-intl).
- JWT: access и refresh в httpOnly-куках, refresh ротируется.
- Web Storage: валюта, анимации и фильтры в localStorage, ID вкладки в sessionStorage.
- Lazy Loading: попапы, формы, графики, карта и воркеры грузятся по требованию.
- Charts: графики recharts на странице «Группы».
- Maps: карта складов на react-leaflet и OpenStreetMap на странице «Пользователи».
- Unit-тесты: Vitest.

**Middle**

- Graph: графики на «Группах» — продукты по группам, статусам и типам, стоимость приходов по месяцам.
- Web Workers: нечёткий поиск в шапке и сборка CSV-выгрузки продуктов.
- PWA: манифест, иконки, свой service worker, офлайн-страница.
- EDA: сервер публикует доменные события в шину. Socket.io рассылает их во все вкладки, клиент
  превращает их в Redux-экшены и обновляет данные.
- Оптимизация: Bootstrap собран только из нужных частей, `next/font`, ленивая загрузка, gzip,
  статика с `immutable`-кешем. Lighthouse 96–100.
- npm scripts: `dev`, `build`, `lint`, `typecheck`, `test:*`, `db:*`, `analyze`.
- Интеграционные тесты api против настоящей MySQL (Vitest + supertest) и e2e на Playwright против
  стека в Docker. Всё это гоняется в CI на каждый PR.

## Что отброшено

- **GraphQL.** Данные — несколько плоских ресурсов с фильтрами, обновления в реальном времени уже
  идут через Socket.io. GraphQL добавил бы вторую схему API и слой резолверов без выигрыша для этих
  экранов, поэтому API — REST с OpenAPI и общими zod-схемами.
- **Middle+** (микросервисы, micro frontend, WebAssembly) — вне целевого уровня.
- **Масштабирование Socket.io на несколько экземпляров api.** Счётчик вкладок хранится в памяти
  одного процесса. Для нескольких экземпляров понадобится Redis-адаптер, для тестового он избыточен.

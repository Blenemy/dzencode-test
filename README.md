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

Нужен Docker с Compose v2.

```bash
cp .env.example .env
docker compose up -d --build
```

Приложение: http://localhost:8080, проверка API: http://localhost:8080/api/health.

Стек из пяти контейнеров:

| Сервис    | Назначение                                                                |
| --------- | ------------------------------------------------------------------------- |
| `mysql`   | MySQL 8.4, порт опубликован только на `127.0.0.1:3307`                    |
| `migrate` | одноразовый: применяет миграции Prisma и завершается                      |
| `api`     | Express на порту 4000 внутри сети                                         |
| `web`     | Next.js standalone на порту 3000 внутри сети                              |
| `gateway` | nginx: `/` → web, `/api` и `/api/socket.io` → api, `/uploads` — из volume |

## Разработка с хоста

Нужны Node.js 22 и Docker (только для MySQL).

```bash
npm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run dev
```

`npm run dev` поднимает MySQL в Docker, собирает `packages/shared` и запускает api (http://localhost:4000)
и web (http://localhost:3000) с перезагрузкой при изменениях. Next проксирует `/api` в api,
поэтому браузер работает с одним origin, как на проде.

## Переменные окружения

Корневой `.env` читает `docker-compose.yml`:

| Переменная                     | Назначение                                                              |
| ------------------------------ | ----------------------------------------------------------------------- |
| `MYSQL_ROOT_PASSWORD`          | пароль root MySQL                                                       |
| `MYSQL_DATABASE`, `MYSQL_USER` | база и пользователь приложения                                          |
| `MYSQL_PASSWORD`               | пароль пользователя; из него же собирается `DATABASE_URL` для api       |
| `MYSQL_HOST_PORT`              | порт MySQL на `127.0.0.1` хоста (по умолчанию 3307)                     |
| `PUBLIC_URL`                   | адрес приложения в браузере; с ним сверяются CORS и проверка Origin     |
| `GATEWAY_PORT`                 | порт шлюза на `127.0.0.1` хоста (локально 8080, на сервере 8090)        |
| `TRUST_PROXY`                  | сколько прокси перед api: локально 1 (шлюз), на проде 2 (+ nginx хоста) |
| `LOG_LEVEL`                    | уровень логов pino                                                      |
| `IMAGE_REGISTRY`, `IMAGE_TAG`  | откуда брать образы; деплой подставляет sha коммита                     |

`apps/api/.env` и `apps/web/.env.local` нужны только для запуска с хоста: в них адрес MySQL на
`127.0.0.1:3307` и адрес api для прокси Next.

## Скрипты

| Команда              | Что делает                            |
| -------------------- | ------------------------------------- |
| `npm run dev`        | MySQL + api + web в режиме разработки |
| `npm run build`      | сборка shared, api и web              |
| `npm run lint`       | ESLint по всем пакетам                |
| `npm run typecheck`  | проверка типов во всех пакетах        |
| `npm run format`     | Prettier                              |
| `npm run db:migrate` | новая миграция Prisma (разработка)    |
| `npm run docker:up`  | весь стек в Docker                    |

## Деплой

Push в `main` запускает `.github/workflows/deploy.yml`:

1. те же проверки, что и на PR (`ci.yml`);
2. сборка образов api и web и публикация в GHCR (сборка Next идёт в CI, а не на сервере, где живёт
   ещё один прод);
3. на сервере `git reset --hard origin/main`, `docker compose pull` и `up -d --no-build`;
4. проверка `https://dzen.topchyidev.shop/api/health` через nginx хоста и шлюз.

Секреты репозитория: `SSH_HOST`, `SSH_USER`, `SSH_KEY`.

Разовая настройка сервера:

```bash
sudo mkdir -p /opt/dzen-inventory && sudo chown deploy:deploy /opt/dzen-inventory
git clone https://github.com/Blenemy/dzencode-test.git /opt/dzen-inventory
cd /opt/dzen-inventory && cp .env.example .env && chmod 600 .env
sudo cp deploy/host-nginx.conf /etc/nginx/sites-available/dzen
sudo ln -s /etc/nginx/sites-available/dzen /etc/nginx/sites-enabled/dzen
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d dzen.topchyidev.shop
```

В `.env` на сервере: свои пароли (`openssl rand -hex 32`), `PUBLIC_URL=https://dzen.topchyidev.shop`,
`GATEWAY_PORT=8090`, `TRUST_PROXY=2`.

## Структура

```
apps/api         REST API (Express + Prisma)
apps/web         фронтенд (Next.js)
packages/shared  общий код api и web
docker/gateway   nginx: единая точка входа в стек
deploy           конфиг nginx хоста
```

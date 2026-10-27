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

Приложение: http://localhost:8080, проверка API: http://localhost:8080/api/health,
документация API (Swagger): http://localhost:8080/api/docs.

Демо-доступ: `demo@dzen.test` / `demo12345` (создаётся автоматически).

Стек из пяти контейнеров:

| Сервис    | Назначение                                                                |
| --------- | ------------------------------------------------------------------------- |
| `mysql`   | MySQL 8.4, порт опубликован только на `127.0.0.1:3307`                    |
| `migrate` | одноразовый: применяет миграции Prisma, создаёт демо-пользователя         |
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
| `JWT_ACCESS_SECRET`            | секрет access-токена, не короче 32 символов                             |
| `JWT_REFRESH_SECRET`           | секрет refresh-токена, не короче 32 символов и не равен access          |
| `COOKIE_SECURE`                | флаг Secure у кук авторизации: `true` на https, `false` локально        |
| `DEMO_EMAIL`, `DEMO_PASSWORD`  | демо-пользователь, которого создаёт сервис `migrate`                    |
| `IMAGE_REGISTRY`, `IMAGE_TAG`  | откуда брать образы; деплой подставляет sha коммита                     |

`apps/api/.env` и `apps/web/.env.local` нужны только для запуска с хоста: в них адрес MySQL на
`127.0.0.1:3307` и адрес api для прокси Next.

## API

REST под `/api`, полная спецификация — в Swagger на `/api/docs` (JSON: `/api/openapi.json`).

| Метод | Путь                 | Что делает                         |
| ----- | -------------------- | ---------------------------------- |
| GET   | `/api/health`        | состояние api и MySQL              |
| POST  | `/api/auth/register` | регистрация, сразу выдаёт сессию   |
| POST  | `/api/auth/login`    | вход по почте и паролю             |
| POST  | `/api/auth/refresh`  | новая пара токенов по refresh-куке |
| POST  | `/api/auth/logout`   | отзыв refresh-токена и очистка кук |
| GET   | `/api/auth/me`       | текущий пользователь               |

Ошибки всегда в одном формате: `{ error: { code, message, details? } }`. Интерфейс опирается на
`code`, а не на текст.

### Авторизация (JWT)

- Access-токен живёт 15 минут, refresh — 30 дней. Оба лежат в httpOnly-куках, в JSON токены не
  отдаются, JavaScript страницы их не видит.
- Кука `access_token` с `Path=/`: её видят SSR Next.js и Socket.io. Кука `refresh_token` с
  `Path=/api/auth`: она уходит только на эндпоинты авторизации.
- Refresh-токен ротируется при каждом обновлении. В базе хранится только его sha256.
- Повторное предъявление уже использованного refresh-токена считается кражей: отзывается вся
  цепочка сессии. Исключение — 10 секунд после ротации: так две вкладки, обновившиеся одновременно,
  получают одну и ту же новую сессию.
- Пароли — argon2id. Вход для неизвестной почты занимает столько же времени, сколько для известной.
- Изменяющие запросы с чужим `Origin` отклоняются (защита от CSRF), вход и регистрация ограничены
  по частоте с одного IP.

## Тесты

Интеграционные тесты api работают с настоящей MySQL: база `inventory_test` создаётся при первом
запуске контейнера MySQL, миграции к ней применяются перед прогоном.

```bash
docker compose up -d --wait mysql
npm run build -w @dzen/shared
npm run test:api
```

Другая база задаётся через `TEST_DATABASE_URL`. В CI тесты идут на каждый PR с MySQL в
сервис-контейнере.

## Скрипты

| Команда              | Что делает                            |
| -------------------- | ------------------------------------- |
| `npm run dev`        | MySQL + api + web в режиме разработки |
| `npm run build`      | сборка shared, api и web              |
| `npm run lint`       | ESLint по всем пакетам                |
| `npm run typecheck`  | проверка типов во всех пакетах        |
| `npm run format`     | Prettier                              |
| `npm run test`       | все тесты                             |
| `npm run test:api`   | интеграционные тесты api              |
| `npm run db:migrate` | создать миграцию по изменениям схемы  |
| `npm run db:apply`   | применить миграции к базе разработки  |
| `npm run db:seed`    | создать демо-пользователя             |
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
`GATEWAY_PORT=8090`, `TRUST_PROXY=2`, `COOKIE_SECURE=true`, свои `JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET`.

## Структура

```
apps/api         REST API (Express + Prisma)
apps/web         фронтенд (Next.js)
packages/shared  общий код api и web
docker/gateway   nginx: единая точка входа в стек
docker/mysql     init-скрипт MySQL: теневая и тестовая базы
deploy           конфиг nginx хоста
```

import 'dotenv/config';
import { z } from 'zod';

const secret = z.string().min(32, 'нужен секрет не короче 32 символов');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'нужна строка подключения к MySQL'),
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(1),
  APP_VERSION: z.string().default('dev'),

  JWT_ACCESS_SECRET: secret,
  JWT_REFRESH_SECRET: secret,
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(2_592_000),
  COOKIE_SECURE: z.stringbool().default(false),

  DEMO_EMAIL: z.email().default('demo@dzen.test'),
  DEMO_PASSWORD: z.string().min(8).default('demo12345'),
});

export type Env = z.infer<typeof envSchema>;

function fail(problems: string[]): never {
  console.error(`Некорректное окружение:\n${problems.join('\n')}\n\nСверься с .env.example`);
  process.exit(1);
}

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    fail(
      parsed.error.issues.map(
        (issue) => `  ${issue.path.join('.') || '(корень)'}: ${issue.message}`,
      ),
    );
  }

  if (parsed.data.JWT_ACCESS_SECRET === parsed.data.JWT_REFRESH_SECRET) {
    fail(['  JWT_REFRESH_SECRET: должен отличаться от JWT_ACCESS_SECRET']);
  }

  return parsed.data;
}

export const env = loadEnv();

export const corsOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const isProduction = env.NODE_ENV === 'production';

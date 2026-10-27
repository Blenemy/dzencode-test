import { loginSchema, registerSchema, updateProfileSchema } from '@dzen/shared';
import {
  jsonBody,
  jsonError,
  jsonResponse,
  registerPath,
  registerSchemaComponent,
} from '../../lib/openapi.js';

const setCookies = {
  'Set-Cookie': {
    description:
      'access_token (Path=/, 15 мин) и refresh_token (Path=/api/auth, 30 дней). HttpOnly, SameSite=Lax.',
    schema: { type: 'string' },
  },
};

export function registerAuthDocs(): void {
  registerSchemaComponent('AuthUser', {
    type: 'object',
    required: ['id', 'email', 'name', 'role', 'avatar'],
    properties: {
      id: { type: 'integer', example: 1 },
      email: { type: 'string', format: 'email' },
      name: { type: 'string' },
      role: { type: 'string', enum: ['USER', 'ADMIN'] },
      avatar: { type: 'string', nullable: true },
    },
  });

  registerSchemaComponent('AuthUserResponse', {
    type: 'object',
    required: ['user'],
    properties: { user: { $ref: '#/components/schemas/AuthUser' } },
  });

  registerPath('/auth/login', {
    post: {
      tags: ['auth'],
      summary: 'Вход по почте и паролю',
      requestBody: jsonBody(loginSchema),
      responses: {
        '200': { ...jsonResponse('Сессия выдана', 'AuthUserResponse'), headers: setCookies },
        '400': jsonError('VALIDATION_FAILED'),
        '401': jsonError('INVALID_CREDENTIALS'),
        '403': jsonError('USER_INACTIVE'),
        '429': jsonError('RATE_LIMITED'),
      },
    },
  });

  registerPath('/auth/register', {
    post: {
      tags: ['auth'],
      summary: 'Регистрация',
      requestBody: jsonBody(registerSchema),
      responses: {
        '201': {
          ...jsonResponse('Пользователь создан, сессия выдана', 'AuthUserResponse'),
          headers: setCookies,
        },
        '400': jsonError('VALIDATION_FAILED'),
        '409': jsonError('EMAIL_TAKEN'),
        '429': jsonError('RATE_LIMITED'),
      },
    },
  });

  registerPath('/auth/refresh', {
    post: {
      tags: ['auth'],
      summary: 'Обновить сессию по refresh-куке (ротация)',
      security: [{ refreshCookie: [] }],
      responses: {
        '200': { ...jsonResponse('Новая пара токенов', 'AuthUserResponse'), headers: setCookies },
        '401': jsonError('UNAUTHORIZED, TOKEN_INVALID, TOKEN_EXPIRED, TOKEN_REUSED'),
        '403': jsonError('USER_INACTIVE'),
      },
    },
  });

  registerPath('/auth/logout', {
    post: {
      tags: ['auth'],
      summary: 'Выход: отзывает refresh-токен и стирает куки',
      responses: { '200': { description: 'Готово' } },
    },
  });

  registerPath('/auth/me', {
    get: {
      tags: ['auth'],
      summary: 'Текущий пользователь',
      security: [{ accessCookie: [] }],
      responses: {
        '200': jsonResponse('Пользователь', 'AuthUserResponse'),
        '401': jsonError('UNAUTHORIZED, TOKEN_INVALID, TOKEN_EXPIRED'),
      },
    },
    patch: {
      tags: ['auth'],
      summary: 'Изменить имя и аватар (аватар — путь из POST /uploads или null)',
      security: [{ accessCookie: [] }],
      requestBody: jsonBody(updateProfileSchema),
      responses: {
        '200': jsonResponse('Обновлённый пользователь', 'AuthUserResponse'),
        '400': jsonError('VALIDATION_FAILED'),
        '401': jsonError('UNAUTHORIZED, TOKEN_INVALID, TOKEN_EXPIRED'),
      },
    },
  });

  registerPath('/auth/sessions', {
    delete: {
      tags: ['auth'],
      summary: 'Выйти на всех устройствах: отзывает все refresh-токены и стирает куки',
      security: [{ accessCookie: [] }],
      responses: {
        '200': { description: 'Готово' },
        '401': jsonError('UNAUTHORIZED, TOKEN_INVALID, TOKEN_EXPIRED'),
      },
    },
  });
}

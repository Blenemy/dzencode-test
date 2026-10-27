import {
  createOrderSchema,
  createProductSchema,
  orderDetailsSchema,
  orderSummarySchema,
  productGroupSchema,
  productQuerySchema,
  productSchema,
  productTypeSchema,
  specificationQuerySchema,
  statsSchema,
  uploadResultSchema,
  userSchema,
  warehouseSchema,
} from '@dzen/shared';
import {
  jsonBody,
  jsonError,
  jsonSchemaResponse,
  queryParameters,
  ref,
  registerPath,
  registerSchemaComponent,
  schemaFromZod,
} from '../../lib/openapi.js';

const auth = [{ accessCookie: [] }];
const idParameter = [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }];
const unauthorized = jsonError('UNAUTHORIZED, TOKEN_EXPIRED');

function listOf(name: string, extra: Record<string, unknown> = {}) {
  return {
    type: 'object',
    required: ['items', 'total', ...Object.keys(extra)],
    properties: {
      items: { type: 'array', items: ref(name) },
      total: { type: 'integer' },
      ...extra,
    },
  };
}

function arrayOf(name: string) {
  return { type: 'array', items: ref(name) };
}

export function registerInventoryDocs(): void {
  registerSchemaComponent('Product', schemaFromZod(productSchema));
  registerSchemaComponent('OrderSummary', schemaFromZod(orderSummarySchema));
  registerSchemaComponent('OrderDetails', schemaFromZod(orderDetailsSchema));
  registerSchemaComponent('ProductType', schemaFromZod(productTypeSchema));
  registerSchemaComponent('ProductGroup', schemaFromZod(productGroupSchema));
  registerSchemaComponent('User', schemaFromZod(userSchema));
  registerSchemaComponent('Warehouse', schemaFromZod(warehouseSchema));
  registerSchemaComponent('Stats', schemaFromZod(statsSchema));

  registerPath('/orders', {
    get: {
      tags: ['orders'],
      summary: 'Все приходы с количеством продуктов и суммой в каждой валюте',
      security: auth,
      responses: {
        '200': jsonSchemaResponse('Список', listOf('OrderSummary')),
        '401': unauthorized,
      },
    },
    post: {
      tags: ['orders'],
      summary: 'Создать приход',
      security: auth,
      requestBody: jsonBody(createOrderSchema),
      responses: {
        '201': jsonSchemaResponse('Создан', ref('OrderSummary')),
        '400': jsonError('VALIDATION_FAILED, INVALID_REFERENCE'),
        '401': unauthorized,
      },
    },
  });

  registerPath('/orders/{id}', {
    get: {
      tags: ['orders'],
      summary: 'Приход с продуктами',
      security: auth,
      parameters: idParameter,
      responses: {
        '200': jsonSchemaResponse('Приход', ref('OrderDetails')),
        '401': unauthorized,
        '404': jsonError('NOT_FOUND'),
      },
    },
    delete: {
      tags: ['orders'],
      summary: 'Удалить приход вместе с его продуктами',
      security: auth,
      parameters: idParameter,
      responses: {
        '204': { description: 'Удалён' },
        '401': unauthorized,
        '404': jsonError('NOT_FOUND'),
      },
    },
  });

  registerPath('/products', {
    get: {
      tags: ['products'],
      summary: 'Продукты с фильтрами и постраничной выдачей',
      security: auth,
      parameters: queryParameters(productQuerySchema),
      responses: {
        '200': jsonSchemaResponse(
          'Страница продуктов',
          listOf('Product', { page: { type: 'integer' }, limit: { type: 'integer' } }),
        ),
        '400': jsonError('VALIDATION_FAILED'),
        '401': unauthorized,
      },
    },
    post: {
      tags: ['products'],
      summary: 'Добавить продукт в приход',
      security: auth,
      requestBody: jsonBody(createProductSchema),
      responses: {
        '201': jsonSchemaResponse('Создан', ref('Product')),
        '400': jsonError('VALIDATION_FAILED, INVALID_REFERENCE'),
        '401': unauthorized,
        '409': jsonError('SERIAL_TAKEN'),
      },
    },
  });

  registerPath('/products/{id}', {
    get: {
      tags: ['products'],
      summary: 'Продукт',
      security: auth,
      parameters: idParameter,
      responses: {
        '200': jsonSchemaResponse('Продукт', ref('Product')),
        '401': unauthorized,
        '404': jsonError('NOT_FOUND'),
      },
    },
    delete: {
      tags: ['products'],
      summary: 'Удалить продукт',
      security: auth,
      parameters: idParameter,
      responses: {
        '204': { description: 'Удалён' },
        '401': unauthorized,
        '404': jsonError('NOT_FOUND'),
      },
    },
  });

  const catalog: [string, string, Record<string, unknown>][] = [
    ['/product-types', 'Типы продуктов', arrayOf('ProductType')],
    ['/groups', 'Группы продуктов', arrayOf('ProductGroup')],
    ['/users', 'Пользователи', arrayOf('User')],
    ['/warehouses', 'Склады с координатами для карты', arrayOf('Warehouse')],
  ];

  for (const [path, summary, schema] of catalog) {
    registerPath(path, {
      get: {
        tags: ['catalog'],
        summary,
        security: auth,
        responses: { '200': jsonSchemaResponse(summary, schema), '401': unauthorized },
      },
    });
  }

  registerPath('/specifications', {
    get: {
      tags: ['catalog'],
      summary: 'Спецификации продуктов, при необходимости только одного типа',
      security: auth,
      parameters: queryParameters(specificationQuerySchema),
      responses: {
        '200': jsonSchemaResponse('Спецификации', { type: 'array', items: { type: 'string' } }),
        '401': unauthorized,
      },
    },
  });

  registerPath('/stats', {
    get: {
      tags: ['stats'],
      summary: 'Сводка для графиков: по типам, статусам, группам и месяцам',
      security: auth,
      responses: { '200': jsonSchemaResponse('Сводка', ref('Stats')), '401': unauthorized },
    },
  });

  registerPath('/uploads', {
    post: {
      tags: ['uploads'],
      summary: 'Загрузить фото продукта (JPEG, PNG, WebP до 2 МБ)',
      security: auth,
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file'],
              properties: { file: { type: 'string', format: 'binary' } },
            },
          },
        },
      },
      responses: {
        '201': jsonSchemaResponse('Путь к файлу', schemaFromZod(uploadResultSchema)),
        '400': jsonError('VALIDATION_FAILED'),
        '401': unauthorized,
        '413': jsonError('FILE_TOO_LARGE'),
        '415': jsonError('UNSUPPORTED_FILE'),
        '429': jsonError('RATE_LIMITED'),
      },
    },
  });
}

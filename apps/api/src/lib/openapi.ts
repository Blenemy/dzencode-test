import { z } from 'zod';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

const paths: Record<string, Record<string, unknown>> = {};
const schemas: Record<string, unknown> = {};

export function schemaFromZod(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { target: 'openapi-3.0', io: 'input' }) as Record<
    string,
    unknown
  >;
  delete json['$schema'];
  delete json['id'];
  return json;
}

export function jsonBody(schema: z.ZodType) {
  return {
    required: true,
    content: { 'application/json': { schema: schemaFromZod(schema) } },
  };
}

export function jsonResponse(description: string, ref: string) {
  return {
    description,
    content: { 'application/json': { schema: { $ref: `#/components/schemas/${ref}` } } },
  };
}

export function jsonError(description: string) {
  return jsonResponse(description, 'Error');
}

export function registerSchemaComponent(name: string, schema: unknown): void {
  schemas[name] = schema;
}

export function registerPath(
  path: string,
  operations: Partial<Record<HttpMethod, Record<string, unknown>>>,
): void {
  paths[path] = { ...paths[path], ...operations };
}

export function buildOpenApiSpec(version: string) {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Inventory API',
      description: 'Orders & Products. Авторизация через httpOnly-куки, токены в JSON не отдаются.',
      version,
    },
    servers: [{ url: '/api' }],
    paths,
    components: {
      securitySchemes: {
        accessCookie: { type: 'apiKey', in: 'cookie', name: 'access_token' },
        refreshCookie: { type: 'apiKey', in: 'cookie', name: 'refresh_token' },
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: { type: 'string', example: 'VALIDATION_FAILED' },
                message: { type: 'string' },
                details: {},
              },
            },
          },
        },
        ...schemas,
      },
    },
  };
}

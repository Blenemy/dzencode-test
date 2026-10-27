import { registerPath } from '../../lib/openapi.js';

export function registerHealthDocs(): void {
  registerPath('/health', {
    get: {
      tags: ['system'],
      summary: 'Состояние api и MySQL',
      responses: {
        '200': { description: 'Всё работает' },
        '503': { description: 'MySQL недоступен' },
      },
    },
  });
}

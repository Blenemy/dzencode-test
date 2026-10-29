import { fileURLToPath } from 'node:url';

export const DEMO_STATE = fileURLToPath(new URL('../.auth/demo.json', import.meta.url));

import { execFileSync } from 'node:child_process';
import { readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseSchema } from './sql-model.js';
import { workbenchModel, type Position } from './workbench-model.js';
import { zip } from './zip.js';

const SCHEMA = 'inventory';

const LAYOUT: Record<string, Position> = {
  warehouses: { left: 40, top: 40 },
  users: { left: 360, top: 40 },
  refresh_tokens: { left: 680, top: 40 },
  orders: { left: 40, top: 420 },
  products: { left: 360, top: 420 },
  product_prices: { left: 680, top: 420 },
  product_groups: { left: 40, top: 740 },
  product_types: { left: 680, top: 660 },
};

const root = fileURLToPath(new URL('../../', import.meta.url));
const apiDir = `${root}apps/api`;
const prismaCli = `${root}node_modules/prisma/build/index.js`;

function prismaDdl(): string {
  const script = execFileSync(
    process.execPath,
    [
      prismaCli,
      'migrate',
      'diff',
      '--from-empty',
      '--to-schema',
      'prisma/schema.prisma',
      '--script',
    ],
    { cwd: apiDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  );
  return script
    .split('\n')
    .filter((line) => !line.startsWith('--'))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function lastMigrationDate(): string {
  const stamp = readdirSync(`${apiDir}/prisma/migrations`)
    .filter((name) => /^\d{14}_/.test(name))
    .sort()
    .at(-1);
  if (!stamp) throw new Error('Миграции не найдены');
  return `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)} ${stamp.slice(8, 10)}:${stamp.slice(10, 12)}`;
}

const ddl = prismaDdl();
const schemaSql = [
  `CREATE DATABASE IF NOT EXISTS \`${SCHEMA}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
  `USE \`${SCHEMA}\`;`,
  '',
  ddl,
  '',
].join('\n');
writeFileSync(`${root}db/schema.sql`, schemaSql);

const tables = parseSchema(ddl);
const xml = workbenchModel(tables, {
  schema: SCHEMA,
  caption: 'Inventory',
  project: 'dZENcode Inventory',
  description: 'Приходы, продукты, цены, справочники, пользователи и refresh-токены',
  date: lastMigrationDate(),
  layout: LAYOUT,
});
writeFileSync(
  `${root}db/inventory.mwb`,
  zip([{ name: 'document.mwb.xml', data: Buffer.from(xml, 'utf8') }]),
);

const foreignKeys = tables.reduce((sum, table) => sum + table.foreignKeys.length, 0);
console.log(
  `db/schema.sql и db/inventory.mwb: ${tables.length} таблиц, ${foreignKeys} внешних ключей`,
);

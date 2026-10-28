export interface Column {
  name: string;
  type: string;
  params: string | null;
  notNull: boolean;
  autoIncrement: boolean;
  defaultValue: string | null;
}

export interface Index {
  name: string;
  kind: 'PRIMARY' | 'UNIQUE' | 'INDEX';
  columns: string[];
}

export interface ForeignKey {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete: string;
  onUpdate: string;
}

export interface Table {
  name: string;
  columns: Column[];
  indices: Index[];
  foreignKeys: ForeignKey[];
}

const TABLE = /CREATE TABLE `(\w+)` \(\n([\s\S]*?)\n\) DEFAULT CHARACTER SET/g;
const COLUMN =
  /^`(\w+)` ([A-Z]+)(?:\((.*?)\))?( NOT NULL| NULL)?( AUTO_INCREMENT)?(?: DEFAULT (.+))?$/;
const INDEX = /^(UNIQUE INDEX|INDEX) `(\w+)`\((.+)\)$/;
const PRIMARY = /^PRIMARY KEY \((.+)\)$/;
const FOREIGN_KEY =
  /ALTER TABLE `(\w+)` ADD CONSTRAINT `(\w+)` FOREIGN KEY \((.+?)\) REFERENCES `(\w+)`\((.+?)\) ON DELETE ([A-Z ]+?) ON UPDATE ([A-Z ]+?);/g;

function names(list: string): string[] {
  return list.split(',').map((name) => name.trim().replace(/`/g, ''));
}

function parseLine(table: Table, line: string) {
  const primary = line.match(PRIMARY);
  if (primary?.[1]) {
    table.indices.unshift({ name: 'PRIMARY', kind: 'PRIMARY', columns: names(primary[1]) });
    return;
  }
  const index = line.match(INDEX);
  if (index?.[1] && index[2] && index[3]) {
    const kind = index[1] === 'INDEX' ? 'INDEX' : 'UNIQUE';
    table.indices.push({ name: index[2], kind, columns: names(index[3]) });
    return;
  }
  const column = line.match(COLUMN);
  if (!column?.[1] || !column[2]) throw new Error(`Не разобрана строка: ${line}`);
  table.columns.push({
    name: column[1],
    type: column[2],
    params: column[3] ?? null,
    notNull: column[4] === ' NOT NULL',
    autoIncrement: Boolean(column[5]),
    defaultValue: column[6] ?? null,
  });
}

export function parseSchema(sql: string): Table[] {
  const tables = new Map<string, Table>();
  for (const [, name, body] of sql.matchAll(TABLE)) {
    if (!name || !body) continue;
    const table: Table = { name, columns: [], indices: [], foreignKeys: [] };
    body
      .split('\n')
      .map((line) => line.trim().replace(/,$/, ''))
      .filter(Boolean)
      .forEach((line) => parseLine(table, line));
    tables.set(name, table);
  }

  for (const [
    ,
    name,
    constraint,
    columns,
    referenced,
    referencedColumns,
    onDelete,
    onUpdate,
  ] of sql.matchAll(FOREIGN_KEY)) {
    const table = tables.get(name ?? '');
    if (!table || !constraint || !columns || !referenced || !referencedColumns) continue;
    table.foreignKeys.push({
      name: constraint,
      columns: names(columns),
      referencedTable: referenced,
      referencedColumns: names(referencedColumns),
      onDelete: onDelete ?? 'RESTRICT',
      onUpdate: onUpdate ?? 'RESTRICT',
    });
  }
  return [...tables.values()];
}

import {
  dict,
  document,
  int,
  link,
  list,
  object,
  real,
  ref,
  str,
  stringList,
  uuid,
} from './grt.js';
import type { Column, ForeignKey, Index, Table } from './sql-model.js';

const RDBMS = 'com.mysql.rdbms.mysql';
const CHARSET = 'utf8mb4';
const COLLATION = 'utf8mb4_unicode_ci';

const DATATYPES = [
  'tinyint',
  'smallint',
  'mediumint',
  'int',
  'bigint',
  'float',
  'real',
  'double',
  'decimal',
  'char',
  'nchar',
  'varchar',
  'nvarchar',
  'binary',
  'varbinary',
  'tinytext',
  'text',
  'mediumtext',
  'longtext',
  'tinyblob',
  'blob',
  'mediumblob',
  'longblob',
  'json',
  'datetime',
  'datetime_f',
  'date',
  'time',
  'time_f',
  'year',
  'timestamp',
  'timestamp_f',
  'geometry',
  'point',
  'linestring',
  'polygon',
  'geometrycollection',
  'multipoint',
  'multilinestring',
  'multipolygon',
  'bit',
  'boolean',
  'enum',
  'set',
];

const CHARSETS = [
  'big5',
  'dec8',
  'cp850',
  'hp8',
  'koi8r',
  'latin1',
  'latin2',
  'swe7',
  'ascii',
  'ujis',
  'sjis',
  'hebrew',
  'tis620',
  'euckr',
  'koi8u',
  'gb18030',
  'gb2312',
  'greek',
  'cp1250',
  'gbk',
  'latin5',
  'asmscii8',
  'utf8',
  'ucs2',
  'cp866',
  'keybcs2',
  'macce',
  'macroman',
  'cp852',
  'latin7',
  'cp1251',
  'cp1256',
  'cp1257',
  'binary',
  'geostd8',
  'cp932',
  'eucjpms',
  'utf8mb4',
  'utf16',
  'utf32',
];

const FIGURE_WIDTH = 250;
const ROW_HEIGHT = 23;
const FIGURE_CHROME = 78;

export interface Position {
  left: number;
  top: number;
}

export interface ModelOptions {
  schema: string;
  caption: string;
  project: string;
  description: string;
  date: string;
  layout: Record<string, Position>;
}

interface ColumnType {
  simpleType: string;
  length: number;
  precision: number;
  scale: number;
  explicitParams: string;
}

const ids = {
  document: uuid('document'),
  logicalModel: uuid('logical-model'),
  physicalModel: uuid('physical-model'),
  catalog: uuid('catalog'),
  version: uuid('catalog-version'),
  diagram: uuid('diagram'),
  rootLayer: uuid('root-layer'),
  info: uuid('document-info'),
  pageSettings: uuid('page-settings'),
  schema: (name: string) => uuid(`schema:${name}`),
  table: (table: string) => uuid(`table:${table}`),
  column: (table: string, column: string) => uuid(`column:${table}.${column}`),
  index: (table: string, index: string) => uuid(`index:${table}.${index}`),
  indexColumn: (table: string, index: string, column: string) =>
    uuid(`index-column:${table}.${index}.${column}`),
  foreignKey: (table: string, key: string) => uuid(`foreign-key:${table}.${key}`),
  figure: (table: string) => uuid(`figure:${table}`),
  connection: (table: string, key: string) => uuid(`connection:${table}.${key}`),
};

function columnType(column: Column): ColumnType {
  const base = { length: -1, precision: -1, scale: -1, explicitParams: '' };
  const size = Number(column.params);
  switch (column.type) {
    case 'INTEGER':
      return { ...base, simpleType: 'int' };
    case 'VARCHAR':
      return { ...base, simpleType: 'varchar', length: size };
    case 'CHAR':
      return { ...base, simpleType: 'char', length: size };
    case 'TEXT':
      return { ...base, simpleType: 'text' };
    case 'DOUBLE':
      return { ...base, simpleType: 'double' };
    case 'BOOLEAN':
      return { ...base, simpleType: 'tinyint', precision: 1 };
    case 'DATETIME':
      return column.params
        ? { ...base, simpleType: 'datetime_f', length: size }
        : { ...base, simpleType: 'datetime' };
    case 'DECIMAL': {
      const [precision, scale] = (column.params ?? '').split(',').map(Number);
      return { ...base, simpleType: 'decimal', precision: precision ?? -1, scale: scale ?? -1 };
    }
    case 'ENUM':
      return {
        ...base,
        simpleType: 'enum',
        explicitParams: `(${(column.params ?? '').replace(/,\s*/g, ',')})`,
      };
    default:
      throw new Error(`Тип ${column.type} не сопоставлен с MySQL Workbench`);
  }
}

function defaultValue(column: Column): string {
  if (column.type === 'BOOLEAN' && column.defaultValue) {
    return column.defaultValue === 'true' ? '1' : '0';
  }
  return column.defaultValue ?? '';
}

function sameColumns(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((name, index) => right[index] === name);
}

function coveringIndex(table: Table, key: ForeignKey): Index | undefined {
  return table.indices.find((index) =>
    sameColumns(index.columns.slice(0, key.columns.length), key.columns),
  );
}

function columnXml(table: Table, column: Column): string {
  const type = columnType(column);
  return object('db.mysql.Column', ids.column(table.name, column.name), undefined, [
    int('autoIncrement', column.autoIncrement),
    str('expression'),
    int('generated', 0),
    str('generatedStorage'),
    str('characterSetName'),
    list('db.CheckConstraint', 'checks'),
    str('collationName'),
    str('datatypeExplicitParams', type.explicitParams),
    str('defaultValue', defaultValue(column)),
    int('defaultValueIsNull', 0),
    stringList('flags'),
    int('isNotNull', column.notNull),
    int('length', type.length),
    int('precision', type.precision),
    int('scale', type.scale),
    link('db.SimpleDatatype', 'simpleType', `${RDBMS}.datatype.${type.simpleType}`),
    str('comment'),
    str('name', column.name),
    str('oldName', column.name),
    link('GrtObject', 'owner', ids.table(table.name)),
  ]);
}

function indexColumnXml(table: Table, index: Index, column: string): string {
  return object(
    'db.mysql.IndexColumn',
    ids.indexColumn(table.name, index.name, column),
    undefined,
    [
      int('columnLength', 0),
      str('comment'),
      int('descend', 0),
      str('expression'),
      link('db.Column', 'referencedColumn', ids.column(table.name, column)),
      str('name'),
      link('GrtObject', 'owner', ids.index(table.name, index.name)),
    ],
  );
}

function indexXml(table: Table, index: Index): string {
  return object('db.mysql.Index', ids.index(table.name, index.name), undefined, [
    str('algorithm'),
    list(
      'db.mysql.IndexColumn',
      'columns',
      index.columns.map((column) => indexColumnXml(table, index, column)),
    ),
    str('indexKind'),
    int('keyBlockSize', 0),
    str('lockOption'),
    int('visible', 1),
    str('withParser'),
    str('comment'),
    int('deferability', 0),
    str('indexType', index.kind),
    int('isPrimary', index.kind === 'PRIMARY'),
    str('name', index.name),
    int('unique', index.kind === 'UNIQUE'),
    int('commentedOut', 0),
    str('createDate'),
    dict('customData'),
    str('lastChangeDate'),
    int('modelOnly', 0),
    link('GrtNamedObject', 'owner', ids.table(table.name)),
    str('temp_sql'),
    str('oldName', index.name),
  ]);
}

function foreignKeyXml(table: Table, key: ForeignKey): string {
  const index = coveringIndex(table, key);
  const mandatory = key.columns.every(
    (name) => table.columns.find((column) => column.name === name)?.notNull,
  );
  const oneToOne = table.indices.some(
    (candidate) => candidate.kind !== 'INDEX' && sameColumns(candidate.columns, key.columns),
  );
  return object('db.mysql.ForeignKey', ids.foreignKey(table.name, key.name), undefined, [
    link('db.mysql.Table', 'referencedTable', ids.table(key.referencedTable)),
    list(
      'db.Column',
      'columns',
      key.columns.map((column) => ref(ids.column(table.name, column))),
    ),
    dict('customData'),
    int('deferability', 0),
    str('deleteRule', key.onDelete),
    ...(index ? [link('db.Index', 'index', ids.index(table.name, index.name))] : []),
    int('mandatory', mandatory),
    int('many', !oneToOne),
    int('modelOnly', 0),
    link('db.Table', 'owner', ids.table(table.name)),
    list(
      'db.Column',
      'referencedColumns',
      key.referencedColumns.map((column) => ref(ids.column(key.referencedTable, column))),
    ),
    int('referencedMandatory', 1),
    str('updateRule', key.onUpdate),
    str('comment'),
    str('name', key.name),
    str('oldName', key.name),
  ]);
}

function tableXml(table: Table, options: ModelOptions): string {
  const primary = table.indices.find((index) => index.kind === 'PRIMARY');
  return object('db.mysql.Table', ids.table(table.name), undefined, [
    str('avgRowLength'),
    int('checksum', 0),
    list(
      'db.mysql.Column',
      'columns',
      table.columns.map((column) => columnXml(table, column)),
    ),
    str('connectionString'),
    str('defaultCharacterSetName', CHARSET),
    str('defaultCollationName', COLLATION),
    int('delayKeyWrite', 0),
    list(
      'db.mysql.ForeignKey',
      'foreignKeys',
      table.foreignKeys.map((key) => foreignKeyXml(table, key)),
    ),
    list(
      'db.mysql.Index',
      'indices',
      table.indices.map((index) => indexXml(table, index)),
    ),
    str('keyBlockSize'),
    str('maxRows'),
    str('mergeInsert'),
    str('mergeUnion'),
    str('minRows'),
    str('nextAutoInc'),
    str('packKeys'),
    int('partitionCount', 0),
    list('db.mysql.PartitionDefinition', 'partitionDefinitions'),
    str('partitionExpression'),
    int('partitionKeyAlgorithm', 0),
    str('partitionType'),
    str('password'),
    ...(primary ? [link('db.mysql.Index', 'primaryKey', ids.index(table.name, primary.name))] : []),
    str('raidChunkSize'),
    str('raidChunks'),
    str('raidType'),
    str('rowFormat'),
    str('statsAutoRecalc'),
    str('statsPersistent'),
    int('statsSamplePages', 0),
    int('subpartitionCount', 0),
    str('subpartitionExpression'),
    int('subpartitionKeyAlgorithm', 0),
    str('subpartitionType'),
    str('tableDataDir'),
    str('tableEngine', 'InnoDB'),
    str('tableIndexDir'),
    str('tableSpace'),
    list('db.mysql.Trigger', 'triggers'),
    int('isStub', 0),
    int('isSystem', 0),
    int('isTemporary', 0),
    str('temporaryScope'),
    int('commentedOut', 0),
    str('createDate', options.date),
    dict('customData'),
    str('lastChangeDate', options.date),
    int('modelOnly', 0),
    str('name', table.name),
    link('GrtNamedObject', 'owner', ids.schema(options.schema)),
    str('temp_sql'),
    str('comment'),
    str('oldName', table.name),
  ]);
}

function schemaXml(tables: Table[], options: ModelOptions): string {
  return object('db.mysql.Schema', ids.schema(options.schema), undefined, [
    list('db.mysql.RoutineGroup', 'routineGroups'),
    list('db.mysql.Routine', 'routines'),
    list('db.mysql.Sequence', 'sequences'),
    list('db.mysql.StructuredDatatype', 'structuredTypes'),
    list('db.mysql.Synonym', 'synonyms'),
    list(
      'db.mysql.Table',
      'tables',
      tables.map((table) => tableXml(table, options)),
    ),
    list('db.mysql.View', 'views'),
    str('defaultCharacterSetName', CHARSET),
    str('defaultCollationName', COLLATION),
    list('db.Event', 'events'),
    int('commentedOut', 0),
    str('createDate', options.date),
    dict('customData'),
    str('lastChangeDate', options.date),
    int('modelOnly', 0),
    str('name', options.schema),
    link('GrtNamedObject', 'owner', ids.catalog),
    str('temp_sql'),
    str('comment'),
    str('oldName', options.schema),
  ]);
}

function catalogXml(tables: Table[], options: ModelOptions): string {
  return object('db.mysql.Catalog', ids.catalog, 'catalog', [
    list('db.mysql.LogFileGroup', 'logFileGroups'),
    list('db.mysql.Schema', 'schemata', [schemaXml(tables, options)]),
    list('db.mysql.ServerLink', 'serverLinks'),
    list('db.mysql.Tablespace', 'tablespaces'),
    list(
      'db.CharacterSet',
      'characterSets',
      CHARSETS.map((name) => ref(`${RDBMS}.charset.${name}`)),
    ),
    dict('customData'),
    str('defaultCharacterSetName', CHARSET),
    str('defaultCollationName', COLLATION),
    link('db.Schema', 'defaultSchema', ids.schema(options.schema)),
    list('db.Role', 'roles'),
    list(
      'db.SimpleDatatype',
      'simpleDatatypes',
      DATATYPES.map((name) => ref(`${RDBMS}.datatype.${name}`)),
    ),
    list('db.UserDatatype', 'userDatatypes'),
    list('db.User', 'users'),
    object('GrtVersion', ids.version, 'version', [
      int('buildNumber', -1),
      int('majorNumber', 8),
      int('minorNumber', 0),
      int('releaseNumber', 40),
      int('status', 0),
      str('name', 'Version'),
      link('GrtObject', 'owner', ids.catalog),
    ]),
    str('comment'),
    str('name', 'default'),
    str('oldName', 'default'),
    link('GrtObject', 'owner', ids.physicalModel),
  ]);
}

function placeTables(tables: Table[], layout: Record<string, Position>) {
  return tables.map((table, index) => {
    const position = layout[table.name] ?? {
      left: 40 + (index % 3) * 320,
      top: 40 + Math.floor(index / 3) * 460,
    };
    return {
      table,
      ...position,
      width: FIGURE_WIDTH,
      height: FIGURE_CHROME + table.columns.length * ROW_HEIGHT,
    };
  });
}

function connectionXml(table: Table, key: ForeignKey): string {
  return object('workbench.physical.Connection', ids.connection(table.name, key.name), undefined, [
    str('caption', key.name),
    real('captionXOffs', 0),
    real('captionYOffs', 0),
    str('comment'),
    real('endCaptionXOffs', 0),
    real('endCaptionYOffs', 0),
    str('extraCaption'),
    real('extraCaptionXOffs', 0),
    real('extraCaptionYOffs', 0),
    link('db.ForeignKey', 'foreignKey', ids.foreignKey(table.name, key.name)),
    real('middleSegmentOffset', 0),
    real('startCaptionXOffs', 0),
    real('startCaptionYOffs', 0),
    int('drawSplit', 0),
    link('model.Figure', 'endFigure', ids.figure(key.referencedTable)),
    link('model.Figure', 'startFigure', ids.figure(table.name)),
    link('model.Diagram', 'owner', ids.diagram),
    int('visible', 1),
    str('name'),
  ]);
}

function diagramXml(tables: Table[], options: ModelOptions): string {
  const placed = placeTables(tables, options.layout);
  const width = Math.max(...placed.map((figure) => figure.left + figure.width)) + 60;
  const height = Math.max(...placed.map((figure) => figure.top + figure.height)) + 60;

  const figures = placed.map((figure) =>
    object('workbench.physical.TableFigure', ids.figure(figure.table.name), undefined, [
      int('columnsExpanded', 1),
      int('foreignKeysExpanded', 0),
      int('indicesExpanded', 0),
      int('summarizeDisplay', -1),
      link('db.Table', 'table', ids.table(figure.table.name)),
      int('triggersExpanded', 0),
      str('color', '#98BFDA'),
      int('expanded', 1),
      real('height', figure.height),
      link('model.Layer', 'layer', ids.rootLayer),
      real('left', figure.left),
      int('locked', 0),
      int('manualSizing', 1),
      real('top', figure.top),
      real('width', figure.width),
      link('model.Diagram', 'owner', ids.diagram),
      int('visible', 1),
      str('name', figure.table.name),
    ]),
  );

  const connections = tables.flatMap((table) =>
    table.foreignKeys.map((key) => connectionXml(table, key)),
  );

  return object('workbench.physical.Diagram', ids.diagram, undefined, [
    int('closed', 0),
    list('model.Connection', 'connections', connections),
    str('description'),
    list('model.Figure', 'figures', figures),
    real('height', height),
    list('model.Layer', 'layers'),
    str('name', 'EER Diagram'),
    dict('options'),
    link('model.Model', 'owner', ids.physicalModel),
    object('workbench.physical.Layer', ids.rootLayer, 'rootLayer', [
      str('color'),
      str('description'),
      list(
        'model.Figure',
        'figures',
        placed.map((figure) => ref(ids.figure(figure.table.name))),
      ),
      list('model.Group', 'groups'),
      real('height', height),
      real('left', 0),
      list('model.Layer', 'subLayers'),
      real('top', 0),
      real('width', width),
      link('model.Diagram', 'owner', ids.diagram),
      int('visible', 1),
      str('name'),
    ]),
    list('model.Object', 'selection'),
    int('updateBlocked', 0),
    real('width', width),
    real('x', 0),
    real('y', 0),
    real('zoom', 1),
  ]);
}

export function workbenchModel(tables: Table[], options: ModelOptions): string {
  const physicalModel = object('workbench.physical.Model', ids.physicalModel, undefined, [
    catalogXml(tables, options),
    str('connectionNotation', 'crowsfoot'),
    list('db.mgmt.Connection', 'connections'),
    list('workbench.physical.Diagram', 'diagrams', [diagramXml(tables, options)]),
    str('figureNotation', 'workbench/default'),
    list('GrtStoredNote', 'notes'),
    link('db.mgmt.Rdbms', 'rdbms', RDBMS),
    list('db.Script', 'scripts'),
    dict('syncProfiles'),
    list('GrtObject', 'tagCategories'),
    list('meta.Tag', 'tags'),
    link('model.Diagram', 'currentDiagram', ids.diagram),
    dict('customData'),
    list('model.Marker', 'markers'),
    dict('options'),
    str('name'),
    link('GrtObject', 'owner', ids.document),
  ]);

  return document(
    object('workbench.Document', ids.document, undefined, [
      object('workbench.logical.Model', ids.logicalModel, 'logicalModel', [
        list('workbench.logical.Diagram', 'diagrams'),
        dict('customData'),
        list('model.Marker', 'markers'),
        dict('options'),
        str('name'),
        link('GrtObject', 'owner', ids.document),
      ]),
      list('workbench.OverviewPanel', 'overviewPanels'),
      list('workbench.physical.Model', 'physicalModels', [physicalModel]),
      dict('customData'),
      object('app.DocumentInfo', ids.info, 'info', [
        str('author'),
        str('caption', options.caption),
        str('dateChanged', options.date),
        str('dateCreated', options.date),
        str('description', options.description),
        str('project', options.project),
        str('version', '1.0'),
        str('name', 'Properties'),
        link('GrtObject', 'owner', ids.document),
      ]),
      object('app.PageSettings', ids.pageSettings, 'pageSettings', [
        real('marginBottom', 6.35),
        real('marginLeft', 6.35),
        real('marginRight', 6.35),
        real('marginTop', 6.35),
        str('orientation', 'landscape'),
        link('app.PaperType', 'paperType', 'com.mysql.wb.papertype.a4'),
        real('scale', 1),
        str('name'),
        link('GrtObject', 'owner', ids.document),
      ]),
      str('name'),
    ]),
  );
}

import { createHash } from 'node:crypto';

const CHECKSUMS: Record<string, string> = {
  'workbench.Document': '0x7131bf99',
  'workbench.logical.Model': '0xf4220370',
  'workbench.physical.Model': '0x5f896d18',
  'workbench.physical.Diagram': '0x232c2434',
  'workbench.physical.Connection': '0x9baebc92',
  'workbench.physical.TableFigure': '0x3b14eccb',
  'workbench.physical.Layer': '0x1d14ca4b',
  'db.mysql.Catalog': '0x82ad3466',
  'db.mysql.Schema': '0x20b94c22',
  'db.mysql.Table': '0x4564421a',
  'db.mysql.Column': '0xba88e21c',
  'db.mysql.Index': '0xdb1989cd',
  'db.mysql.IndexColumn': '0x62630b3c',
  'db.mysql.ForeignKey': '0x70a8fc40',
  'app.DocumentInfo': '0xbba780b8',
  'app.PageSettings': '0x7dc77977',
  GrtVersion: '0x7aaa4ede',
};

let pointer = 0x600001f50000;

function nextPointer(): string {
  pointer += 0x60;
  return `0x${pointer.toString(16)}`;
}

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function keyAttribute(key?: string): string {
  return key ? ` key="${key}"` : '';
}

function wrap(open: string, children: string[], close: string): string {
  return children.length === 0 ? `${open.slice(0, -1)}/>` : [open, ...children, close].join('\n');
}

export function uuid(seed: string): string {
  const hex = createHash('sha1').update(seed).digest('hex').toUpperCase();
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

export function str(key: string, value = ''): string {
  return `<value type="string" key="${key}">${escape(value)}</value>`;
}

export function int(key: string, value: number | boolean): string {
  return `<value type="int" key="${key}">${Number(value)}</value>`;
}

export function real(key: string, value: number): string {
  return `<value type="real" key="${key}">${value}</value>`;
}

export function link(struct: string, key: string, id: string): string {
  return `<link type="object" struct-name="${struct}" key="${key}">${id}</link>`;
}

export function ref(id: string): string {
  return `<link type="object">${id}</link>`;
}

export function list(contentStruct: string, key: string, items: string[] = []): string {
  const open = `<value _ptr_="${nextPointer()}" type="list" content-type="object" content-struct-name="${contentStruct}"${keyAttribute(key)}>`;
  return wrap(open, items, '</value>');
}

export function stringList(key: string, items: string[] = []): string {
  const open = `<value _ptr_="${nextPointer()}" type="list" content-type="string"${keyAttribute(key)}>`;
  return wrap(
    open,
    items.map((item) => `<value type="string">${escape(item)}</value>`),
    '</value>',
  );
}

export function dict(key: string, entries: string[] = []): string {
  return wrap(
    `<value _ptr_="${nextPointer()}" type="dict"${keyAttribute(key)}>`,
    entries,
    '</value>',
  );
}

export function object(
  struct: string,
  id: string,
  key: string | undefined,
  children: string[],
): string {
  const checksum = CHECKSUMS[struct];
  if (!checksum) throw new Error(`Нет контрольной суммы для ${struct}`);
  const open = `<value type="object" struct-name="${struct}" id="${id}" struct-checksum="${checksum}"${keyAttribute(key)}>`;
  return [open, ...children, '</value>'].join('\n');
}

export function document(root: string): string {
  return [
    '<?xml version="1.0"?>',
    '<data grt_format="2.0" document_type="MySQL Workbench Model" version="1.4.4">',
    root,
    '</data>',
    '',
  ].join('\n');
}

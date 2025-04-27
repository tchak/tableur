import * as v from 'valibot';

import { ID, ISODate, ISODateTime, Name, TypedValue } from './types';

export const ColumnImport = v.object({
  type: v.picklist(['text', 'number', 'boolean', 'date', 'datetime']),
  name: Name,
});
export type ColumnImport = v.InferInput<typeof ColumnImport>;

export const ImportPreviewJSON = v.object({
  id: ID,
  columns: v.array(ColumnImport),
  rows: v.array(v.array(v.nullable(v.string()))),
});
export type ImportPreviewJSON = v.InferInput<typeof ImportPreviewJSON>;

export const ImportPreviewInput = v.object({ file: v.file() });
export type ImportPreviewInput = v.InferInput<typeof ImportPreviewInput>;

export function detectType(value: string): ColumnImport['type'] {
  for (const fn of [parseNumber, parseBoolean, parseDateTime, parseDate]) {
    const type = fn(value)?.type;
    if (type) {
      return type;
    }
  }
  return 'text';
}

export function parseStringValue(
  value: string | null | undefined,
  type: ColumnImport['type'],
): TypedValue | null {
  if (value == null) {
    return null;
  }
  switch (type) {
    case 'text':
      return { type, value };
    case 'number':
      return parseNumber(value);
    case 'boolean':
      return parseBoolean(value);
    case 'date':
      return parseDate(value);
    case 'datetime':
      return parseDateTime(value);
  }
}

function parseNumber(value: string): { type: 'number'; value: number } | null {
  const result = v.safeParse(NumberValue, value);
  if (result.success) {
    return { type: 'number', value: result.output };
  }
  return null;
}

function parseBoolean(value: string): { type: 'boolean'; value: boolean } | null {
  const result = v.safeParse(BooleanValue, value);
  if (result.success) {
    return { type: 'boolean', value: result.output };
  }
  return null;
}

function parseDate(value: string): { type: 'date'; value: string } | null {
  const result = v.safeParse(ISODate, value);
  if (result.success) {
    return { type: 'date', value: result.output };
  }
  return null;
}

function parseDateTime(value: string): { type: 'datetime'; value: string } | null {
  const result = v.safeParse(ISODateTime, value);
  if (result.success) {
    return { type: 'datetime', value: result.output };
  }
  return null;
}

const NumberValue = v.pipe(v.string(), v.minLength(1), v.transform(Number), v.number());

const TrueValue = v.pipe(
  v.string(),
  v.toLowerCase(),
  v.picklist(['true', 't', 'yes', 'on', 'oui']),
  v.transform(() => true),
);
const FalseValue = v.pipe(
  v.string(),
  v.toLowerCase(),
  v.picklist(['false', 'n', 'no', 'off', 'non']),
  v.transform(() => false),
);
const BooleanValue = v.union([TrueValue, FalseValue]);

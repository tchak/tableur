import * as v from 'valibot';

import { ColumnCreateInput, ColumnJSON } from './column.types';
import { ColumnImport } from './import.types';
import { Description, ID, ISOTimestamp, Name, NewData } from './types';

export const TableCreateInput = v.object({
  organizationId: ID,
  name: Name,
  description: v.optional(Description),
  columns: v.optional(v.pipe(v.array(ColumnCreateInput), v.maxLength(1000))),
  rows: v.optional(v.pipe(v.array(NewData), v.maxLength(1000))),
});

export const TableUpdateInput = v.object({
  tableId: ID,
  name: v.optional(Name),
  description: v.optional(Description),
});

const TableFragment = v.object({
  id: ID,
  number: v.number(),
  name: v.string(),
  description: v.nullable(v.string()),
});

export const TableParams = v.object({ tableId: ID });

const TableJSON = v.object({
  ...TableFragment.entries,
  createdAt: ISOTimestamp,
  updatedAt: ISOTimestamp,
});

export const _TableJSON = v.object({
  data: TableJSON,
});

export const TableListJSON = v.object({
  data: v.array(TableJSON),
  meta: v.object({ total: v.pipe(v.number(), v.integer()) }),
});

export const TableGetJSON = v.object({
  data: v.object({ ...TableJSON.entries, columns: v.array(ColumnJSON) }),
});

export const TableImportInput = v.object({
  organizationId: ID,
  importId: ID,
  name: Name,
  mapping: v.record(v.string(), ColumnImport),
});
export type TableImportInput = v.InferInput<typeof TableImportInput>;

export const TableImportDataInput = v.object({
  tableId: ID,
  importId: ID,
  mapping: v.record(v.string(), ID),
});

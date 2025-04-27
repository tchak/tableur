import * as v from 'valibot';

import { ColumnCreateInput, ColumnJSON, ColumnOutput } from './column.types';
import { ColumnImport } from './import.types';
import { Description, ID, ISOTimestamp, Name, NewData, Timestamp } from './types';

export const TableCreateInput = v.object({
  name: Name,
  description: v.optional(Description),
  columns: v.optional(v.pipe(v.array(ColumnCreateInput), v.maxLength(1000))),
  rows: v.optional(v.pipe(v.array(NewData), v.maxLength(1000))),
});
export type TableCreateInput = v.InferInput<typeof TableCreateInput>;

export const TableUpdateInput = v.partial(
  v.object({
    name: Name,
    description: Description,
  }),
);
export type TableUpdateInput = v.InferInput<typeof TableUpdateInput>;

const TableFragment = v.object({
  id: ID,
  number: v.number(),
  name: v.string(),
  description: v.nullable(v.string()),
});

export const TableOutput = v.object({
  ...TableFragment.entries,
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type TableInput = v.InferInput<typeof TableOutput>;

export const TableGetOutput = v.object({
  ...TableOutput.entries,
  columns: v.array(ColumnOutput),
});
export type TableGetInput = v.InferInput<typeof TableGetOutput>;

export const TableParams = v.object({ tableId: ID });
export type TableParams = v.InferOutput<typeof TableParams>;

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
  importId: ID,
  name: Name,
  mapping: v.record(v.string(), ColumnImport),
});
export type TableImportInput = v.InferInput<typeof TableImportInput>;

export const TableImportDataInput = v.object({
  importId: ID,
  mapping: v.record(v.string(), ID),
});
export type TableImportDataInput = v.InferInput<typeof TableImportDataInput>;

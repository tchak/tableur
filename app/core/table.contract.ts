import { oc } from '@orpc/contract';
import * as v from 'valibot';

import { Column, ImportColumn } from './column.contract';
import { OrganizationParams } from './organization.contract';
import {
  Description,
  ID,
  ISOTimestamp,
  Name,
  NewData,
} from './shared.contract';

export { ImportColumn } from './column.contract';

export const TableParams = v.object({ tableId: ID });
export const TableCreateInput = v.object({
  organizationId: ID,
  name: Name,
  description: v.optional(Description),
  columns: v.optional(v.pipe(v.array(ImportColumn), v.maxLength(500))),
  rows: v.optional(v.pipe(v.array(NewData), v.maxLength(1000))),
});
export const TableUpdateInput = v.object({
  tableId: ID,
  name: v.optional(Name),
  description: v.optional(Description),
});

export const ImportPreviewInput = v.object({ file: v.file() });
export const TableImportInput = v.object({
  organizationId: ID,
  importId: ID,
  name: Name,
  mapping: v.record(v.string(), ImportColumn),
});
export const TableImportDataInput = v.object({
  tableId: ID,
  importId: ID,
  mapping: v.record(v.string(), ID),
});

const Table = v.object({
  id: ID,
  number: v.number(),
  name: v.string(),
  description: v.nullable(v.string()),
  createdAt: ISOTimestamp,
  updatedAt: ISOTimestamp,
});

export const FindTable = v.object({
  ...Table.entries,
  columns: v.array(Column),
});

export const ImportPreview = v.object({
  id: ID,
  columns: v.array(ImportColumn),
  rows: v.array(v.array(v.nullable(v.string()))),
  delimiter: v.string(),
});
export type ImportPreview = v.InferOutput<typeof ImportPreview>;

const create = oc.input(TableCreateInput).output(Table);
const update = oc.input(TableUpdateInput).output(v.void());
const destroy = oc.input(TableParams).output(v.void());
const clone = oc.input(TableParams).output(Table);
const list = oc
  .input(OrganizationParams)
  .route({ method: 'GET' })
  .output(v.array(Table));
const find = oc.input(TableParams).route({ method: 'GET' }).output(FindTable);
const csv = oc.input(TableParams).route({ method: 'GET' }).output(v.string());
const importPreview = oc.input(ImportPreviewInput).output(ImportPreview);
const importTable = oc.input(TableImportInput).output(Table);
const importData = oc
  .input(TableImportDataInput)
  .output(v.object({ rows: v.number() }));

function defined<T>(x: T | undefined): T {
  if (x === undefined) throw new Error('Value is undefined');
  return x;
}

export const openapi = {
  list: v.object({
    data: defined(list['~orpc'].outputSchema),
    meta: v.object({ total: v.pipe(v.number(), v.integer()) }),
  }),
  find: v.object({
    data: defined(find['~orpc'].outputSchema),
  }),
  create: v.object({
    data: defined(create['~orpc'].outputSchema),
  }),
  clone: v.object({
    data: defined(clone['~orpc'].outputSchema),
  }),
  importPreview: v.object({
    data: defined(importPreview['~orpc'].outputSchema),
  }),
  importTable: v.object({
    data: defined(importTable['~orpc'].outputSchema),
  }),
  importData: v.object({
    data: defined(importData['~orpc'].outputSchema),
  }),
};

export const contract = {
  create,
  update,
  destroy,
  clone,
  list,
  find,
  csv,
  importPreview,
  importTable,
  importData,
};

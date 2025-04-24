import * as v from 'valibot';

import { ColumnCreateInput, ColumnOutput } from './column.types';
import { Data, Description, ID, Name, Timestamp } from './types';

export const TableCreateInput = v.object({
  name: Name,
  description: v.optional(Description),
  columns: v.optional(v.pipe(v.array(ColumnCreateInput), v.maxLength(1000))),
  rows: v.optional(v.pipe(v.array(Data), v.maxLength(1000))),
});
export type TableCreateInput = v.InferInput<typeof TableCreateInput>;

export const TableUpdateInput = v.partial(
  v.object({
    name: Name,
    description: Description,
  }),
);
export type TableUpdateInput = v.InferInput<typeof TableUpdateInput>;

export const TableOutput = v.object({
  id: ID,
  number: v.number(),
  name: v.string(),
  description: v.nullable(v.string()),
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

import * as v from 'valibot';

import { SubmissionJSON, SubmissionOutput } from './submission.types';
import { TableGetJSON, TableGetOutput } from './table.types';
import {
  Data,
  ID,
  ISOTimestamp,
  NewData,
  Timestamp,
  UpdateData,
} from './types';

export const RowCreateInput = v.object({
  tableId: ID,
  data: v.optional(NewData),
});

export const RowUpdateInput = v.object({
  rowId: ID,
  data: UpdateData,
});

export const RowOutput = v.object({
  id: ID,
  number: v.number(),
  data: v.pipe(v.unknown(), Data),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type RowInput = v.InferInput<typeof RowOutput>;

export const RowGetOutput = v.object({
  ...RowOutput.entries,
  table: TableGetOutput,
  submission: v.nullable(SubmissionOutput),
});
export type RowGetInput = v.InferInput<typeof RowGetOutput>;

export const RowParams = v.object({ tableId: ID, rowId: ID });
export type RowParams = v.InferOutput<typeof RowParams>;

export const RowJSON = v.object({
  id: ID,
  number: v.number(),
  data: Data,
  createdAt: ISOTimestamp,
  updatedAt: ISOTimestamp,
});

export const RowGetJSON = v.object({
  data: v.object({
    ...RowJSON.entries,
    table: TableGetJSON.entries.data,
    submission: v.nullable(SubmissionJSON),
  }),
});
export const RowListJSON = v.object({
  data: v.array(RowJSON),
  meta: v.object({ total: v.pipe(v.number(), v.integer()) }),
});
export const RowCreateJSON = v.object({ data: RowJSON });

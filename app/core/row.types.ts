import * as v from 'valibot';

import { SubmissionOutput } from './submission.types';
import { TableGetOutput } from './table.types';
import { Data, ID, Timestamp } from './types';

export const RowCreateInput = v.object({
  data: v.optional(Data),
});
export type RowCreateInput = v.InferInput<typeof RowCreateInput>;

export const RowUpdateInput = v.object({
  data: Data,
});
export type RowUpdateInput = v.InferInput<typeof RowUpdateInput>;

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

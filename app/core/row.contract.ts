import { oc } from '@orpc/contract';
import * as v from 'valibot';

import { Data, ID, ISOTimestamp, NewData, UpdateData } from './shared.contract';

import { Submission } from './submission.contract';
import { FindTable } from './table.contract';

export const TableParams = v.object({ tableId: ID });
export const RowParams = v.object({ rowId: ID });
export const RowCreateInput = v.object({
  tableId: ID,
  data: v.optional(NewData),
});
export const RowUpdateInput = v.object({
  rowId: ID,
  data: UpdateData,
});

const Row = v.object({
  id: ID,
  number: v.number(),
  data: Data,
  createdAt: ISOTimestamp,
  updatedAt: ISOTimestamp,
});

const FindRow = v.object({
  ...Row.entries,
  table: FindTable,
  submission: v.nullable(Submission),
});

const create = oc.input(RowCreateInput).output(Row);
const update = oc.input(RowUpdateInput).output(v.void());
const destroy = oc.input(RowParams).output(v.void());
const find = oc.route({ method: 'GET' }).input(RowParams).output(FindRow);
const list = oc
  .input(TableParams)
  .route({ method: 'GET' })
  .output(v.array(Row));

function defined<T>(x: T | undefined): T {
  if (x === undefined) throw new Error('Value is undefined');
  return x;
}

export const openapi = {
  list: v.object({
    data: defined(list['~orpc'].outputSchema),
    meta: v.object({ total: v.pipe(v.number(), v.integer()) }),
  }),
  create: v.object({
    data: defined(create['~orpc'].outputSchema),
  }),
  find: v.object({
    data: defined(find['~orpc'].outputSchema),
  }),
};

export const contract = {
  create,
  update,
  destroy,
  find,
  list,
};

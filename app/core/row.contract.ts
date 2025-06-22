import { oc } from '@orpc/contract';
import * as v from 'valibot';

import { Data, ID, ISOTimestamp, NewData, UpdateData } from './shared.contract';

import { Submission } from './submission.contract';
import { ExpandedTable, TableParams } from './table.contract';

export const RowListQuery = v.object({
  cursor: v.optional(
    v.pipe(
      v.string(),
      v.transform((value) => parseInt(value)),
      v.number(),
    ),
  ),
  take: v.fallback(
    v.pipe(v.number(), v.integer(), v.toMinValue(1), v.toMaxValue(1000)),
    100,
  ),
  order: v.fallback(v.picklist(['asc', 'desc']), 'asc'),
  columns: v.optional(v.array(ID)),
});
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

const ExpandedRow = v.object({
  ...Row.entries,
  table: ExpandedTable,
  submission: v.nullable(Submission),
});

const create = oc.input(RowCreateInput).output(Row);
const update = oc.input(RowUpdateInput).output(v.void());
const destroy = oc.input(RowParams).output(v.void());
const find = oc.route({ method: 'GET' }).input(RowParams).output(ExpandedRow);
const list = oc
  .input(
    v.object({
      ...TableParams.entries,
      ...v.omit(RowListQuery, ['cursor']).entries,
      cursor: v.optional(v.number()),
    }),
  )
  .route({ method: 'GET' })
  .output(v.object({ items: v.array(Row), next: v.optional(v.string()) }));

function defined<T>(x: T | undefined): T {
  if (x === undefined) throw new Error('Value is undefined');
  return x;
}

export const openapi = {
  list: v.object({
    data: defined(list['~orpc'].outputSchema).entries.items,
    meta: v.object({ next: defined(list['~orpc'].outputSchema).entries.next }),
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

import { oc } from '@orpc/contract';
import * as v from 'valibot';

import { ID, ISOTimestamp } from './types';

export const RowParams = v.object({ rowId: ID });
export const CommentParams = v.object({ commentId: ID });
export const CommentCreateInput = v.object({
  rowId: ID,
  body: v.string(),
});

const Comment = v.object({
  id: ID,
  body: v.string(),
  createdAt: ISOTimestamp,
  user: v.object({ id: ID, email: v.string() }),
});

const create = oc.input(CommentCreateInput).output(Comment);
const destroy = oc.input(CommentParams).output(v.void());
const list = oc
  .input(RowParams)
  .route({ method: 'GET' })
  .output(v.array(Comment));

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
};

export const contract = {
  create,
  destroy,
  list,
};

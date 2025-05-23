import * as v from 'valibot';

import { ID, ISOTimestamp, Timestamp } from './types';

export const CommentCreateInput = v.object({
  rowId: ID,
  body: v.string(),
});

export const CommentOutput = v.object({
  id: ID,
  body: v.string(),
  createdAt: Timestamp,
  user: v.object({ id: ID, email: v.string() }),
});
export type CommentInput = v.InferInput<typeof CommentOutput>;

export const CommentParams = v.object({
  tableId: ID,
  rowId: ID,
  commentId: ID,
});
export type CommentParams = v.InferOutput<typeof CommentParams>;

export const CommentJSON = v.object({
  id: ID,
  body: v.string(),
  createdAt: ISOTimestamp,
  user: v.object({ id: ID, email: v.string() }),
});

export const CommentListJSON = v.object({
  data: v.array(CommentJSON),
  meta: v.object({ total: v.number() }),
});

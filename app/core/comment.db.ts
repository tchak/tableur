import * as v from 'valibot';
import { prisma } from '~/services/db';

import {
  CommentOutput,
  type CommentCreateInput,
  type CommentInput,
  type CommentParams,
} from './comment.types';
import { RowParams } from './row.types';
import { DeletedOutput, type DeletedInput } from './types';

export async function commentCreate(
  params: RowParams,
  input: CommentCreateInput
) {
  const comment: CommentInput = await prisma.comment.create({
    data: {
      row: {
        connect: {
          id: params.rowId,
          deletedAt: null,
          table: { id: params.tableId, deletedAt: null },
        },
      },
      user: { create: { email: `${crypto.randomUUID()}@user.com` } },
      ...input,
    },
    select: {
      id: true,
      body: true,
      createdAt: true,
      user: { select: { id: true, email: true } },
    },
  });
  return v.parse(CommentOutput, comment);
}

export async function commentDelete(params: CommentParams) {
  const comment: DeletedInput = await prisma.comment.update({
    where: {
      id: params.commentId,
      deletedAt: null,
      row: {
        id: params.rowId,
        deletedAt: null,
        table: { id: params.tableId, deletedAt: null },
      },
    },
    data: { deletedAt: new Date() },
    select: { id: true, deletedAt: true },
  });
  return v.parse(DeletedOutput, comment);
}

export async function commentList(params: RowParams) {
  const comments: CommentInput[] = await prisma.comment.findMany({
    where: {
      deletedAt: null,
      row: {
        id: params.rowId,
        deletedAt: null,
        table: { id: params.tableId, deletedAt: null },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      body: true,
      createdAt: true,
      user: { select: { id: true, email: true } },
    },
  });
  return v.parse(v.array(CommentOutput), comments);
}

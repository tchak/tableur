import { commentFind, rowFind } from '~/services/auth';
import { prisma } from '~/services/db';
import { authenticated } from '~/services/rpc';
import { CommentCreateInput, CommentParams } from './comment.types';
import { RowParams } from './row.types';

const commentCreate = authenticated
  .input(CommentCreateInput)
  .handler(async ({ context, input }) => {
    const data = await rowFind(input.rowId);
    context.check('row', 'write', data);

    return prisma.comment.create({
      data: {
        row: { connect: { id: input.rowId, deletedAt: null } },
        user: { connect: { id: context.user.id } },
        body: input.body,
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
        user: { select: { id: true, email: true } },
      },
    });
  });

const commentDelete = authenticated
  .input(CommentParams)
  .handler(async ({ context, input }) => {
    const data = await commentFind(input.commentId);
    context.check('comment', 'write', data);

    await prisma.comment.update({
      where: { id: input.commentId, deletedAt: null },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  });

export const commentList = authenticated
  .input(RowParams)
  .handler(async ({ context, input }) => {
    const data = await rowFind(input.rowId);
    context.check('row', 'read', data);
    return prisma.comment.findMany({
      where: { deletedAt: null, row: { id: input.rowId, deletedAt: null } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        body: true,
        createdAt: true,
        user: { select: { id: true, email: true } },
      },
    });
  });

export const router = {
  create: commentCreate,
  delete: commentDelete,
  list: commentList,
};

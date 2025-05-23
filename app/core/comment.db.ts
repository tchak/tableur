import { withComment, withRow } from '~/services/auth';
import { prisma } from '~/services/db';
import { authenticated } from '~/services/rpc';
import { CommentCreateInput, CommentParams } from './comment.types';
import { RowParams } from './row.types';

const commentCreate = authenticated
  .input(CommentCreateInput)
  .use(withRow)
  .handler(({ context, input }) => {
    context.check('row', 'write', context.row);

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
  .use(withComment)
  .handler(async ({ context, input }) => {
    context.check('comment', 'write', context.comment);
    await prisma.comment.update({
      where: { id: input.commentId, deletedAt: null },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  });

export const commentList = authenticated
  .input(RowParams)
  .use(withRow)
  .handler(({ context, input }) => {
    context.check('row', 'read', context.row);
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

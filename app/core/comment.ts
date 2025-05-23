import { implement } from '@orpc/server';

import { withComment, withRow } from '~/services/auth';
import { prisma } from '~/services/db';
import { authenticatedMiddleware } from '~/services/rpc';
import { contract } from './comment.contract';

const os = implement(contract).use(authenticatedMiddleware);

const create = os.create.use(withRow).handler(({ context, input }) => {
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

const destroy = os.destroy
  .use(withComment)
  .handler(async ({ context, input }) => {
    context.check('comment', 'write', context.comment);
    await prisma.comment.update({
      where: { id: input.commentId, deletedAt: null },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  });

const list = os.list.use(withRow).handler(({ context, input }) => {
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

export const router = os.router({
  create,
  destroy,
  list,
});

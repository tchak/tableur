import { implement } from '@orpc/server';

import { withRow, withTable } from '~/services/auth';
import { prisma } from '~/services/db';
import { authenticatedMiddleware } from '~/services/rpc';
import { contract } from './row.contract';

const os = implement(contract).use(authenticatedMiddleware);

const list = os.list.use(withTable).handler(async ({ context, input }) => {
  context.check('table', 'read', context.table);
  const rows = await prisma.row.findMany({
    where: {
      deletedAt: null,
      table: {
        id: input.tableId,
        deletedAt: null,
        organization: { deletedAt: null },
      },
    },
    orderBy: { number: input.order },
    take: input.take + 1,
    ...(input.cursor
      ? {
          cursor: {
            tableId_number: { tableId: input.tableId, number: input.cursor },
          },
        }
      : undefined),
    select: {
      id: true,
      number: true,
      data: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  const next = (rows.length > input.take ? rows.pop() : undefined)?.number;
  return { items: rows, next: next ? `${next}` : undefined };
});

const find = os.find.use(withRow).handler(async ({ context, input }) => {
  context.check('row', 'read', context.row);
  const { submission, ...row } = await prisma.row.findUniqueOrThrow({
    where: { id: input.rowId, deletedAt: null },
    select: {
      id: true,
      number: true,
      data: true,
      createdAt: true,
      updatedAt: true,
      submission: {
        select: {
          id: true,
          number: true,
          submittedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      table: {
        select: {
          id: true,
          number: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          columns: {
            where: { deletedAt: null },
            orderBy: { position: 'asc' },
            select: {
              id: true,
              name: true,
              type: true,
              createdAt: true,
              updatedAt: true,
              options: {
                orderBy: { position: 'asc' },
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });
  const submittedAt = submission?.submittedAt;
  if (submittedAt) {
    return {
      ...row,
      submission: { ...submission, submittedAt, state: 'submitted' },
    };
  }
  return { ...row, submittedAt: null, submission: null };
});

const create = os.create.use(withTable).handler(({ context, input }) => {
  context.check('table', 'createRow', context.table);
  return prisma.$transaction(async (tx) => {
    const { lastRowNumber } = await tx.table.update({
      where: { id: input.tableId },
      data: { lastRowNumber: { increment: 1 } },
      select: { lastRowNumber: true },
    });
    return prisma.row.create({
      data: {
        number: lastRowNumber,
        table: {
          connect: {
            id: input.tableId,
            deletedAt: null,
            organization: { deletedAt: null },
          },
        },
        data: input.data || {},
      },
      select: {
        id: true,
        number: true,
        data: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });
});

const update = os.update.use(withRow).handler(async ({ context, input }) => {
  context.check('row', 'write', context.row);
  await prisma.row.update({
    where: { id: input.rowId, deletedAt: null },
    data: input.data,
    select: { id: true },
  });
});

const destroy = os.destroy.use(withRow).handler(async ({ context, input }) => {
  context.check('row', 'write', context.row);
  await prisma.row.update({
    where: { id: input.rowId, deletedAt: null },
    data: { deletedAt: new Date() },
    select: { id: true },
  });
});

export const router = os.router({
  list,
  find,
  create,
  update,
  destroy,
});

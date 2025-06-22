import { implement } from '@orpc/server';
import * as R from 'remeda';

import { withRow, withTable } from '~/lib/auth';
import { prisma } from '~/lib/db';
import { authenticatedMiddleware } from '~/lib/rpc';
import { contract } from './row.contract';
import { castRowData } from './value';

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
  const columns = await prisma.column.findMany({
    where: {
      tableId: input.tableId,
      deletedAt: null,
      ...(input.columns ? { id: { in: input.columns } } : undefined),
    },
    select: {
      id: true,
      name: true,
      type: true,
      createdAt: true,
      updatedAt: true,
      options: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  const items = rows.map(({ data, ...row }) => ({
    ...row,
    data: castRowData(data, columns),
  }));
  const next = (rows.length > input.take ? rows.pop() : undefined)?.number;
  return { items, next: next ? `${next}` : undefined };
});

const find = os.find.use(withRow).handler(async ({ context, input }) => {
  context.check('row', 'read', context.row);
  const { submission, data, ...row } = await prisma.row.findUniqueOrThrow({
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
      data: castRowData(data, row.table.columns),
      submission: { ...submission, submittedAt, state: 'submitted' },
    };
  }
  return {
    ...row,
    data: castRowData(data, row.table.columns),
    submittedAt: null,
    submission: null,
  };
});

const create = os.create.use(withTable).handler(async ({ context, input }) => {
  context.check('table', 'createRow', context.table);
  const columns = await prisma.column.findMany({
    where: { tableId: input.tableId, deletedAt: null },
    select: {
      id: true,
      type: true,
      options: {
        where: { deletedAt: null },
        select: { id: true },
      },
    },
  });
  const columnIds = R.indexBy(columns, (column) => column.id);
  const data = R.pickBy(input.data ?? {}, (typedValue, key) => {
    return columnIds[key]?.type == typedValue.type;
  });
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
        data,
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
  const {
    table: { columns },
  } = await prisma.row.findUniqueOrThrow({
    where: { id: input.rowId, deletedAt: null, table: { deletedAt: null } },
    select: {
      table: {
        select: {
          columns: {
            where: { deletedAt: null },
            select: {
              id: true,
              type: true,
              options: {
                where: { deletedAt: null },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });
  const columnIds = R.indexBy(columns, (column) => column.id);
  const data = R.pickBy(input.data, (typedValue, key) => {
    return columnIds[key]?.type == typedValue.type;
  });
  await prisma.row.update({
    where: { id: input.rowId, deletedAt: null },
    data,
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

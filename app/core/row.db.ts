import { withRow, withTable } from '~/services/auth';
import { prisma } from '~/services/db';

import { authenticated } from '~/services/rpc';
import { RowCreateInput, RowParams, RowUpdateInput } from './row.types';
import { TableParams } from './table.types';

const rowCreate = authenticated
  .input(RowCreateInput)
  .use(withTable)
  .handler(({ context, input }) => {
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

const rowGet = authenticated
  .input(RowParams)
  .use(withRow)
  .handler(({ context, input }) => {
    context.check('row', 'read', context.row);
    return prisma.row.findUniqueOrThrow({
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
            state: true,
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
  });

const rowList = authenticated
  .input(TableParams)
  .use(withTable)
  .handler(({ context, input }) => {
    context.check('table', 'read', context.table);
    return prisma.row.findMany({
      where: {
        deletedAt: null,
        table: {
          id: input.tableId,
          deletedAt: null,
          organization: { deletedAt: null },
        },
      },
      orderBy: { number: 'asc' },
      take: 100,
      select: {
        id: true,
        number: true,
        data: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

const rowDelete = authenticated
  .input(RowParams)
  .use(withRow)
  .handler(async ({ context, input }) => {
    context.check('row', 'write', context.row);
    await prisma.row.update({
      where: { id: input.rowId, deletedAt: null },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  });

const rowUpdate = authenticated
  .input(RowUpdateInput)
  .use(withRow)
  .handler(async ({ context, input }) => {
    context.check('row', 'write', context.row);
    await prisma.row.update({
      where: { id: input.rowId, deletedAt: null },
      data: input.data,
      select: { id: true },
    });
  });

export const router = {
  get: rowGet,
  list: rowList,
  create: rowCreate,
  update: rowUpdate,
  delete: rowDelete,
};

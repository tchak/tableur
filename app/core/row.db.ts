import { rowFind, tableFind } from '~/services/auth';
import { prisma } from '~/services/db';

import { authenticated } from '~/services/rpc';
import { RowCreateInput, RowParams, RowUpdateInput } from './row.types';
import { TableParams } from './table.types';

const rowCreate = authenticated
  .input(RowCreateInput)
  .handler(async ({ context, input }) => {
    const table = await tableFind(input.tableId);
    context.check('table', 'createRow', table);
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
  .handler(async ({ context, input }) => {
    const row = await rowFind(input.rowId);
    context.check('row', 'read', row);
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
  .handler(async ({ context, input }) => {
    const table = await tableFind(input.tableId);
    context.check('table', 'read', table);
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
  .handler(async ({ context, input }) => {
    const row = await rowFind(input.rowId);
    context.check('row', 'write', row);
    const deletedAt = new Date();
    await prisma.row.update({
      where: { id: input.rowId, deletedAt: null },
      data: { deletedAt },
      select: { id: true, deletedAt: true },
    });
    return { id: input.rowId, deletedAt };
  });

const rowUpdate = authenticated
  .input(RowUpdateInput)
  .handler(async ({ context, input }) => {
    const row = await rowFind(input.rowId);
    context.check('row', 'write', row);
    return prisma.row.update({
      where: { id: input.rowId, deletedAt: null },
      data: input.data,
      select: {
        id: true,
        number: true,
        data: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

export const router = {
  get: rowGet,
  list: rowList,
  create: rowCreate,
  update: rowUpdate,
  delete: rowDelete,
};

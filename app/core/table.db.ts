import { tableFind } from '~/services/auth';
import { prisma } from '~/services/db';
import { authenticated } from '~/services/rpc';
import { OrganizationParams } from './organization.types';
import { TableCreateInput, TableParams, TableUpdateInput } from './table.types';

const tableList = authenticated
  .input(OrganizationParams)
  .handler(({ context, input }) => {
    context.check('organization', 'read', input);

    return prisma.table.findMany({
      where: {
        organization: { id: input.organizationId, deletedAt: null },
        deletedAt: null,
      },
      orderBy: { number: 'asc' },
      take: 100,
      select: {
        id: true,
        number: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

const tableGet = authenticated
  .input(TableParams)
  .handler(async ({ context, input }) => {
    const table = await tableFind(input.tableId);
    context.check('table', 'read', table);

    return prisma.table.findUniqueOrThrow({
      where: {
        id: input.tableId,
        organization: { deletedAt: null },
        deletedAt: null,
      },
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
    });
  });

export const tableCreate = authenticated
  .input(TableCreateInput)
  .handler(({ context, input }) => {
    context.check('organization', 'createTable', input);

    return prisma.$transaction(async (tx) => {
      const sequence = await tx.organizationTableSequence.upsert({
        where: { organizationId: input.organizationId },
        update: { lastTableNumber: { increment: 1 } },
        create: { organizationId: input.organizationId },
        select: { lastTableNumber: true },
      });
      const table = await tx.table.create({
        data: {
          organization: {
            connect: { id: input.organizationId, deletedAt: null },
          },
          number: sequence.lastTableNumber,
          name: input.name,
          //description: input.description,
          columns: {
            createMany: {
              data: (input.columns ?? []).map((column, position) => ({
                id: crypto.randomUUID(),
                position: position + 1,
                ...column,
              })),
            },
          },
          rows: {
            createMany: {
              data: (input.rows ?? []).map((_, position) => ({
                number: position + 1,
                data: {},
              })),
            },
          },
        },
        select: {
          id: true,
          number: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (input.rows && input.rows.length > 0) {
        await tx.tableRowSequence.create({
          data: { tableId: table.id, lastRowNumber: input.rows.length },
        });
      }
      return table;
    });
  });

const tableUpdate = authenticated
  .input(TableUpdateInput)
  .handler(async ({ context, input }) => {
    const table = await tableFind(input.tableId);
    context.check('table', 'write', table);

    await prisma.table.update({
      where: {
        id: input.tableId,
        organization: { deletedAt: null },
        deletedAt: null,
      },
      data: { name: input.name },
      select: {
        id: true,
        number: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

const tableDelete = authenticated
  .input(TableParams)
  .handler(async ({ context, input }) => {
    const table = await tableFind(input.tableId);
    context.check('table', 'write', table);

    return prisma.table.update({
      where: {
        id: input.tableId,
        organization: { deletedAt: null },
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  });

const tableClone = authenticated
  .input(TableParams)
  .handler(async ({ context, input }) => {
    const table = await tableFind(input.tableId);
    context.check('table', 'write', table);

    const originalTable = await prisma.table.findUniqueOrThrow({
      where: {
        id: input.tableId,
        organization: { deletedAt: null },
        deletedAt: null,
      },
      omit: {
        id: true,
        number: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });
    const columns = await prisma.column.findMany({
      where: {
        deletedAt: null,
        table: {
          id: input.tableId,
          organization: { deletedAt: null },
          deletedAt: null,
        },
      },
      omit: {
        tableId: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return prisma.$transaction(async (tx) => {
      const sequence = await tx.organizationTableSequence.upsert({
        where: { organizationId: originalTable.organizationId },
        update: { lastTableNumber: { increment: 1 } },
        create: { organizationId: originalTable.organizationId },
        select: { lastTableNumber: true },
      });
      return tx.table.create({
        data: {
          ...originalTable,
          number: sequence.lastTableNumber,
          columns: {
            createMany: {
              data: columns.map((column) => ({
                ...column,
              })),
            },
          },
        },
        select: {
          id: true,
          number: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  });

export const router = {
  get: tableGet,
  list: tableList,
  create: tableCreate,
  update: tableUpdate,
  delete: tableDelete,
  clone: tableClone,
};

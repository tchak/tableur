import * as R from 'remeda';

import { withTable } from '~/services/auth';
import { prisma } from '~/services/db';
import { authenticated } from '~/services/rpc';
import { OrganizationParams } from './organization.contract';
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
  .use(withTable)
  .handler(({ context, input }) => {
    context.check('table', 'read', context.table);
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
      const { lastTableNumber } = await tx.organization.update({
        where: { id: input.organizationId },
        data: { lastTableNumber: { increment: 1 } },
        select: { lastTableNumber: true },
      });
      return tx.table.create({
        data: {
          organization: {
            connect: { id: input.organizationId, deletedAt: null },
          },
          number: lastTableNumber,
          lastRowNumber: input.rows?.length ?? 0,
          ...R.omitBy(
            { name: input.name, description: input.description },
            R.isNot(R.isDefined),
          ),
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
    });
  });

const tableUpdate = authenticated
  .input(TableUpdateInput)
  .use(withTable)
  .handler(async ({ context, input }) => {
    context.check('table', 'write', context.table);
    await prisma.table.update({
      where: {
        id: input.tableId,
        organization: { deletedAt: null },
        deletedAt: null,
      },
      data: { name: input.name },
      select: { id: true },
    });
  });

const tableDelete = authenticated
  .input(TableParams)
  .use(withTable)
  .handler(async ({ context, input }) => {
    context.check('table', 'write', context.table);
    await prisma.table.update({
      where: {
        id: input.tableId,
        organization: { deletedAt: null },
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  });

const tableClone = authenticated
  .input(TableParams)
  .use(withTable)
  .handler(async ({ context, input }) => {
    context.check('table', 'write', context.table);

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
        lastRowNumber: true,
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
      const { lastTableNumber } = await tx.organization.update({
        where: { id: originalTable.organizationId },
        data: { lastTableNumber: { increment: 1 } },
        select: { lastTableNumber: true },
      });
      return tx.table.create({
        data: {
          ...originalTable,
          number: lastTableNumber,
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

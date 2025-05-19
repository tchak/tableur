import * as v from 'valibot';
import { prisma } from '~/services/db';

import type {
  RowCreateInput,
  RowGetInput,
  RowInput,
  RowParams,
  RowUpdateInput,
} from './row.types';
import { RowGetOutput, RowOutput } from './row.types';
import type { TableParams } from './table.types';
import { DeletedOutput, type DeletedInput } from './types';

export async function rowCreate(
  { tableId }: TableParams,
  { data }: RowCreateInput,
) {
  const row: RowInput = await prisma.$transaction(async (tx) => {
    const sequence = await tx.tableRowSequence.upsert({
      where: { tableId },
      update: { lastRowNumber: { increment: 1 } },
      create: { tableId },
      select: { lastRowNumber: true },
    });
    return prisma.row.create({
      data: {
        number: sequence.lastRowNumber,
        table: {
          connect: {
            id: tableId,
            deletedAt: null,
            organization: { deletedAt: null },
          },
        },
        data: data || {},
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
  return v.parse(RowOutput, row);
}

export async function rowGet({ tableId, rowId }: RowParams) {
  const row: RowGetInput = await prisma.row.findUniqueOrThrow({
    where: {
      id: rowId,
      deletedAt: null,
      table: {
        id: tableId,
        deletedAt: null,
        organization: { deletedAt: null },
      },
    },
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
  return v.parse(RowGetOutput, row);
}

export async function rowList({ tableId }: TableParams) {
  const rows = await prisma.row.findMany({
    where: {
      deletedAt: null,
      table: {
        id: tableId,
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
  return v.parse(v.array(RowOutput), rows);
}

export async function rowDelete({ tableId, rowId }: RowParams) {
  const row: DeletedInput = await prisma.row.update({
    where: {
      id: rowId,
      deletedAt: null,
      table: {
        id: tableId,
        deletedAt: null,
        organization: { deletedAt: null },
      },
    },
    data: { deletedAt: new Date() },
    select: { id: true, deletedAt: true },
  });
  return v.parse(DeletedOutput, row);
}

export async function rowUpdate(
  { tableId, rowId }: RowParams,
  input: RowUpdateInput,
) {
  const row = await prisma.row.update({
    where: {
      id: rowId,
      deletedAt: null,
      table: {
        id: tableId,
        deletedAt: null,
        organization: { deletedAt: null },
      },
    },
    data: input.data,
    select: {
      id: true,
      number: true,
      data: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return v.parse(RowOutput, row);
}

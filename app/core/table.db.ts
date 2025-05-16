import * as v from 'valibot';

import { prisma } from '~/services/db';
import type { OrganizationParams } from './organization.types';
import type {
  TableCreateInput,
  TableGetInput,
  TableInput,
  TableParams,
  TableUpdateInput,
} from './table.types';
import { TableGetOutput, TableOutput } from './table.types';
import { DeletedOutput, type DeletedInput } from './types';

export async function tableList({ organizationId }: OrganizationParams) {
  return prisma.table.findMany({
    where: {
      organization: { id: organizationId, deletedAt: null },
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
}

export async function tableGet({ tableId }: TableParams) {
  const table: TableGetInput = await prisma.table.findUniqueOrThrow({
    where: { id: tableId, organization: { deletedAt: null }, deletedAt: null },
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
  return v.parse(TableGetOutput, table);
}

export async function tableCreate(
  { organizationId }: OrganizationParams,
  { columns, rows, ...data }: TableCreateInput,
) {
  return prisma.$transaction(async (tx) => {
    const sequence = await tx.organizationTableSequence.upsert({
      where: { organizationId },
      update: { lastTableNumber: { increment: 1 } },
      create: { organizationId },
      select: { lastTableNumber: true },
    });
    const table: TableInput = await tx.table.create({
      data: {
        organization: { connect: { id: organizationId, deletedAt: null } },
        number: sequence.lastTableNumber,
        ...data,
        columns: {
          createMany: {
            data: (columns ?? []).map((column, position) => ({
              id: crypto.randomUUID(),
              position: position + 1,
              ...column,
            })),
          },
        },
        rows: {
          createMany: {
            data: (rows ?? []).map((_, position) => ({
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
    if (rows && rows.length > 0) {
      await tx.tableRowSequence.create({
        data: { tableId: table.id, lastRowNumber: rows.length },
      });
    }
    return v.parse(TableOutput, table);
  });
}

export async function tableUpdate(
  { tableId }: TableParams,
  input: TableUpdateInput,
): Promise<void> {
  await prisma.table.update({
    where: { id: tableId, organization: { deletedAt: null }, deletedAt: null },
    data: { ...input },
    select: {
      id: true,
      number: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function tableDelete({ tableId }: TableParams) {
  const table: DeletedInput = await prisma.table.update({
    where: { id: tableId, organization: { deletedAt: null }, deletedAt: null },
    data: { deletedAt: new Date() },
    select: { id: true, deletedAt: true },
  });
  return v.parse(DeletedOutput, table);
}

export async function tableClone({ tableId }: TableParams) {
  const input = await prisma.table.findUniqueOrThrow({
    where: { id: tableId, organization: { deletedAt: null }, deletedAt: null },
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
        id: tableId,
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
      where: { organizationId: input.organizationId },
      update: { lastTableNumber: { increment: 1 } },
      create: { organizationId: input.organizationId },
      select: { lastTableNumber: true },
    });
    const table: TableInput = await tx.table.create({
      data: {
        ...input,
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
    return v.parse(TableOutput, table);
  });
}

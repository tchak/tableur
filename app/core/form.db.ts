import * as v from 'valibot';
import { prisma } from '~/services/db';

import type {
  FormCreateInput,
  FormGetInput,
  FormInput,
  FormParams,
  FormUpdateInput,
} from './form.types';
import { FormGetOutput, FormOutput } from './form.types';
import type { TableParams } from './table.types';
import { DeletedOutput, type DeletedInput } from './types';

export async function formCreate(
  { tableId }: TableParams,
  { title, path, ...input }: FormCreateInput,
) {
  const columns = await prisma.column.findMany({
    where: {
      table: {
        id: tableId,
        deletedAt: null,
        organization: { deletedAt: null },
      },
      deletedAt: null,
    },
    select: { id: true, position: true, name: true },
  });
  const { organizationId } = await prisma.table.findUniqueOrThrow({
    where: { id: tableId, deletedAt: null, organization: { deletedAt: null } },
    select: { organizationId: true },
  });

  const form: FormInput = await prisma.form.create({
    data: {
      tableId,
      ...input,
      paths: {
        connectOrCreate: {
          where: { path, organizationId, formId: null },
          create: { path, organizationId },
        },
      },
      pages: {
        create: {
          id: crypto.randomUUID(),
          position: 1,
          sections: {
            create: {
              id: crypto.randomUUID(),
              title,
              position: 1,
              fields: {
                createMany: {
                  data: columns.map((column) => ({
                    id: column.id,
                    tableId,
                    label: column.name,
                    position: column.position,
                    required: true,
                  })),
                },
              },
            },
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      paths: { orderBy: { createdAt: 'asc' }, select: { path: true } },
      createdAt: true,
      updatedAt: true,
    },
  });
  return v.parse(FormOutput, form);
}

export async function formList({ tableId }: TableParams) {
  const forms = await prisma.form.findMany({
    where: {
      table: {
        id: tableId,
        deletedAt: null,
        organization: { deletedAt: null },
      },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      description: true,
      paths: { orderBy: { createdAt: 'asc' }, select: { path: true } },
      createdAt: true,
      updatedAt: true,
    },
  });
  return v.parse(v.array(FormOutput), forms);
}

export async function formGet({ formId }: FormParams) {
  const form: FormGetInput = await prisma.form.findUniqueOrThrow({
    where: { id: formId, deletedAt: null },
    select: {
      id: true,
      name: true,
      description: true,
      paths: { orderBy: { createdAt: 'asc' }, select: { path: true } },
      createdAt: true,
      updatedAt: true,
      pages: {
        where: { deletedAt: null },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          condition: true,
          sections: {
            where: { deletedAt: null },
            orderBy: { position: 'asc' },
            select: {
              id: true,
              title: true,
              condition: true,
              parentId: true,
              fields: {
                where: { deletedAt: null },
                orderBy: { position: 'asc' },
                select: {
                  id: true,
                  column: { select: { type: true } },
                  label: true,
                  description: true,
                  required: true,
                  condition: true,
                },
              },
            },
          },
        },
      },
    },
  });
  return v.parse(FormGetOutput, form);
}

export async function formUpdate(
  { formId }: FormParams,
  input: FormUpdateInput,
) {
  const form: FormInput = await prisma.form.update({
    where: { id: formId, deletedAt: null },
    data: { ...input },
    select: {
      id: true,
      name: true,
      description: true,
      paths: { orderBy: { createdAt: 'asc' }, select: { path: true } },
      createdAt: true,
      updatedAt: true,
    },
  });
  return v.parse(FormOutput, form);
}

export async function formDelete({ formId }: FormParams) {
  const form: DeletedInput = await prisma.form.update({
    where: { id: formId, deletedAt: null },
    data: { deletedAt: new Date() },
    select: { id: true, deletedAt: true },
  });
  return v.parse(DeletedOutput, form);
}

import { withForm, withTable } from '~/services/auth';
import { prisma } from '~/services/db';
import { authenticated } from '~/services/rpc';

import { FormCreateInput, FormParams, FormUpdateInput } from './form.types';
import { TableParams } from './table.types';

const formCreate = authenticated
  .input(FormCreateInput)
  .use(withTable)
  .handler(async ({ context, input }) => {
    context.check('table', 'createForm', context.table);
    const columns = await prisma.column.findMany({
      where: {
        table: {
          id: input.tableId,
          deletedAt: null,
          organization: { deletedAt: null },
        },
        deletedAt: null,
      },
      select: { id: true, position: true, name: true },
    });
    const form = await prisma.form.create({
      data: {
        tableId: input.tableId,
        name: input.name,
        //description: input.description,
        paths: {
          connectOrCreate: {
            where: {
              path: input.path,
              organizationId: context.table.organizationId,
              formId: null,
            },
            create: {
              path: input.path,
              organizationId: context.table.organizationId,
            },
          },
        },
        pages: {
          create: {
            id: crypto.randomUUID(),
            position: 1,
            sections: {
              create: {
                id: crypto.randomUUID(),
                title: input.title,
                position: 1,
                fields: {
                  createMany: {
                    data: columns.map((column) => ({
                      id: column.id,
                      tableId: input.tableId,
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

    const paths = form.paths.map(({ path }) => path);
    return { ...form, paths };
  });

const formList = authenticated
  .input(TableParams)
  .use(withTable)
  .handler(async ({ context, input }) => {
    context.check('table', 'read', context.table);
    const forms = await prisma.form.findMany({
      where: { table: { id: input.tableId }, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        paths: { orderBy: { createdAt: 'asc' }, select: { path: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
    return forms.map((form) => {
      const paths = form.paths.map(({ path }) => path);
      return { ...form, paths };
    });
  });

const formGet = authenticated
  .input(FormParams)
  .use(withForm)
  .handler(async ({ context, input }) => {
    context.check('form', 'read', context.form);
    const form = await prisma.form.findUniqueOrThrow({
      where: { id: input.formId, deletedAt: null },
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

    const paths = form.paths.map(({ path }) => path);
    return { ...form, paths };
  });

const formUpdate = authenticated
  .input(FormUpdateInput)
  .use(withForm)
  .handler(async ({ context, input }) => {
    context.check('form', 'write', context.form);
    await prisma.form.update({
      where: { id: input.formId, deletedAt: null },
      data: { name: input.name },
      select: { id: true },
    });
  });

const formDelete = authenticated
  .input(FormParams)
  .use(withForm)
  .handler(async ({ context, input }) => {
    context.check('form', 'write', context.form);
    await prisma.form.update({
      where: { id: input.formId, deletedAt: null },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  });

export const router = {
  get: formGet,
  list: formList,
  create: formCreate,
  update: formUpdate,
  delete: formDelete,
};

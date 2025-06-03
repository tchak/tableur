import { implement } from '@orpc/server';
import * as R from 'remeda';

import { withForm, withTable } from '~/lib/auth';
import { prisma } from '~/lib/db';
import { authenticatedMiddleware } from '~/lib/rpc';
import { contract } from './form.contract';

const os = implement(contract).use(authenticatedMiddleware);

const create = os.create.use(withTable).handler(async ({ context, input }) => {
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

const list = os.list.use(withTable).handler(async ({ context, input }) => {
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

const find = os.find.use(withForm).handler(async ({ context, input }) => {
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

const update = os.update.use(withForm).handler(async ({ context, input }) => {
  context.check('form', 'write', context.form);
  await prisma.form.update({
    where: { id: input.formId, deletedAt: null },
    data: R.omitBy(
      { name: input.name, description: input.description },
      R.isNot(R.isDefined),
    ),
    select: { id: true },
  });
});

const destroy = os.destroy.use(withForm).handler(async ({ context, input }) => {
  context.check('form', 'write', context.form);
  await prisma.form.update({
    where: { id: input.formId, deletedAt: null },
    data: { deletedAt: new Date() },
    select: { id: true },
  });
});

export const router = {
  find,
  list,
  create,
  update,
  destroy,
};

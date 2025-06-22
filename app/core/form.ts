import { implement } from '@orpc/server';
import * as R from 'remeda';

import { withForm, withTable } from '~/lib/auth';
import { prisma } from '~/lib/db';
import { authenticatedMiddleware } from '~/lib/rpc';
import { contract, type Field, type Page, type Section } from './form.contract';

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
      createdAt: true,
      updatedAt: true,
      paths: { orderBy: { createdAt: 'asc' }, select: { path: true } },
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
                where: { deletedAt: null, fieldSetId: null },
                orderBy: { position: 'asc' },
                select: {
                  id: true,
                  column: {
                    select: {
                      type: true,
                      deletedAt: true,
                      options: {
                        where: { deletedAt: null },
                        orderBy: { position: 'asc' },
                        select: { id: true, name: true },
                      },
                    },
                  },
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

  const pages = form.pages.map(transformPage);
  const paths = form.paths.map(({ path }) => path);

  return { ...form, pages, paths };
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

interface DBField extends Omit<Field, 'type'> {
  column: {
    type: Field['type'];
    deletedAt: Date | null;
    options: { id: string; name: string }[];
  };
}
interface DBSection extends Omit<Section, 'fields' | 'sections'> {
  parentId: string | null;
  fields: DBField[];
}
interface DBPage extends Omit<Page, 'sections'> {
  sections: DBSection[];
}
export function transformPage(page: DBPage): Page {
  const meta: Record<string, { parentId?: string | null }> = {};
  const sectionsByParentId: Record<string, Section[]> = R.pipe(
    page.sections,
    R.map(({ parentId, fields, ...section }) => {
      meta[section.id] = { parentId };
      return { ...section, fields: fields.map(transformField), sections: [] };
    }),
    R.groupBy((section) => meta[section.id]?.parentId ?? ''),
  );
  return { ...page, sections: treeifySections('', sectionsByParentId) };
}

function transformField({ column, ...field }: DBField): Field {
  if (column.type == 'choice' || column.type == 'choiceList') {
    return {
      ...field,
      type: column.type,
      options: column.options,
    };
  }
  return {
    ...field,
    type: column.type,
  };
}

function treeifySections(
  parentId: string,
  byParentId: Record<string, Section[]>,
): Section[] {
  const sections = byParentId[parentId] ?? [];
  return sections.map((section) => ({
    ...section,
    sections: treeifySections(section.id, byParentId),
  }));
}

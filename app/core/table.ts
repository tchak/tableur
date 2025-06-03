import { call, implement } from '@orpc/server';
import { writeToString } from 'fast-csv';
import * as R from 'remeda';

import { withTable } from '~/lib/auth';
import { prisma } from '~/lib/db';
import { authenticatedMiddleware } from '~/lib/rpc';
import { deleteFile, readFile, writeFile } from '~/lib/storage';
import { columnValue } from './export';
import { parseImportData, parseImportPreview } from './import';
import { contract, ImportColumn } from './table.contract';

const os = implement(contract).use(authenticatedMiddleware);

const list = os.list.handler(({ context, input }) => {
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

const find = os.find.use(withTable).handler(({ context, input }) => {
  context.check('table', 'read', context.table);

  return prisma.table.findUniqueOrThrow({
    where: {
      id: input.tableId,
      deletedAt: null,
      organization: { deletedAt: null },
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
          options: {
            where: { deletedAt: null },
            orderBy: { position: 'asc' },
            select: { id: true, name: true },
          },
        },
      },
    },
  });
});

const create = os.create.handler(({ context, input }) => {
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

const update = os.update.use(withTable).handler(async ({ context, input }) => {
  context.check('table', 'write', context.table);

  await prisma.table.update({
    where: {
      id: input.tableId,
      deletedAt: null,
      organization: { deletedAt: null },
    },
    data: R.omitBy(
      { name: input.name, description: input.description },
      R.isNot(R.isDefined),
    ),
    select: { id: true },
  });
});

const destroy = os.destroy
  .use(withTable)
  .handler(async ({ context, input }) => {
    context.check('table', 'write', context.table);

    await prisma.table.update({
      where: {
        id: input.tableId,
        deletedAt: null,
        organization: { deletedAt: null },
      },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  });

const csv = os.csv.use(withTable).handler(async ({ context, input }) => {
  context.check('table', 'read', context.table);

  const { columns, rows } = await prisma.table.findUniqueOrThrow({
    where: {
      id: input.tableId,
      deletedAt: null,
      organization: { deletedAt: null },
    },
    select: {
      columns: {
        where: { deletedAt: null },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          name: true,
          type: true,
          options: {
            where: { deletedAt: null },
            orderBy: { position: 'asc' },
            select: { id: true, name: true },
          },
        },
      },
      rows: {
        where: {
          deletedAt: null,
          OR: [
            { submission: null },
            { submission: { submittedAt: { not: null } } },
          ],
        },
        orderBy: { number: 'asc' },
        select: {
          id: true,
          number: true,
          data: true,
          createdAt: true,
          updatedAt: true,
          submission: {
            select: {
              submittedAt: true,
              users: { select: { user: { select: { email: true } } } },
            },
          },
        },
      },
    },
  });
  return writeToString(
    rows.map((row) => [
      row.id,
      row.number,
      row.createdAt,
      row.submission?.submittedAt,
      row.submission?.users.map(({ user }) => user.email).join(', '),
      ...columns.map((column) => columnValue(row.data, column).str()),
    ]),
    {
      headers: [
        'ID',
        'Number',
        'Creation Date',
        'Submission Date',
        'Email',
        ...columns.map((column) => column.name),
      ],
      alwaysWriteHeaders: true,
    },
  );
});

const clone = os.clone.use(withTable).handler(async ({ context, input }) => {
  context.check('table', 'write', context.table);

  const originalTable = await prisma.table.findUniqueOrThrow({
    where: {
      id: input.tableId,
      deletedAt: null,
      organization: { deletedAt: null },
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
    select: {
      id: true,
      name: true,
      position: true,
      type: true,
      options: { select: { id: true, name: true, position: true } },
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
        options: {
          createMany: {
            data: columns.flatMap(({ options, id }) =>
              options.map((option) => ({ columnId: id, ...option })),
            ),
          },
        },
        columns: {
          createMany: {
            data: columns.map((column) => ({
              id: column.id,
              name: column.name,
              type: column.type,
              position: column.position,
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

const importPreview = os.importPreview.handler(async ({ context, input }) => {
  context.check('import', 'create');

  const [stream1, stream2] = input.file.stream().tee();
  const preview = await parseImportPreview(stream1);
  const { id } = await prisma.importPreview.create({
    data: preview,
    select: { id: true },
  });
  await writeFile(`import/${id}.csv`, stream2);
  return { id, ...preview };
});

const importTable = os.importTable.handler(async ({ context, input }) => {
  context.check('organization', 'write', input);
  const preview = await prisma.importPreview.findUniqueOrThrow({
    where: { id: input.importId },
    select: { columns: true },
  });
  const columns: ImportColumn[] = [];
  const mapping: Record<string, string> = {};
  for (const { name } of preview.columns) {
    const column = input.mapping[name];
    if (column) {
      mapping[name] = crypto.randomUUID();
      columns.push(column);
    }
  }
  const table = await call(
    create,
    {
      organizationId: input.organizationId,
      name: input.name,
    },
    { context },
  );
  await prisma.column.createMany({
    data: columns.map((column, position) => ({
      ...column,
      id: mapping[column.name] as string,
      tableId: table.id,
      position: position + 1,
    })),
  });
  await call(
    importData,
    {
      tableId: table.id,
      importId: input.importId,
      mapping,
    },
    { context },
  );
  return table;
});

const importData = os.importData
  .use(withTable)
  .handler(async ({ context, input }) => {
    context.check('table', 'write', context.table);
    const { delimiter } = await prisma.importPreview.findUniqueOrThrow({
      where: { id: input.importId },
      select: { delimiter: true },
    });
    const tableColumns = await prisma.column.findMany({
      where: {
        table: {
          id: input.tableId,
          deletedAt: null,
          organization: { deletedAt: null },
        },
      },
      orderBy: { position: 'asc' },
      select: { id: true, type: true },
    });
    const headers = Object.fromEntries(
      Object.entries(input.mapping).map(
        ([header, columnId]) => [columnId, header] as const,
      ),
    );
    const columns: (ImportColumn & { id: string })[] = [];
    for (const { id, type } of tableColumns) {
      const header = headers[id];
      if (
        header &&
        type != 'file' &&
        type != 'choice' &&
        type != 'choiceList'
      ) {
        columns.push({ id, type, name: header });
      }
    }
    const path = `import/${input.importId}.csv`;
    const stream = await readFile(path);
    const data = await parseImportData(stream, delimiter, columns);

    if (data.length > 0) {
      await prisma.$transaction(async (tx) => {
        const { lastRowNumber } = await tx.table.update({
          where: { id: input.tableId },
          data: { lastRowNumber: { increment: data.length } },
          select: { lastRowNumber: true },
        });
        const firstRowNumber = lastRowNumber - data.length + 1;
        await tx.row.createMany({
          data: data.map((data, position) => ({
            data,
            tableId: input.tableId,
            number: firstRowNumber + position,
          })),
        });
      });
    }
    await deleteFile(path);
    await prisma.importPreview.delete({ where: { id: input.importId } });
    return { rows: data.length };
  });

export const router = {
  find,
  list,
  csv,
  create,
  update,
  destroy,
  clone,
  importPreview,
  importTable,
  importData,
};

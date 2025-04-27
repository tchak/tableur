import { parseStream } from 'fast-csv';
import { Readable } from 'node:stream';

import { prisma } from '../services/db';
import { storage } from '../services/storage';

import type { ColumnImport, ImportPreviewInput, ImportPreviewJSON } from './import.types';
import { detectType, parseStringValue } from './import.types';
import type { OrganizationParams } from './organization.types';
import { tableCreate } from './table.db';
import type { TableImportDataInput, TableImportInput, TableParams } from './table.types';
import type { Data } from './types';

export async function importPreview(input: ImportPreviewInput) {
  const stream = Readable.fromWeb(input.file.stream());
  const preview = await parseImportPreview(stream);
  const { id } = await prisma.importPreview.create({ data: preview, select: { id: true } });
  await storage.write(`import/${id}.csv`, stream);
  return { id, ...preview };
}

export async function tableImport({ organizationId }: OrganizationParams, input: TableImportInput) {
  const preview = await prisma.importPreview.findUniqueOrThrow({
    where: { id: input.importId },
    select: { columns: true },
  });
  const columns: ColumnImport[] = [];
  const mapping: Record<string, string> = {};
  for (const { name } of preview.columns) {
    const column = input.mapping[name];
    if (column) {
      mapping[name] = crypto.randomUUID();
      columns.push(column);
    }
  }
  const table = await tableCreate({ organizationId }, { name: input.name });
  await prisma.column.createMany({
    data: columns.map((column, position) => ({
      ...column,
      id: mapping[column.name] as string,
      tableId: table.id,
      position: position + 1,
    })),
  });
  await tableImportData({ tableId: table.id }, { importId: input.importId, mapping });
  return table;
}

export async function tableImportData({ tableId }: TableParams, input: TableImportDataInput) {
  await prisma.importPreview.findUniqueOrThrow({ where: { id: input.importId } });
  const tableColumns = await prisma.column.findMany({
    where: { table: { id: tableId, deletedAt: null, organization: { deletedAt: null } } },
    orderBy: { position: 'asc' },
    select: { id: true, type: true },
  });
  const path = `import/${input.importId}.csv`;
  const stream = await storage.read(path);
  const headers = Object.fromEntries(
    Object.entries(input.mapping).map(([header, columnId]) => [columnId, header] as const),
  );
  const columns: (ColumnImport & { id: string })[] = [];
  for (const { id, type } of tableColumns) {
    const header = headers[id];
    if (header && type != 'file' && type != 'choice' && type != 'choiceList') {
      columns.push({ id, type, name: header });
    }
  }
  const data = await parseImportData(stream, columns);

  if (data.length > 0) {
    await prisma.$transaction(async (tx) => {
      const sequence = await tx.tableRowSequence.upsert({
        where: { tableId },
        update: { lastRowNumber: { increment: data.length } },
        create: { tableId },
        select: { lastRowNumber: true },
      });
      const lastRowNumber = sequence.lastRowNumber - data.length + 1;
      await tx.row.createMany({
        data: data.map((data, position) => ({ data, tableId, number: lastRowNumber + position })),
      });
    });
  }
  await storage.deleteFile(path);
  await prisma.importPreview.delete({ where: { id: input.importId } });
  return { rows: data.length };
}

async function parseImportPreview(stream: Readable) {
  return new Promise<Omit<ImportPreviewJSON, 'id'>>((resolve, reject) => {
    let columns: ImportPreviewJSON['columns'] = [];
    const rows: ImportPreviewJSON['rows'] = [];
    parseStream(stream, {
      maxRows: 10,
      trim: true,
      discardUnmappedColumns: true,
      ignoreEmpty: true,
    })
      .on('headers', (headers: string[]) => {
        columns = headers.map((header) => ({
          name: header,
          type: 'text',
        }));
        return headers;
      })
      .on('data', (row: Record<string, string>) =>
        rows.push(columns.map((column) => row[column.name] ?? null)),
      )
      .on('end', () => {
        const columnValues = columns.map(
          (column, index) => [column, rows.map((row) => row.at(index))] as const,
        );
        for (const [column, values] of columnValues) {
          const value = values.at(0);
          if (value != null) {
            column.type = detectType(value);
          }
        }
        return resolve({ columns, rows });
      })
      .on('error', reject);
  });
}

function parseImportData(stream: Readable, columns: (ColumnImport & { id: string })[]) {
  return new Promise<Data[]>((resolve, reject) => {
    const rows: Data[] = [];
    parseStream(stream, {
      trim: true,
      discardUnmappedColumns: true,
      ignoreEmpty: true,
      headers: columns.map((column) => column.name),
    })
      .on('data', (row: Record<string, string>) => {
        const data: Data = {};
        for (const column of columns) {
          const value = parseStringValue(row[column.name], column.type);
          if (value) {
            data[column.id] = value;
          }
        }
        rows.push(data);
      })
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

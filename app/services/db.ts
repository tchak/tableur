import * as v from 'valibot';
import { PrismaClient } from '../generated/prisma';

const ColumnType = v.picklist([
  'text',
  'number',
  'boolean',
  'date',
  'datetime',
  'file',
  'choice',
  'choiceList',
]);

const ImportPreviewColumnType = v.picklist(['text', 'number', 'boolean', 'date', 'datetime']);
const ImportPreviewColumns = v.array(v.object({ type: ImportPreviewColumnType, name: v.string() }));
const ImportPreviewRows = v.array(v.array(v.nullable(v.string())));

const timestamps = {
  createdAt: {
    needs: { createdAt: true },
    compute: (result: { createdAt: Date }) => result.createdAt.toISOString(),
  },
  updatedAt: {
    needs: { updatedAt: true },
    compute: (result: { updatedAt: Date }) => result.updatedAt.toISOString(),
  },
};

const prisma = new PrismaClient().$extends({
  result: {
    user: timestamps,
    organization: timestamps,
    table: timestamps,
    row: timestamps,
    form: timestamps,
    submission: timestamps,
    column: {
      ...timestamps,
      type: {
        needs: { type: true },
        compute: (column) => v.parse(ColumnType, column.type),
      },
    },
    importPreview: {
      columns: {
        needs: { columns: true },
        compute: (result) => v.parse(ImportPreviewColumns, result.columns),
      },
      rows: {
        needs: { rows: true },
        compute: (result) => v.parse(ImportPreviewRows, result.rows),
      },
    },
  },
});

export { prisma };

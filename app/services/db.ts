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

const SubmissionState = v.picklist(['draft', 'submitted']);

const ImportPreviewColumnType = v.picklist([
  'text',
  'number',
  'boolean',
  'date',
  'datetime',
]);
const ImportPreviewColumns = v.array(
  v.object({ type: ImportPreviewColumnType, name: v.string() }),
);
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
    comment: timestamps,
    submission: {
      ...timestamps,
      state: {
        needs: { state: true },
        compute: (result) => v.parse(SubmissionState, result.state),
      },
      submittedAt: {
        needs: { submittedAt: true },
        compute: (result) => result.submittedAt?.toISOString() ?? null,
      },
    },
    column: {
      ...timestamps,
      type: {
        needs: { type: true },
        compute: (result) => v.parse(ColumnType, result.type),
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

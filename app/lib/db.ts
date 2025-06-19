import * as v from 'valibot';

import { Expression } from '~/core/expression';
import { ColumnType, Data } from '~/core/shared.contract';
import { ImportPreview } from '~/core/table.contract';
import { PrismaClient } from '~/generated/prisma/client';

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
    row: {
      ...timestamps,
      data: {
        needs: { data: true },
        compute: (result) => v.parse(Data, result.data),
      },
    },
    form: timestamps,
    formPage: {
      ...timestamps,
      condition: {
        needs: { condition: true },
        compute: (result) => v.parse(v.nullable(Expression), result.condition),
      },
    },
    formSection: {
      ...timestamps,
      condition: {
        needs: { condition: true },
        compute: (result) => v.parse(v.nullable(Expression), result.condition),
      },
    },
    formFieldSet: {
      ...timestamps,
      condition: {
        needs: { condition: true },
        compute: (result) => v.parse(v.nullable(Expression), result.condition),
      },
    },
    formField: {
      ...timestamps,
      condition: {
        needs: { condition: true },
        compute: (result) => v.parse(v.nullable(Expression), result.condition),
      },
    },
    comment: timestamps,
    submission: {
      ...timestamps,
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
        compute: (result) =>
          v.parse(ImportPreview.entries.columns, result.columns),
      },
      rows: {
        needs: { rows: true },
        compute: (result) => v.parse(ImportPreview.entries.rows, result.rows),
      },
    },
  },
});

export { prisma };

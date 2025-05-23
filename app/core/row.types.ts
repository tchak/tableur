import * as v from 'valibot';

import { SubmissionJSON } from './submission.types';
import { TableGetJSON } from './table.types';
import { Data, ID, ISOTimestamp, NewData, UpdateData } from './types';

export const RowCreateInput = v.object({
  tableId: ID,
  data: v.optional(NewData),
});

export const RowUpdateInput = v.object({
  rowId: ID,
  data: UpdateData,
});

export const RowParams = v.object({ rowId: ID });

export const RowJSON = v.object({
  id: ID,
  number: v.number(),
  data: Data,
  createdAt: ISOTimestamp,
  updatedAt: ISOTimestamp,
});

export const RowGetJSON = v.object({
  data: v.object({
    ...RowJSON.entries,
    table: TableGetJSON.entries.data,
    submission: v.nullable(SubmissionJSON),
  }),
});
export const RowListJSON = v.object({
  data: v.array(RowJSON),
  meta: v.object({ total: v.pipe(v.number(), v.integer()) }),
});
export const RowCreateJSON = v.object({ data: RowJSON });

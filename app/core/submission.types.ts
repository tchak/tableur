import * as v from 'valibot';

import { ID, ISOTimestamp } from './types';

export const SubmissionParams = v.object({
  submissionId: ID,
});

export const StartParams = v.object({
  path: v.string(),
});
export type StartParams = v.InferOutput<typeof StartParams>;

export const SubmissionJSON = v.variant('state', [
  v.object({
    id: ID,
    number: v.number(),
    createdAt: ISOTimestamp,
    updatedAt: ISOTimestamp,
    state: v.literal('draft'),
    submittedAt: v.null(),
  }),
  v.object({
    id: ID,
    number: v.number(),
    createdAt: ISOTimestamp,
    updatedAt: ISOTimestamp,
    state: v.literal('submitted'),
    submittedAt: ISOTimestamp,
  }),
]);
export type SubmissionJSON = v.InferOutput<typeof SubmissionJSON>;

export const SubmissionListJSON = v.object({
  data: v.array(SubmissionJSON),
  meta: v.object({ total: v.pipe(v.number(), v.integer()) }),
});
export const SubmissionGetJSON = v.object({ data: SubmissionJSON });

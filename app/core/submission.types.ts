import * as v from 'valibot';

import { SubmissionState } from '~/generated/prisma';
import { ID, ISOTimestamp, Timestamp } from './types';

const SubmissionFragment = v.object({
  id: ID,
  number: v.number(),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});

export const SubmissionOutput = v.variant('state', [
  v.object({
    ...SubmissionFragment.entries,
    state: v.pipe(v.enum(SubmissionState), v.literal('draft')),
    submittedAt: v.null(),
  }),
  v.object({
    ...SubmissionFragment.entries,
    state: v.pipe(v.enum(SubmissionState), v.literal('submitted')),
    submittedAt: Timestamp,
  }),
]);
export type SubmissionInput = v.InferInput<typeof SubmissionOutput>;

export const SubmissionParams = v.object({
  submissionId: ID,
});
export type SubmissionParams = v.InferOutput<typeof SubmissionParams>;

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

import * as v from 'valibot';

import { SubmissionState } from '../generated/prisma';
import { ID, Timestamp } from './types';

const SubmissionFragment = v.object({
  id: ID,
  createdAt: Timestamp,
  updatedAt: Timestamp,
});

export const SubmissionOutput = v.variant('state', [
  v.object({
    ...SubmissionFragment.entries,
    state: v.pipe(v.enum(SubmissionState), v.literal('draft')),
  }),
  v.object({
    ...SubmissionFragment.entries,
    state: v.pipe(v.enum(SubmissionState), v.literal('submitted')),
    submittedAt: Timestamp,
  }),
]);

export const SubmissionParams = v.object({
  submissionId: ID,
});
export type SubmissionParams = v.InferOutput<typeof SubmissionParams>;

export const StartParams = v.object({
  path: v.string(),
});
export type StartParams = v.InferOutput<typeof StartParams>;

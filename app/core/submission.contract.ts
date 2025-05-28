import { oc } from '@orpc/contract';
import * as v from 'valibot';

import { ID, ISOTimestamp } from './shared.contract';

export const SubmissionParams = v.object({ submissionId: ID });
export const StartParams = v.object({ path: v.string() });

export const Submission = v.variant('state', [
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

const start = oc.input(StartParams).output(Submission);
const submit = oc.input(SubmissionParams).output(Submission);
const destroy = oc.input(SubmissionParams).output(v.void());
const find = oc
  .route({ method: 'GET' })
  .input(SubmissionParams)
  .output(Submission);
const list = oc.route({ method: 'GET' }).output(v.array(Submission));

function defined<T>(x: T | undefined): T {
  if (x === undefined) throw new Error('Value is undefined');
  return x;
}

export const openapi = {
  list: v.object({
    data: defined(list['~orpc'].outputSchema),
    meta: v.object({ total: v.pipe(v.number(), v.integer()) }),
  }),
  find: v.object({
    data: defined(find['~orpc'].outputSchema),
  }),
  start: v.object({
    data: defined(start['~orpc'].outputSchema),
  }),
  submit: v.object({
    data: defined(submit['~orpc'].outputSchema),
  }),
};

export const contract = {
  start,
  submit,
  destroy,
  find,
  list,
};

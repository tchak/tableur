import { oc } from '@orpc/contract';
import * as v from 'valibot';

import {
  BooleanField,
  ChoiceField,
  ChoiceListField,
  DateField,
  DateTimeField,
  FileField,
  NumberField,
  TextField,
} from './form.contract';
import {
  BooleanTypedValue,
  ChoiceListTypedValue,
  ChoiceTypedValue,
  DateTimeTypedValue,
  DateTypedValue,
  FileTypedValue,
  ID,
  ISOTimestamp,
  NumberTypedValue,
  TextTypedValue,
} from './shared.contract';

export const SubmissionParams = v.object({ submissionId: ID });
export const StartParams = v.object({ path: v.string() });

const SubmissionFragment = v.object({
  id: ID,
  number: v.number(),
  createdAt: ISOTimestamp,
  updatedAt: ISOTimestamp,
});

export const Submission = v.variant('state', [
  v.object({
    ...SubmissionFragment.entries,
    state: v.literal('draft'),
    submittedAt: v.null(),
  }),
  v.object({
    ...SubmissionFragment.entries,
    state: v.literal('submitted'),
    submittedAt: ISOTimestamp,
  }),
]);

const Field = v.variant('type', [
  v.object({
    ...v.omit(TextField, ['condition']).entries,
    value: v.nullable(TextTypedValue.entries.value),
  }),
  v.object({
    ...v.omit(NumberField, ['condition']).entries,
    value: v.nullable(NumberTypedValue.entries.value),
  }),
  v.object({
    ...v.omit(BooleanField, ['condition']).entries,
    value: v.nullable(BooleanTypedValue.entries.value),
  }),
  v.object({
    ...v.omit(DateField, ['condition']).entries,
    value: v.nullable(DateTypedValue.entries.value),
  }),
  v.object({
    ...v.omit(DateTimeField, ['condition']).entries,
    value: v.nullable(DateTimeTypedValue.entries.value),
  }),
  v.object({
    ...v.omit(ChoiceField, ['condition']).entries,
    value: v.nullable(ChoiceTypedValue.entries.value),
  }),
  v.object({
    ...v.omit(ChoiceListField, ['condition']).entries,
    value: v.nullable(ChoiceListTypedValue.entries.value),
  }),
  v.object({
    ...v.omit(FileField, ['condition']).entries,
    value: v.nullable(FileTypedValue.entries.value),
  }),
]);
export type Field = v.InferOutput<typeof Field>;

const SectionFragment = v.object({
  id: ID,
  title: v.string(),
  fields: v.array(Field),
});
type SectionFragment = v.InferOutput<typeof SectionFragment>;

export type Section = SectionFragment & { sections: Section[] };
export const Section: v.GenericSchema<Section> = v.object({
  ...SectionFragment.entries,
  sections: v.lazy(() => v.array(Section)),
});

export const Page = v.object({
  id: ID,
  sections: v.array(Section),
});
export type Page = v.InferOutput<typeof Page>;

export const ExpandedSubmission = v.variant('state', [
  v.object({
    ...SubmissionFragment.entries,
    pages: v.array(Page),
    state: v.literal('draft'),
    submittedAt: v.null(),
  }),
  v.object({
    ...SubmissionFragment.entries,
    pages: v.array(Page),
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
  .output(ExpandedSubmission);
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

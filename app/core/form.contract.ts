import { oc } from '@orpc/contract';
import * as v from 'valibot';

import { Expression } from '~/core/expression';
import { ChoiceOption } from './column.contract';
import {
  BooleanType,
  ChoiceListType,
  ChoiceType,
  DateTimeType,
  DateType,
  Description,
  FileType,
  ID,
  ISOTimestamp,
  Name,
  NumberType,
  TextType,
} from './shared.contract';
import { TableParams } from './table.contract';

export const FormCreateInput = v.object({
  tableId: ID,
  path: v.pipe(
    v.string(),
    v.minLength(4),
    v.maxLength(255),
    v.regex(/^[a-z0-9_-]+$/),
  ),
  name: Name,
  title: Name,
  description: v.optional(Description),
});

export const FormUpdateInput = v.object({
  formId: ID,
  name: v.optional(Name),
  description: v.optional(Description),
});

export const FormParams = v.object({ formId: ID });

const FieldFragment = v.object({
  id: ID,
  label: v.string(),
  description: v.nullable(v.string()),
  condition: v.nullable(Expression),
});

export const TextField = v.object({
  type: TextType,
  required: v.boolean(),
  ...FieldFragment.entries,
});
export const NumberField = v.object({
  type: NumberType,
  required: v.boolean(),
  ...FieldFragment.entries,
});
export const BooleanField = v.object({
  type: BooleanType,
  required: v.boolean(),
  ...FieldFragment.entries,
});
export const DateField = v.object({
  type: DateType,
  required: v.boolean(),
  ...FieldFragment.entries,
});
export const DateTimeField = v.object({
  type: DateTimeType,
  required: v.boolean(),
  ...FieldFragment.entries,
});
export const FileField = v.object({
  type: FileType,
  required: v.boolean(),
  ...FieldFragment.entries,
});
export const ChoiceField = v.object({
  type: ChoiceType,
  options: v.array(ChoiceOption),
  required: v.boolean(),
  ...FieldFragment.entries,
});
export const ChoiceListField = v.object({
  type: ChoiceListType,
  options: v.array(ChoiceOption),
  required: v.boolean(),
  ...FieldFragment.entries,
});

const fields = [
  TextField,
  NumberField,
  BooleanField,
  DateField,
  DateTimeField,
  FileField,
  ChoiceField,
  ChoiceListField,
];

export const Field = v.variant('type', [
  ...fields,
  // v.object({
  //   type: FieldSetType,
  //   fields: v.array(v.variant('type', fields)),
  //   ...FieldFragment.entries,
  // }),
]);
export type Field = v.InferOutput<typeof Field>;

const SectionFragment = v.object({
  id: ID,
  title: v.string(),
  condition: v.nullable(Expression),
  fields: v.array(Field),
});
type SectionFragment = v.InferOutput<typeof SectionFragment>;
export type Section = SectionFragment & { sections: Section[] };

const Section: v.GenericSchema<Section> = v.object({
  ...SectionFragment.entries,
  sections: v.lazy(() => v.array(Section)),
});

export const Page = v.object({
  id: ID,
  condition: v.nullable(Expression),
  sections: v.array(Section),
});
export type Page = v.InferOutput<typeof Page>;

const Form = v.object({
  id: ID,
  name: v.string(),
  description: v.nullable(v.string()),
  paths: v.array(v.string()),
  createdAt: ISOTimestamp,
  updatedAt: ISOTimestamp,
});

const FindForm = v.object({
  ...Form.entries,
  pages: v.array(Page),
});

const create = oc.input(FormCreateInput).output(Form);
const update = oc.input(FormUpdateInput).output(v.void());
const destroy = oc.input(FormParams).output(v.void());
const find = oc.route({ method: 'GET' }).input(FormParams).output(FindForm);
const list = oc
  .input(TableParams)
  .route({ method: 'GET' })
  .output(v.array(Form));

function defined<T>(x: T | undefined): T {
  if (x === undefined) throw new Error('Value is undefined');
  return x;
}

export const openapi = {
  create: v.object({
    data: defined(create['~orpc'].outputSchema),
  }),
  list: v.object({
    data: defined(list['~orpc'].outputSchema),
    meta: v.object({ total: v.pipe(v.number(), v.integer()) }),
  }),
  find: v.object({
    data: defined(find['~orpc'].outputSchema),
  }),
};

export const contract = {
  create,
  update,
  destroy,
  find,
  list,
};

import { oc } from '@orpc/contract';
import * as v from 'valibot';

import { Expression } from '~/core/expression';
import { Description, ID, ISOTimestamp, Name } from './shared.contract';
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

const Field = v.object({
  id: ID,
  label: v.string(),
  description: v.nullable(v.string()),
  required: v.boolean(),
  condition: v.nullable(Expression),
});

const Section = v.object({
  id: ID,
  title: v.string(),
  condition: v.nullable(Expression),
  fields: v.array(Field),
});

const Page = v.object({
  id: ID,
  condition: v.nullable(Expression),
  sections: v.array(Section),
});

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

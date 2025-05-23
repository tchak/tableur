import * as v from 'valibot';

import { Expression } from './expression';
import { Description, ID, ISOTimestamp, Name } from './types';

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

export const FormParams = v.object({
  formId: ID,
});

const FormFragment = v.object({
  id: ID,
  name: v.string(),
  description: v.nullable(v.string()),
});

export const FormJSON = v.object({
  ...FormFragment.entries,
  paths: v.array(v.string()),
  createdAt: ISOTimestamp,
  updatedAt: ISOTimestamp,
});

export const FormListJSON = v.object({
  data: v.array(FormJSON),
  meta: v.object({ total: v.pipe(v.number(), v.integer()) }),
});

export const FieldJSON = v.object({
  id: ID,
  label: v.string(),
  description: v.nullable(v.string()),
  required: v.boolean(),
  condition: v.nullable(Expression),
});

export const SectionJSON = v.object({
  id: ID,
  title: v.string(),
  condition: v.nullable(Expression),
  fields: v.array(FieldJSON),
});

export const PageJSON = v.object({
  id: ID,
  condition: v.nullable(Expression),
  sections: v.array(SectionJSON),
});

export const FormGetJSON = v.object({
  data: v.object({ ...FormJSON.entries, pages: v.array(PageJSON) }),
});

export const FormCreateJSON = v.object({ data: FormJSON });

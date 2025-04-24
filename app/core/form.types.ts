import * as v from 'valibot';

import { Expression } from './expression';
import { Description, ID, Name, Timestamp } from './types';

export const FormCreateInput = v.object({
  path: v.pipe(v.string(), v.minLength(4), v.maxLength(255), v.regex(/^[a-z0-9_-]+$/)),
  name: Name,
  title: Name,
  description: v.optional(Description),
});
export type FormCreateInput = v.InferInput<typeof FormCreateInput>;

export const FormUpdateInput = v.partial(
  v.object({
    name: Name,
    description: Description,
  }),
);
export type FormUpdateInput = v.InferInput<typeof FormUpdateInput>;

export const FormParams = v.object({
  tableId: ID,
  formId: ID,
});
export type FormParams = v.InferOutput<typeof FormParams>;

export const FormOutput = v.object({
  id: ID,
  name: v.string(),
  description: v.nullable(v.string()),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type FormInput = v.InferInput<typeof FormOutput>;

export const FieldOutput = v.object({
  id: ID,
  label: v.string(),
  description: v.nullable(v.string()),
  required: v.boolean(),
  condition: v.nullable(v.pipe(v.unknown(), Expression)),
});

export const SectionOutput = v.object({
  id: ID,
  title: v.string(),
  condition: v.nullable(v.pipe(v.unknown(), Expression)),
  fields: v.array(FieldOutput),
});

export const PageOutput = v.object({
  id: ID,
  condition: v.nullable(v.pipe(v.unknown(), Expression)),
  sections: v.array(SectionOutput),
});

export const FormGetOutput = v.object({
  ...FormOutput.entries,
  pages: v.array(PageOutput),
});
export type FormGetInput = v.InferInput<typeof FormGetOutput>;

export const FormJSON = v.object({
  id: ID,
  name: v.string(),
  description: v.nullable(v.string()),
  createdAt: v.pipe(v.string(), v.isoDateTime()),
  updatedAt: v.pipe(v.string(), v.isoDateTime()),
});

export const FormListJSON = v.object({
  data: v.array(FormJSON),
  meta: v.object({ total: v.pipe(v.number(), v.integer()) }),
});

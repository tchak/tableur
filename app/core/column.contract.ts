import * as v from 'valibot';

import {
  BooleanType,
  ChoiceListType,
  ChoiceType,
  DateTimeType,
  DateType,
  FileType,
  ID,
  ISOTimestamp,
  Name,
  NumberType,
  TextType,
} from './shared.contract';

export const ImportColumn = v.object({
  type: v.picklist(['text', 'number', 'boolean', 'date', 'datetime']),
  name: Name,
});
export type ImportColumn = v.InferOutput<typeof ImportColumn>;

const ChoiceOptionInput = v.object({
  name: Name,
});

export const ColumnCreateInput = v.variant('type', [
  v.object({
    type: TextType,
    name: Name,
  }),
  v.object({
    type: NumberType,
    name: Name,
  }),
  v.object({
    type: BooleanType,
    name: Name,
  }),
  v.object({
    type: DateType,
    name: Name,
  }),
  v.object({
    type: DateTimeType,
    name: Name,
  }),
  v.object({
    type: FileType,
    name: Name,
  }),
  v.object({
    type: ChoiceType,
    name: Name,
    options: v.optional(v.array(ChoiceOptionInput)),
  }),
  v.object({
    type: ChoiceListType,
    name: Name,
    options: v.optional(v.array(ChoiceOptionInput)),
  }),
]);

const ChoiceOption = v.object({
  id: ID,
  name: v.string(),
});

const ColumnFragment = v.object({
  id: ID,
  name: v.string(),
  createdAt: ISOTimestamp,
  updatedAt: ISOTimestamp,
});

export const Column = v.variant('type', [
  v.object({
    type: TextType,
    ...ColumnFragment.entries,
  }),
  v.object({
    type: NumberType,
    ...ColumnFragment.entries,
  }),
  v.object({
    type: BooleanType,
    ...ColumnFragment.entries,
  }),
  v.object({
    type: DateType,
    ...ColumnFragment.entries,
  }),
  v.object({
    type: DateTimeType,
    ...ColumnFragment.entries,
  }),
  v.object({
    type: FileType,
    ...ColumnFragment.entries,
  }),
  v.object({
    type: ChoiceType,
    options: v.array(ChoiceOption),
    ...ColumnFragment.entries,
  }),
  v.object({
    type: ChoiceListType,
    options: v.array(ChoiceOption),
    ...ColumnFragment.entries,
  }),
]);

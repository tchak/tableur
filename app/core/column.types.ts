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
} from './types';

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

const ChoiceOptionJSON = v.object({
  id: ID,
  name: v.string(),
});

const ColumnJSONFragment = v.object({
  id: ID,
  name: v.string(),
  createdAt: ISOTimestamp,
  updatedAt: ISOTimestamp,
});

export const ColumnJSON = v.variant('type', [
  v.object({
    type: TextType,
    ...ColumnJSONFragment.entries,
  }),
  v.object({
    type: NumberType,
    ...ColumnJSONFragment.entries,
  }),
  v.object({
    type: BooleanType,
    ...ColumnJSONFragment.entries,
  }),
  v.object({
    type: DateType,
    ...ColumnJSONFragment.entries,
  }),
  v.object({
    type: DateTimeType,
    ...ColumnJSONFragment.entries,
  }),
  v.object({
    type: FileType,
    ...ColumnJSONFragment.entries,
  }),
  v.object({
    type: ChoiceType,
    options: v.array(ChoiceOptionJSON),
    ...ColumnJSONFragment.entries,
  }),
  v.object({
    type: ChoiceListType,
    options: v.array(ChoiceOptionJSON),
    ...ColumnJSONFragment.entries,
  }),
]);

import * as v from 'valibot';

import { ColumnType } from '../generated/prisma';
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
  Timestamp,
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

const ChoiceOptionOutput = v.object({
  id: ID,
  name: v.string(),
});

const ColumnFragment = v.object({
  id: ID,
  name: v.string(),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});

export const ColumnOutput = v.variant('type', [
  v.object({
    type: v.pipe(v.literal(ColumnType.text), TextType),
    ...ColumnFragment.entries,
  }),
  v.object({
    type: v.pipe(v.literal(ColumnType.number), NumberType),
    ...ColumnFragment.entries,
  }),
  v.object({
    type: v.pipe(v.literal(ColumnType.boolean), BooleanType),
    ...ColumnFragment.entries,
  }),
  v.object({
    type: v.pipe(v.literal(ColumnType.date), DateType),
    ...ColumnFragment.entries,
  }),
  v.object({
    type: v.pipe(v.literal(ColumnType.datetime), DateTimeType),
    ...ColumnFragment.entries,
  }),
  v.object({
    type: v.pipe(v.literal(ColumnType.file), FileType),
    ...ColumnFragment.entries,
  }),
  v.object({
    type: v.pipe(v.literal(ColumnType.choice), ChoiceType),
    options: v.array(ChoiceOptionOutput),
    ...ColumnFragment.entries,
  }),
  v.object({
    type: v.pipe(v.literal(ColumnType.choiceList), ChoiceListType),
    options: v.array(ChoiceOptionOutput),
    ...ColumnFragment.entries,
  }),
]);

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
    options: v.array(ChoiceOptionOutput),
    ...ColumnJSONFragment.entries,
  }),
  v.object({
    type: ChoiceListType,
    options: v.array(ChoiceOptionOutput),
    ...ColumnJSONFragment.entries,
  }),
]);

export type ColumnInput = v.InferInput<typeof ColumnOutput>;

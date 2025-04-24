import * as v from 'valibot';

import { ColumnType } from '../generated/prisma';
import { ID, ISOTimestamp, Name, Timestamp } from './types';

export const ColumnCreateInput = v.variant('type', [
  v.object({
    type: v.literal('text'),
    name: Name,
  }),
  v.object({
    type: v.literal('number'),
    name: Name,
  }),
  v.object({
    type: v.literal('boolean'),
    name: Name,
  }),
  v.object({
    type: v.literal('datetime'),
    name: Name,
  }),
]);

const ColumnFragment = v.object({
  id: ID,
  name: v.string(),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});

const ColumnJSONFragment = v.object({
  id: ID,
  name: v.string(),
  createdAt: ISOTimestamp,
  updatedAt: ISOTimestamp,
});

export const ColumnOutput = v.variant('type', [
  v.object({
    type: v.literal(ColumnType.text),
    ...ColumnFragment.entries,
  }),
  v.object({
    type: v.literal(ColumnType.number),
    ...ColumnFragment.entries,
  }),
  v.object({
    type: v.literal(ColumnType.boolean),
    ...ColumnFragment.entries,
  }),
  v.object({
    type: v.literal(ColumnType.datetime),
    ...ColumnFragment.entries,
  }),
]);

export const ColumnJSON = v.variant('type', [
  v.object({
    type: v.literal(ColumnType.text),
    ...ColumnJSONFragment.entries,
  }),
  v.object({
    type: v.literal(ColumnType.number),
    ...ColumnJSONFragment.entries,
  }),
  v.object({
    type: v.literal(ColumnType.boolean),
    ...ColumnJSONFragment.entries,
  }),
  v.object({
    type: v.literal(ColumnType.datetime),
    ...ColumnJSONFragment.entries,
  }),
]);

export type ColumnInput = v.InferInput<typeof ColumnOutput>;

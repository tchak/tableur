import * as v from 'valibot';

export const ID = v.pipe(v.string(), v.uuid());
export const ISOTimestamp = v.pipe(v.string(), v.isoTimestamp());
export const Timestamp = v.union([
  ISOTimestamp,
  v.pipe(
    v.date(),
    v.transform((value) => value.toISOString()),
  ),
]);
export const ISODate = v.pipe(v.string(), v.isoDate());
export const ISODateTime = v.pipe(v.string(), v.isoDateTime());
const Int = v.pipe(v.number(), v.integer());

export const Email = v.pipe(v.string(), v.email(), v.maxLength(200));
export const Name = v.pipe(v.string(), v.minLength(1), v.maxLength(400));
export const Description = v.pipe(v.string(), v.maxLength(1000));

export const ColumnType = v.picklist([
  'text',
  'number',
  'boolean',
  'date',
  'datetime',
  'file',
  'choice',
  'choiceList',
]);
export const TextType = v.literal('text');
export const NumberType = v.literal('number');
export const BooleanType = v.literal('boolean');
export const DateType = v.literal('date');
export const DateTimeType = v.literal('datetime');
export const FileType = v.literal('file');
export const ChoiceType = v.literal('choice');
export const ChoiceListType = v.literal('choiceList');

export const FileValue = v.object({
  url: v.pipe(v.string(), v.url()),
  filename: v.string(),
  size: Int,
  mimeType: v.string(),
  checksum: v.string(),
});

export const TextTypedValue = v.object({ type: TextType, value: v.string() });
export const NumberTypedValue = v.object({ type: NumberType, value: Int });
export const BooleanTypedValue = v.object({
  type: BooleanType,
  value: v.boolean(),
});
export const ChoiceTypedValue = v.object({ type: ChoiceType, value: ID });
export const ChoiceListTypedValue = v.object({
  type: ChoiceListType,
  value: v.array(ID),
});
export const DateTypedValue = v.object({ type: DateType, value: ISODate });
export const DateTimeTypedValue = v.object({
  type: DateTimeType,
  value: ISODateTime,
});
export const FileTypedValue = v.object({
  type: FileType,
  value: v.array(FileValue),
});

export const TypedValue = v.variant('type', [
  TextTypedValue,
  NumberTypedValue,
  BooleanTypedValue,
  ChoiceTypedValue,
  ChoiceListTypedValue,
  DateTypedValue,
  DateTimeTypedValue,
  FileTypedValue,
]);
export type TypedValue = v.InferOutput<typeof TypedValue>;

export const NewValue = v.variant('type', [
  v.object({ type: TextType, value: v.string() }),
  v.object({ type: NumberType, value: Int }),
  v.object({ type: BooleanType, value: v.boolean() }),
  v.object({ type: ChoiceType, value: ID }),
  v.object({ type: ChoiceListType, value: v.array(ID) }),
  v.object({ type: DateType, value: ISODate }),
  v.object({ type: DateTimeType, value: ISODateTime }),
  v.object({ type: FileType, value: v.array(v.string()) }),
]);

export const UpdateValue = v.variant('type', [
  v.object({ type: TextType, value: v.nullable(v.string()) }),
  v.object({ type: NumberType, value: v.nullable(Int) }),
  v.object({ type: BooleanType, value: v.boolean() }),
  v.object({ type: ChoiceType, value: v.nullable(ID) }),
  v.object({
    type: ChoiceListType,
    value: v.object({ add: v.array(ID), remove: v.array(ID) }),
  }),
  v.object({ type: DateType, value: v.nullable(ISODate) }),
  v.object({ type: DateTimeType, value: v.nullable(ISODateTime) }),
  v.object({ type: FileType, value: v.array(v.string()) }),
]);

export const Data = v.record(ID, TypedValue);
export type Data = v.InferOutput<typeof Data>;

export const NewData = v.record(ID, NewValue);
export const UpdateData = v.record(ID, UpdateValue);

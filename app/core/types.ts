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

export const Name = v.pipe(v.string(), v.minLength(1), v.maxLength(400));
export const Description = v.pipe(v.string(), v.maxLength(1000));

export const DeletedOutput = v.object({
  id: ID,
  deletedAt: v.pipe(
    v.nullable(Timestamp),
    v.transform((value) => {
      if (!value) {
        throw new Error('deletedAt is required');
      }
      return value;
    }),
  ),
});
export type DeletedInput = v.InferInput<typeof DeletedOutput>;

export const TypedValue = v.variant('type', [
  v.object({ type: v.literal('text'), value: v.string() }),
  v.object({ type: v.literal('number'), value: v.number() }),
  v.object({ type: v.literal('boolean'), value: v.boolean() }),
  v.object({ type: v.literal('datetime'), value: ISOTimestamp }),
]);

export const Data = v.record(ID, TypedValue);
export type Data = v.InferOutput<typeof Data>;

import unsafeParseDuration from 'parse-duration';
import { Temporal } from 'temporal-polyfill';
import * as v from 'valibot';

export function generateOTP(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => (b % 10).toString())
    .join('');
}

export function maxAge(duration: string) {
  return parseDuration(duration, 's');
}

export function timeAgo(duration: string) {
  const seconds = parseDuration(duration, 's');
  return dateFromInstant(Temporal.Now.instant().subtract({ seconds }));
}

export function fromNow(duration: string) {
  const seconds = parseDuration(duration, 's');
  return dateFromInstant(Temporal.Now.instant().add({ seconds }));
}

export function now() {
  return dateFromInstant(Temporal.Now.instant());
}

export function checksum(blob: Blob | string) {
  const hasher = new Bun.CryptoHasher('md5');
  hasher.update(blob);
  return hasher.digest('hex');
}

export const FileInfo = v.object({
  filename: v.string(),
  size: v.pipe(v.number(), v.integer(), v.minValue(0)),
  mimeType: v.string(),
  checksum: v.string(),
});
export type FileInfo = v.InferInput<typeof FileInfo>;

export function createFile(
  parts: BlobPart[],
  filename: string,
  mimeType: string,
): [file: File, info: FileInfo] {
  const file = new File(parts, filename, { type: mimeType });
  const info = getFileInfo(file);
  return [file, info];
}

export function getFileInfo(file: File): FileInfo {
  return {
    filename: file.name,
    size: file.size,
    mimeType: file.type,
    checksum: checksum(file),
  };
}

function dateFromInstant(instant: Temporal.Instant) {
  return new Date(instant.epochMilliseconds);
}

function parseDuration(duration: string, format: 's' | 'ms' = 'ms') {
  const value = unsafeParseDuration(duration, format);
  if (value == null) {
    throw new Error('invalid duration');
  }
  return value;
}

type FormDataEntries = Record<
  string,
  FormDataEntryValue | FormDataEntryValue[]
>;

function formDataEntries<T, K>(schema: v.GenericSchema<T, K>) {
  const typeMap = getTypeMap(schema);
  return (formData: FormData) => {
    const entries: FormDataEntries = {};
    for (const [key, value] of formData.entries()) {
      if (entries[key]) {
        if (Array.isArray(entries[key])) {
          entries[key].push(value);
        } else {
          entries[key] = [entries[key], value];
        }
      } else {
        entries[key] = typeMap[key] == 'array' ? [value] : value;
      }
    }
    return entries;
  };
}

function getTypeMap(schema: v.GenericSchema): Record<string, string> {
  if (schema.type != 'object') {
    throw new Error('Schema must be an object');
  }
  const entries = (schema as v.ObjectSchema<v.ObjectEntries, undefined>)
    .entries;
  return Object.fromEntries(
    Object.entries(entries).map(([name, schema]) => [name, schema.type]),
  );
}

export function parseFormData<Input extends FormDataEntries, Output>(
  schema: v.GenericSchema<Input, Output>,
  formData: FormData,
): Submission<Input, Output> {
  const data = v.parse(
    v.fallback(
      v.pipe(v.instance(FormData), v.transform(formDataEntries(schema))),
      {},
    ),
    formData,
  );
  const result = v.safeParse(schema, data);
  return createSubmission<Input, Output>(result, data);
}

function createSubmission<Input, Output>(
  result:
    | { success: true; output: Output }
    | { success: false; issues: (v.BaseIssue<Input> | v.BaseIssue<unknown>)[] },
  data: FormDataEntries,
): Submission<Input, Output> {
  if (result.success) {
    return {
      status: 'success',
      value: result.output,
      reply() {
        return {
          status: 'success',
        };
      },
    };
  }
  return {
    status: 'error',
    reply() {
      return {
        status: 'error',
        errors: result.issues,
        data,
      };
    },
  };
}

type Submission<Input, Output> =
  | SubmissionSuccess<Output>
  | SubmissionError<Input>;

interface SubmissionSuccess<Output> {
  status: 'success';
  value: Output;
  reply(): {
    status: 'success';
  };
}

interface SubmissionError<Input> {
  status: 'error';
  reply(): {
    status: 'error';
    errors: (v.BaseIssue<Input> | v.BaseIssue<unknown>)[];
    data: FormDataEntries;
  };
}

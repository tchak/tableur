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

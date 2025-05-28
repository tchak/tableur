import { parseStream } from 'fast-csv';
import { Readable } from 'stream';
import type { ReadableStream as NodeReadableStream } from 'stream/web';
import * as v from 'valibot';

import { type BytesStream } from '~/services/storage';
import { Data, ISODate, ISODateTime, TypedValue } from './shared.contract';
import { ImportColumn, ImportPreview } from './table.contract';

export async function parseImportPreview(stream: BytesStream) {
  const [stream1, stream2] = stream.tee();
  const delimiter = await guessCSVSeparator(stream1);
  return new Promise<Omit<ImportPreview, 'id'>>((resolve, reject) => {
    let columns: ImportPreview['columns'] = [];
    const rows: ImportPreview['rows'] = [];
    parseStream(Readable.fromWeb(stream2 as unknown as NodeReadableStream), {
      delimiter,
      maxRows: 10,
      trim: true,
      discardUnmappedColumns: true,
      ignoreEmpty: true,
      headers: true,
    })
      .on('headers', (headers: string[]) => {
        columns = headers.map((header) => ({
          name: header,
          type: 'text',
        }));
        return headers;
      })
      .on('data', (row: Record<string, string>) => {
        rows.push(columns.map((column) => row[column.name] ?? null));
      })
      .on('end', () => {
        const columnValues = columns.map(
          (column, index) =>
            [column, rows.map((row) => row.at(index))] as const,
        );
        for (const [column, values] of columnValues) {
          const value = values.at(0);
          if (value != null) {
            column.type = detectType(value);
          }
        }
        return resolve({ columns, rows, delimiter });
      })
      .on('error', reject);
  });
}

export async function parseImportData(
  stream: BytesStream,
  delimiter: string,
  columns: (ImportColumn & { id: string })[],
) {
  return new Promise<Data[]>((resolve, reject) => {
    const rows: Data[] = [];
    parseStream(Readable.fromWeb(stream as unknown as NodeReadableStream), {
      delimiter,
      trim: true,
      discardUnmappedColumns: true,
      ignoreEmpty: true,
      headers: columns.map((column) => column.name),
    })
      .on('data', (row: Record<string, string>) => {
        const data: Data = {};
        for (const column of columns) {
          const value = parseStringValue(row[column.name], column.type);
          if (value) {
            data[column.id] = value;
          }
        }
        rows.push(data);
      })
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

async function guessCSVSeparator(stream: BytesStream): Promise<string> {
  const candidates = [',', ';', '\t', '|'];
  const lineLimit = 10; // How many lines we use for guessing
  let buffer: string[] = [];
  let leftover = '';
  const decoder = new TextDecoderStream();
  const reader = stream.pipeThrough(decoder).getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    leftover += value;
    const lines = leftover.split(/\r?\n/);
    leftover = lines.pop() || '';

    buffer.push(...lines);

    if (buffer.length >= lineLimit) {
      buffer = buffer.slice(0, lineLimit);
      reader.cancel();
    }
  }
  if (buffer.length) {
    return guessFromLines(buffer, candidates);
  } else {
    return ',';
  }
}

function guessFromLines(lines: string[], candidates: string[]): string {
  const scores: Record<string, number> = {};
  for (const sep of candidates) {
    let score = 0;
    for (const line of lines) {
      const count = line.split(sep).length;
      if (count > 1) {
        score += count;
      }
    }
    scores[sep] = score;
  }
  const bestSeparator = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return bestSeparator ? bestSeparator[0] : ',';
}

export function detectType(
  value: string,
): v.InferOutput<typeof ImportColumn>['type'] {
  for (const fn of [parseNumber, parseBoolean, parseDateTime, parseDate]) {
    const type = fn(value)?.type;
    if (type) {
      return type;
    }
  }
  return 'text';
}

export function parseStringValue(
  value: string | null | undefined,
  type: v.InferOutput<typeof ImportColumn>['type'],
): TypedValue | null {
  if (value == null) {
    return null;
  }
  switch (type) {
    case 'text':
      return { type, value };
    case 'number':
      return parseNumber(value);
    case 'boolean':
      return parseBoolean(value);
    case 'date':
      return parseDate(value);
    case 'datetime':
      return parseDateTime(value);
  }
}

function parseNumber(value: string): { type: 'number'; value: number } | null {
  const result = v.safeParse(NumberValue, value);
  if (result.success) {
    return { type: 'number', value: result.output };
  }
  return null;
}

function parseBoolean(
  value: string,
): { type: 'boolean'; value: boolean } | null {
  const result = v.safeParse(BooleanValue, value);
  if (result.success) {
    return { type: 'boolean', value: result.output };
  }
  return null;
}

function parseDate(value: string): { type: 'date'; value: string } | null {
  const result = v.safeParse(ISODate, value);
  if (result.success) {
    return { type: 'date', value: result.output };
  }
  return null;
}

function parseDateTime(
  value: string,
): { type: 'datetime'; value: string } | null {
  const result = v.safeParse(ISODateTime, value);
  if (result.success) {
    return { type: 'datetime', value: result.output };
  }
  return null;
}

const NumberValue = v.pipe(
  v.string(),
  v.minLength(1),
  v.transform(Number),
  v.number(),
);

const TrueValue = v.pipe(
  v.string(),
  v.toLowerCase(),
  v.picklist(['true', 't', 'yes', 'on', 'oui']),
  v.transform(() => true),
);
const FalseValue = v.pipe(
  v.string(),
  v.toLowerCase(),
  v.picklist(['false', 'n', 'no', 'off', 'non']),
  v.transform(() => false),
);
const BooleanValue = v.union([TrueValue, FalseValue]);

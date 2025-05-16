import {
  FileStorage,
  type TemporaryUrlOptions,
  type WriteOptions,
} from '@flystorage/file-storage';
import {
  LocalStorageAdapter,
  type LocalTemporaryUrlGenerator,
} from '@flystorage/local-fs';
import { defaults, seal, unseal } from '@hapi/iron';
import { vValidator as validator } from '@hono/valibot-validator';
import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { Readable } from 'stream';
import type { ReadableStream as NodeReadableStream } from 'stream/web';
import * as v from 'valibot';

import { FileInfo, getFileInfo } from '../utils';
import { prisma } from './db';
import { env } from './env';

const rootDirectory = `${process.cwd()}/storage/${env.NODE_ENV}`;
const temporaryUrlGenerator: LocalTemporaryUrlGenerator = {
  async temporaryUrl(path, options) {
    const ttl =
      typeof options.expiresAt === 'number'
        ? options.expiresAt
        : options.expiresAt.getMilliseconds();
    const secret = await seal(path, env.STORAGE_SECRET_KEY, {
      ...defaults,
      ttl,
    });
    const url = new URL(path, options.baseUrl || env.STORAGE_HOSTNAME);
    url.searchParams.set('secret', secret);
    return url.toString();
  },
};
const storage = new FileStorage(
  new LocalStorageAdapter(
    rootDirectory,
    undefined,
    undefined,
    undefined,
    temporaryUrlGenerator
  )
);

const router = new Hono();

router.get(
  ':key/:filename',
  validator('param', v.object({ key: v.string(), filename: v.string() })),
  validator('query', v.object({ secret: v.string() })),
  async (c) => {
    const params = c.req.valid('param');
    const query = c.req.valid('query');
    const secretPath = await unseal(
      query.secret,
      env.STORAGE_SECRET_KEY,
      defaults
    );
    const path = pathFor(params);
    if (path == secretPath) {
      return stream(c, async (stream) => {
        const readable = await readFile(path);
        await stream.pipe(readable);
      });
    }
    return c.body('Unauthorized', 401);
  }
);
router.put(
  ':key/:filename',
  validator('param', v.object({ key: v.string(), filename: v.string() })),
  validator('query', v.object({ secret: v.string() })),
  async (c) => {
    const params = c.req.valid('param');
    const query = c.req.valid('query');
    const secretPath = await unseal(
      query.secret,
      env.STORAGE_SECRET_KEY,
      defaults
    );
    const path = pathFor(params);
    if (path == secretPath) {
      const file = await c.req.blob();
      await writeFile(path, file.stream());
      return c.body(null, 204);
    }
    return c.body('Unauthorized', 401);
  }
);
router.post('/', validator('json', FileInfo), async (c) => {
  const fileInfo = c.req.valid('json');
  const { blobId } = await createBlob(fileInfo);
  return c.json(
    { blobId, url: await url(blobId, { expiresAt: 1000 * 60 * 10 }) },
    { status: 201 }
  );
});

export { router };

export type BytesStream = ReadableStream<Uint8Array<ArrayBufferLike>>;

export async function readFile(path: string): Promise<BytesStream> {
  const stream = await storage.read(path);
  return Readable.toWeb(stream) as unknown as BytesStream;
}

export async function writeFile(
  path: string,
  stream: BytesStream,
  options?: WriteOptions
) {
  await storage.write(
    path,
    Readable.fromWeb(stream as unknown as NodeReadableStream),
    options
  );
}

export async function deleteFile(path: string) {
  await storage.deleteFile(path);
}

export async function upload(file: File) {
  const fileInfo = getFileInfo(file);
  const { path, blobId } = await createBlob(fileInfo);
  await writeFile(path, file.stream(), fileInfo);
  return blobId;
}

export async function download(blobId: string): Promise<BytesStream> {
  const path = await getPath(blobId);
  return readFile(path);
}

export async function url(blobId: string, options: TemporaryUrlOptions) {
  const path = await getPath(blobId);
  return storage.temporaryUrl(path, options);
}

export async function remove(attachmentId: string) {
  const { blobId } = await prisma.fileStorageAttachment.delete({
    where: { id: attachmentId },
    select: { blobId: true },
  });
  await deleteBlob(blobId);
}

function pathFor({ key, filename }: { key: string; filename: string }) {
  return `${key}/${filename}`;
}

async function getPath(blobId: string) {
  const blob = await prisma.fileStorageBlob.findUniqueOrThrow({
    where: { id: blobId },
    select: { key: true, filename: true },
  });
  return pathFor(blob);
}

async function createBlob(fileInfo: FileInfo) {
  const blob = await prisma.fileStorageBlob.create({
    data: {
      key: crypto.randomUUID(),
      ...fileInfo,
    },
    select: { id: true, key: true, filename: true },
  });
  return { blobId: blob.id, path: pathFor(blob) };
}

async function deleteBlob(blobId: string) {
  const blob = await prisma.fileStorageBlob.findUnique({
    where: { id: blobId },
    select: {
      id: true,
      key: true,
      filename: true,
      _count: { select: { attachments: true } },
    },
  });
  if (blob?._count.attachments == 0) {
    const path = pathFor(blob);
    await storage.deleteFile(path);
    await prisma.fileStorageBlob.delete({ where: { id: blob.id } });
  }
}

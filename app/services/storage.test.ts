import { beforeEach, describe, expect, it } from 'bun:test';
import * as v from 'valibot';

import { app } from '../server/app';
import { prisma } from './db';
import * as storage from './storage';

describe('storage', () => {
  beforeEach(async () => {
    await prisma.fileStorageAttachment.deleteMany();
    await prisma.fileStorageBlob.deleteMany();
  });

  it('upload file', async () => {
    const [file] = storage.createFile(['Hello World'], 'test.txt', 'text/plain');
    const blobId = await storage.upload(file);
    const blob = await prisma.fileStorageBlob.findFirstOrThrow();
    expect(blobId).toEqual(blob.id);

    const stream = await storage.download(blobId);
    const text = await Bun.readableStreamToText(stream);
    expect(text).toEqual('Hello World');
  });

  it('/storage', async () => {
    const [file, info] = storage.createFile(['Hello Greer!'], 'test.txt', 'text/plain');
    const response = await app.request('/storage', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(info),
    });
    const data = await response.json();
    const blob = v.parse(
      v.object({ blobId: v.pipe(v.string(), v.uuid()), url: v.pipe(v.string(), v.url()) }),
      data,
    );
    const url = new URL(blob.url);
    const path = '/storage' + url.pathname + url.search;

    {
      const response = await app.request(path, { method: 'PUT', body: file });
      expect(response.status).toBe(204);
    }

    {
      const response = await app.request(path, { method: 'GET' });
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toEqual('Hello Greer!');
    }
  });
});

import { beforeEach, describe, expect, it } from 'bun:test';
import * as v from 'valibot';

import { prisma } from '~/lib/db';
import { app } from '~/server/app';
import { openapi } from './table.contract';
import { createTestUser } from './user.test';

describe('api/v1/imports', () => {
  let headers: Record<string, string>;
  beforeEach(async () => {
    await prisma.user.deleteMany();
    await prisma.importPreview.deleteMany();
    const user = await createTestUser();
    headers = { authorization: user.authorization };
  });

  const CSV = `name,age,vegan,"birth date"
John Doe,30,yes,1990-01-01
Jane Doe,45,no,1975-06-15`;

  for (const delimiter of [',', ';', '\t']) {
    it(`import csv [${delimiter}]`, async () => {
      const response = await app.request('/api/v1/imports', {
        method: 'POST',
        body: CSV.replaceAll(',', delimiter),
        headers: { 'content-type': 'text/csv', ...headers },
      });
      expect(response.status).toBe(201);
      const data = await response.json();
      const { data: preview } = v.parse(openapi.importPreview, data);
      expect(preview.columns.length).toBe(4);
      expect(preview.columns).toMatchObject([
        { name: 'name', type: 'text' },
        { name: 'age', type: 'number' },
        { name: 'vegan', type: 'boolean' },
        { name: 'birth date', type: 'date' },
      ]);
      expect(preview.rows.length).toBe(2);
      expect(preview.rows).toMatchObject([
        ['John Doe', '30', 'yes', '1990-01-01'],
        ['Jane Doe', '45', 'no', '1975-06-15'],
      ]);
    });
  }
});

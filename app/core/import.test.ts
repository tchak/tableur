import { beforeEach, describe, expect, it } from 'bun:test';
import * as v from 'valibot';

import { app } from '~/server/app';
import { prisma } from '~/services/db';
import { ImportPreviewJSON } from './import.types';

describe('api/v1/imports', () => {
  beforeEach(async () => {
    await prisma.importPreview.deleteMany();
  });

  const CSV = `name,age,vegan,"birth date"
John Doe,30,yes,1990-01-01
Jane Doe,45,no,1975-06-15`;

  for (const delimiter of [',', ';', '\t']) {
    it(`import csv [${delimiter}]`, async () => {
      const response = await app.request('/api/v1/imports', {
        method: 'POST',
        body: CSV.replaceAll(',', delimiter),
        headers: { 'content-type': 'text/csv' },
      });
      expect(response.status).toBe(201);
      const data = await response.json();
      const { data: preview } = v.parse(
        v.object({ data: ImportPreviewJSON }),
        data,
      );
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

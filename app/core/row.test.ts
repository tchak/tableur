import { beforeEach, describe, expect, it } from 'bun:test';
import * as v from 'valibot';

import { prisma } from '~/lib/db';
import { app } from '~/server/app';
import { client } from './router';
import { openapi } from './row.contract';
import { createTestUser } from './user.test';

describe('api/v1/rows', () => {
  let organizationId: string;
  let tableId: string;
  let columnId: string;
  let rowId: string;
  let headers: Record<string, string>;
  beforeEach(async () => {
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();

    const user = await createTestUser();
    organizationId = user.organizationId;
    headers = { authorization: user.authorization };

    const table = await client.table.create(
      {
        organizationId,
        name: 'Test Table',
        columns: [{ name: 'Test Column', type: 'text' }],
        rows: [{}],
      },
      { context: { user: user.user } },
    );
    tableId = table.id;
    rowId = (await prisma.row.findFirstOrThrow()).id;
    columnId = (await prisma.column.findFirstOrThrow()).id;
  });

  it('should return a list of rows', async () => {
    const response = await app.request(`/api/v1/tables/${tableId}/rows`, {
      headers,
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: rows } = v.parse(openapi.list, data);
    expect(rows.length).toBe(1);
  });

  it('should return a row', async () => {
    const response = await app.request(`/api/v1/rows/${rowId}`, { headers });
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: row } = v.parse(openapi.find, data);
    expect(row.id).toEqual(rowId);
    expect(row.table.id).toEqual(tableId);
    expect(row.table.columns.length).toBe(1);
    const column = row.table.columns.at(0);
    expect(column?.name).toEqual('Test Column');
    expect(column?.type).toEqual('text');
  });

  it('should create a row', async () => {
    const response = await app.request(`/api/v1/tables/${tableId}/rows`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({
        data: {
          [columnId]: {
            type: 'text',
            value: 'test value',
          },
        },
      }),
    });
    expect(response.status).toBe(201);
    const data = await response.json();
    const { data: row } = v.parse(openapi.create, data);
    expect(row.number).toEqual(2);
    const typedValue = row.data[columnId];
    expect(typedValue?.type).toEqual('text');
    expect(typedValue?.value).toEqual('test value');

    {
      const response = await app.request(`/api/v1/tables/${tableId}/rows`, {
        headers,
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      const { data: rows } = v.parse(openapi.list, data);
      expect(rows.length).toBe(2);
      expect(rows.map(({ number }) => number)).toStrictEqual([1, 2]);
    }
  });

  it('should delete a row', async () => {
    const response = await app.request(`/api/v1/rows/${rowId}`, {
      method: 'DELETE',
      headers,
    });
    expect(response.status).toBe(200);

    {
      const response = await app.request(`/api/v1/rows/${rowId}`, { headers });
      expect(response.status).toBe(404);
    }
  });
});

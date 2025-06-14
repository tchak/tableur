import type { JSONSchema7 } from '@valibot/to-json-schema';
import { beforeEach, describe, expect, it } from 'bun:test';
import * as v from 'valibot';

import { prisma } from '~/lib/db';
import { app } from '~/server/app';
import { client } from './router';
import { openapi } from './table.contract';
import { createTestUser } from './user.test';

describe('api/v1/tables', () => {
  let organizationId: string;
  let tableId: string;
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
      },
      { context: { user: user.user } },
    );
    tableId = table.id;
  });

  it('should return a list of tables', async () => {
    const response = await app.request(
      `/api/v1/organizations/${organizationId}/tables`,
      { headers },
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: tables } = v.parse(openapi.list, data);
    expect(tables.length).toBe(1);
  });

  it('should return a table', async () => {
    const response = await app.request(`/api/v1/tables/${tableId}`, {
      headers,
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: table } = v.parse(openapi.find, data);
    expect(table.id).toEqual(tableId);
    expect(table.columns.length).toBe(1);
    const column = table.columns.at(0);
    expect(column?.name).toEqual('Test Column');
    expect(column?.type).toEqual('text');

    {
      const response = await app.request(
        `/api/v1/tables/${tableId}/schema.json`,
        { headers },
      );
      expect(response.status).toBe(200);
      const schema: JSONSchema7 = await response.json();
      const id = column?.id ?? 'fail';
      expect(schema.type).toEqual('object');
      expect(schema.required).toEqual([id]);
      expect(schema.properties).toStrictEqual({
        [id]: {
          type: 'object',
          properties: { type: { const: 'text' }, value: { type: 'string' } },
          required: ['type', 'value'],
          title: 'Test Column',
        },
      });
    }
    {
      const response = await app.request(`/api/v1/tables/${tableId}/data.csv`, {
        headers,
      });
      expect(response.status).toBe(200);
      const csv = await response.text();
      expect(csv).toEqual(
        'ID,Number,Creation Date,Submission Date,Email,Test Column',
      );
    }
  });

  it('should create a table', async () => {
    const response = await app.request(
      `/api/v1/organizations/${organizationId}/tables`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify({
          name: 'Hello World',
        }),
      },
    );
    expect(response.status).toBe(201);
    const data = await response.json();
    const { data: table } = v.parse(openapi.create, data);
    expect(table.name).toEqual('Hello World');
    expect(table.number).toEqual(2);

    {
      const response = await app.request(
        `/api/v1/organizations/${organizationId}/tables`,
        { headers },
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      const { data: tables } = v.parse(openapi.list, data);
      expect(tables.length).toBe(2);
      expect(tables.map(({ name }) => name)).toStrictEqual([
        'Test Table',
        'Hello World',
      ]);
      expect(tables.map(({ number }) => number)).toStrictEqual([1, 2]);
    }
  });

  it('should delete a table', async () => {
    const response = await app.request(`/api/v1/tables/${tableId}`, {
      method: 'DELETE',
      headers,
    });
    expect(response.status).toBe(200);

    {
      const response = await app.request(`/api/v1/tables/${tableId}`, {
        headers,
      });
      expect(response.status).toBe(404);
    }
  });

  it('should update a table', async () => {
    const response = await app.request(`/api/v1/tables/${tableId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({
        name: 'Hello World!',
      }),
    });
    expect(response.status).toBe(204);
  });

  it('should clone a table', async () => {
    const response = await app.request(`/api/v1/tables/${tableId}/clone`, {
      method: 'POST',
      headers,
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: table } = v.parse(openapi.clone, data);
    expect(table.id).not.toEqual(tableId);
    expect(table.number).toEqual(2);
    const clonedTableId = table.id;

    {
      const response = await app.request(`/api/v1/tables/${clonedTableId}`, {
        headers,
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      const { data: table } = v.parse(openapi.find, data);
      expect(table.columns.length).toBe(1);
      const column = table.columns.at(0);
      expect(column?.name).toEqual('Test Column');
      expect(column?.type).toEqual('text');
    }
  });
});

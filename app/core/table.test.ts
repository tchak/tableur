import { beforeEach, describe, expect, it } from 'bun:test';
import * as v from 'valibot';

import { app } from '../server/app';
import { prisma } from '../services/db';
import { ColumnOutput } from './column.types';
import { organizationCreate } from './organization.db';
import { tableCreate } from './table.db';
import { TableOutput } from './table.types';

const TableListOutput = v.object({
  data: v.array(TableOutput),
  meta: v.object({ total: v.number() }),
});
const TableGetOutput = v.object({
  data: v.object({ ...TableOutput.entries, columns: v.array(ColumnOutput) }),
});
const TableCreateOutput = v.object({
  data: TableOutput,
});

describe('api/v1/tables', () => {
  let organizationId: string;
  let tableId: string;
  beforeEach(async () => {
    await prisma.organization.deleteMany();
    const organization = await organizationCreate({ name: 'Test Organization' });
    organizationId = organization.id;
    const table = await tableCreate(
      { organizationId },
      { name: 'Test Table', columns: [{ name: 'Test Column', type: 'text' }] },
    );
    tableId = table.id;
  });

  it('should return a list of tables', async () => {
    const response = await app.request(`/api/v1/organizations/${organizationId}/tables`);
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: tables } = v.parse(TableListOutput, data);
    expect(tables.length).toBe(1);
  });

  it('should return a table', async () => {
    const response = await app.request(`/api/v1/tables/${tableId}`);
    expect(response.status).toBe(200);
    const data = await response.json();
    const { data: table } = v.parse(TableGetOutput, data);
    expect(table.id).toEqual(tableId);
    expect(table.columns.length).toBe(1);
    const column = table.columns.at(0);
    expect(column?.name).toEqual('Test Column');
    expect(column?.type).toEqual('text');
  });

  it('should create a table', async () => {
    const response = await app.request(`/api/v1/organizations/${organizationId}/tables`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Hello World',
      }),
    });
    expect(response.status).toBe(201);
    const data = await response.json();
    const { data: table } = v.parse(TableCreateOutput, data);
    expect(table.name).toEqual('Hello World');
    expect(table.number).toEqual(2);

    {
      const response = await app.request(`/api/v1/organizations/${organizationId}/tables`);
      expect(response.status).toBe(200);
      const data = await response.json();
      const { data: tables } = v.parse(TableListOutput, data);
      expect(tables.length).toBe(2);
      expect(tables.map(({ name }) => name)).toStrictEqual(['Test Table', 'Hello World']);
      expect(tables.map(({ number }) => number)).toStrictEqual([1, 2]);
    }
  });

  it('should delete a table', async () => {
    const response = await app.request(`/api/v1/tables/${tableId}`, {
      method: 'DELETE',
    });
    expect(response.status).toBe(200);

    {
      const response = await app.request(`/api/v1/tables/${tableId}`);
      expect(response.status).toBe(404);
    }
  });
});

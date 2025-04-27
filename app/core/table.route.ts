import { vValidator as validator } from '@hono/valibot-validator';
import { Hono } from 'hono';

import { handlePrismaError } from './error.types';
import { tableImportData } from './import.db';
import { OrganizationParams } from './organization.types';
import { tableClone, tableCreate, tableDelete, tableGet, tableList, tableUpdate } from './table.db';
import {
  TableCreateInput,
  TableImportDataInput,
  TableParams,
  TableUpdateInput,
} from './table.types';

const tables = new Hono();
const table = new Hono();

tables.get('/', validator('param', OrganizationParams), async (c) => {
  const params = c.req.valid('param');
  const data = await tableList(params);
  return c.json({ data, meta: { total: data.length } });
});
tables.post(
  '/',
  validator('param', OrganizationParams),
  validator('json', TableCreateInput),
  async (c) => {
    const params = c.req.valid('param');
    const input = c.req.valid('json');
    const data = await tableCreate(params, input);
    c.header('Location', `/api/v1/organizations/${params.organizationId}/tables/${data.id}`);
    return c.json({ data }, { status: 201 });
  },
);

table.get('/', validator('param', TableParams), async (c) => {
  const params = c.req.valid('param');
  const data = await tableGet(params).catch(handlePrismaError);
  return c.json({ data });
});
table.patch(
  '/',
  validator('json', TableUpdateInput),
  validator('param', TableParams),
  async (c) => {
    const params = c.req.valid('param');
    const input = c.req.valid('json');
    await tableUpdate(params, input).catch(handlePrismaError);
    return c.body(null, { status: 204 });
  },
);
table.delete('/', validator('param', TableParams), async (c) => {
  const params = c.req.valid('param');
  const data = await tableDelete(params).catch(handlePrismaError);
  return c.json({ data });
});
table.post('/clone', validator('param', TableParams), async (c) => {
  const params = c.req.valid('param');
  const data = await tableClone(params).catch(handlePrismaError);
  return c.json({ data });
});
table.post(
  '/import',
  validator('param', TableParams),
  validator('json', TableImportDataInput),
  async (c) => {
    const params = c.req.valid('param');
    const input = c.req.valid('json');
    const data = await tableImportData(params, input).catch(handlePrismaError);
    return c.json({ data });
  },
);

export { table, tables };

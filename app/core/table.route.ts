import { vValidator as validator } from '@hono/valibot-validator';
import { Hono } from 'hono';
import * as v from 'valibot';

import { OrganizationParams } from './organization.contract';
import { client } from './router';
import {
  TableCreateInput,
  TableImportDataInput,
  TableParams,
  TableUpdateInput,
} from './table.types';

const tables = new Hono();
const table = new Hono();

tables
  .get('/', validator('param', OrganizationParams), async (c) => {
    const params = c.req.valid('param');
    const data = await client.table.list(params, {
      context: { request: c.req.raw },
    });
    return c.json({ data, meta: { total: data.length } });
  })
  .post(
    '/',
    validator('param', OrganizationParams),
    validator('json', v.omit(TableCreateInput, ['organizationId'])),
    async (c) => {
      const params = c.req.valid('param');
      const input = c.req.valid('json');
      const data = await client.table.create(
        { ...params, ...input },
        { context: { request: c.req.raw } },
      );
      c.header(
        'Location',
        `/api/v1/organizations/${params.organizationId}/tables/${data.id}`,
      );
      return c.json({ data }, { status: 201 });
    },
  );

table
  .get('/', validator('param', TableParams), async (c) => {
    const params = c.req.valid('param');
    const data = await client.table.get(params, {
      context: { request: c.req.raw },
    });
    return c.json({ data });
  })
  .patch(
    '/',
    validator('json', v.omit(TableUpdateInput, ['tableId'])),
    validator('param', TableParams),
    async (c) => {
      const params = c.req.valid('param');
      const input = c.req.valid('json');
      await client.table.update(
        { ...params, ...input },
        { context: { request: c.req.raw } },
      );
      return c.body(null, { status: 204 });
    },
  )
  .delete('/', validator('param', TableParams), async (c) => {
    const params = c.req.valid('param');
    const data = await client.table.delete(params, {
      context: { request: c.req.raw },
    });
    return c.json({ data });
  })
  .post('/clone', validator('param', TableParams), async (c) => {
    const params = c.req.valid('param');
    const data = await client.table.clone(params, {
      context: { request: c.req.raw },
    });
    return c.json({ data });
  })
  .post(
    '/import',
    validator('param', TableParams),
    validator('json', v.omit(TableImportDataInput, ['tableId'])),
    async (c) => {
      const params = c.req.valid('param');
      const input = c.req.valid('json');
      const data = await client.import.tableData(
        { ...params, ...input },
        { context: { request: c.req.raw } },
      );
      return c.json({ data });
    },
  );

export { table, tables };

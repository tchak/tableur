import { vValidator as validator } from '@hono/valibot-validator';
import { Hono } from 'hono';
import * as v from 'valibot';

import { client } from './router';
import {
  RowCreateInput,
  RowParams,
  RowUpdateInput,
  TableParams,
} from './row.contract';

const rows = new Hono();
const row = new Hono();

rows
  .get('/', validator('param', TableParams), async (c) => {
    const params = c.req.valid('param');
    const data = await client.row.list(params, {
      context: { request: c.req.raw },
    });
    return c.json({ data, meta: { total: data.length } });
  })
  .post(
    '/',
    validator('param', TableParams),
    validator('json', v.omit(RowCreateInput, ['tableId'])),
    async (c) => {
      const params = c.req.valid('param');
      const input = c.req.valid('json');
      const data = await client.row.create(
        { ...params, ...input },
        { context: { request: c.req.raw } },
      );
      c.header('Location', `/api/v1/tables/${params.tableId}/rows/${data.id}`);
      return c.json({ data }, { status: 201 });
    },
  );

row
  .get('/', validator('param', RowParams), async (c) => {
    const params = c.req.valid('param');
    const data = await client.row.find(params, {
      context: { request: c.req.raw },
    });
    return c.json({ data });
  })
  .patch(
    '/',
    validator('param', RowParams),
    validator('json', v.omit(RowUpdateInput, ['rowId'])),
    async (c) => {
      const params = c.req.valid('param');
      const input = c.req.valid('json');
      const data = await client.row.update(
        { ...params, ...input },
        { context: { request: c.req.raw } },
      );
      return c.json({ data });
    },
  )
  .delete('/', validator('param', RowParams), async (c) => {
    const params = c.req.valid('param');
    const data = await client.row.destroy(params, {
      context: { request: c.req.raw },
    });
    return c.json({ data });
  });

export { row, rows };

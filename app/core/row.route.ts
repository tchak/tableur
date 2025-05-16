import { vValidator as validator } from '@hono/valibot-validator';
import { Hono } from 'hono';

import { handlePrismaError } from './error.types';
import { rowCreate, rowDelete, rowGet, rowList, rowUpdate } from './row.db';
import { RowCreateInput, RowParams, RowUpdateInput } from './row.types';
import { TableParams } from './table.types';

const rows = new Hono();
const row = new Hono();

rows
  .get('/', validator('param', TableParams), async (c) => {
    const params = c.req.valid('param');
    const data = await rowList(params);
    return c.json({ data, meta: { total: data.length } });
  })
  .post(
    '/',
    validator('param', TableParams),
    validator('json', RowCreateInput),
    async (c) => {
      const params = c.req.valid('param');
      const input = c.req.valid('json');
      const data = await rowCreate(params, input);
      c.header('Location', `/api/v1/tables/${params.tableId}/rows/${data.id}`);
      return c.json({ data }, { status: 201 });
    },
  );

row
  .get('/', validator('param', RowParams), async (c) => {
    const params = c.req.valid('param');
    const data = await rowGet(params).catch(handlePrismaError);
    return c.json({ data });
  })
  .patch(
    '/',
    validator('param', RowParams),
    validator('json', RowUpdateInput),
    async (c) => {
      const params = c.req.valid('param');
      const input = c.req.valid('json');
      const data = await rowUpdate(params, input).catch(handlePrismaError);
      return c.json({ data });
    },
  )
  .delete('/', validator('param', RowParams), async (c) => {
    const params = c.req.valid('param');
    const data = await rowDelete(params).catch(handlePrismaError);
    return c.json({ data });
  });

export { row, rows };

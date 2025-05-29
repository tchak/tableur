import { vValidator as validator } from '@hono/valibot-validator';
import { toJsonSchema } from '@valibot/to-json-schema';
import { Hono } from 'hono';
import * as v from 'valibot';

import { OrganizationParams } from './organization.contract';
import { client } from './router';
import {
  BooleanTypedValue,
  DateTimeTypedValue,
  DateTypedValue,
  FileTypedValue,
  NumberTypedValue,
  TextTypedValue,
} from './shared.contract';
import {
  TableCreateInput,
  TableImportDataInput,
  TableParams,
  TableUpdateInput,
} from './table.contract';

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
    const data = await client.table.find(params, {
      context: { request: c.req.raw },
    });
    return c.json({ data });
  })
  .get('/data.csv', validator('param', TableParams), async (c) => {
    const params = c.req.valid('param');
    const data = await client.table.csv(params, {
      context: { request: c.req.raw },
    });
    c.header('content-type', 'text/csv');
    return c.body(data);
  })
  .get('/schema.json', validator('param', TableParams), async (c) => {
    const params = c.req.valid('param');
    const data = await client.table.find(params, {
      context: { request: c.req.raw },
    });
    const entries = data.columns.map((column) => {
      switch (column.type) {
        case 'text':
          return [column.id, v.pipe(TextTypedValue, v.title(column.name))];
        case 'number':
          return [column.id, v.pipe(NumberTypedValue, v.title(column.name))];
        case 'boolean':
          return [column.id, v.pipe(BooleanTypedValue, v.title(column.name))];
        case 'date':
          return [column.id, v.pipe(DateTypedValue, v.title(column.name))];
        case 'datetime':
          return [column.id, v.pipe(DateTimeTypedValue, v.title(column.name))];
        case 'choice':
          return [
            column.id,
            v.pipe(
              v.object({
                type: v.literal(column.type),
                value: v.picklist(column.options.map((option) => option.id)),
              }),
              v.title(column.name),
            ),
          ];
        case 'choiceList':
          return [
            column.id,
            v.pipe(
              v.object({
                type: v.literal(column.type),
                value: v.array(
                  v.picklist(column.options.map((option) => option.id)),
                ),
              }),
              v.title(column.name),
            ),
          ];
        case 'file':
          return [column.id, v.pipe(FileTypedValue, v.title(column.name))];
      }
    });
    const schema = toJsonSchema(v.object(Object.fromEntries(entries)));
    return c.json(schema);
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
    const data = await client.table.destroy(params, {
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
      const data = await client.table.importData(
        { ...params, ...input },
        { context: { request: c.req.raw } },
      );
      return c.json({ data });
    },
  );

export { table, tables };

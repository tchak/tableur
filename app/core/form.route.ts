import { Hono } from 'hono';
import { validator } from 'hono-openapi/valibot';
import * as v from 'valibot';

import {
  FormCreateInput,
  FormParams,
  FormUpdateInput,
  openapi,
} from './form.contract';
import { describeRoute } from './openapi';
import { client } from './router';
import { TableParams } from './table.contract';

const forms = new Hono();
const form = new Hono();

forms
  .get(
    '/',
    describeRoute({
      description: 'List forms',
      output: openapi.list,
    }),
    validator('param', TableParams),
    async (c) => {
      const params = c.req.valid('param');
      const data = await client.form.list(params, {
        context: { request: c.req.raw },
      });
      return c.json({ data, meta: { total: data.length } });
    },
  )
  .post(
    '/',
    describeRoute({
      description: 'Create form',
      output: openapi.create,
    }),
    validator('param', TableParams),
    validator('json', v.omit(FormCreateInput, ['tableId'])),
    async (c) => {
      const params = c.req.valid('param');
      const input = c.req.valid('json');
      const data = await client.form.create(
        { ...params, ...input },
        { context: { request: c.req.raw } },
      );
      c.header('Location', `/api/v1/forms/${data.id}`);
      return c.json({ data }, { status: 201 });
    },
  );

form
  .get(
    '/',
    describeRoute({
      description: 'Find form',
      output: openapi.find,
    }),
    validator('param', FormParams),
    async (c) => {
      const params = c.req.valid('param');
      const data = await client.form.find(params, {
        context: { request: c.req.raw },
      });
      return c.json({ data });
    },
  )
  .patch(
    '/',
    validator('json', v.omit(FormUpdateInput, ['formId'])),
    validator('param', FormParams),
    async (c) => {
      const params = c.req.valid('param');
      const input = c.req.valid('json');
      await client.form.update(
        { ...params, ...input },
        { context: { request: c.req.raw } },
      );
      return c.body(null, { status: 204 });
    },
  )
  .delete('/', validator('param', FormParams), async (c) => {
    const params = c.req.valid('param');
    await client.form.destroy(params, { context: { request: c.req.raw } });
    return c.body(null, { status: 204 });
  });

export { form, forms };

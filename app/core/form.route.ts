import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/valibot';
import * as v from 'valibot';

import { env } from '~/services/env';
import {
  FormCreateInput,
  FormGetJSON,
  FormListJSON,
  FormParams,
  FormUpdateInput,
} from './form.types';
import { client } from './router';
import { TableParams } from './table.types';

const forms = new Hono();
const form = new Hono();

forms
  .get(
    '/',
    describeRoute({
      description: 'List forms',
      responses: {
        200: {
          description: '',
          content: {
            'application/json': {
              schema: resolver(FormListJSON),
            },
          },
        },
      },
      validateResponse: env.NODE_ENV == 'test',
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
      description: 'Get form',
      responses: {
        200: {
          description: '',
          content: {
            'application/json': {
              schema: resolver(FormGetJSON),
            },
          },
        },
      },
      validateResponse: env.NODE_ENV == 'test',
    }),
    validator('param', FormParams),
    async (c) => {
      const params = c.req.valid('param');
      const data = await client.form.get(params, {
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
    await client.form.delete(params, { context: { request: c.req.raw } });
    return c.body(null, { status: 204 });
  });

export { form, forms };

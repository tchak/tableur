import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/valibot';

import { env } from '~/services/env';
import { handlePrismaError } from './error.types';
import {
  formCreate,
  formDelete,
  formGet,
  formList,
  formUpdate,
} from './form.db';
import {
  FormCreateInput,
  FormGetJSON,
  FormListJSON,
  FormParams,
  FormUpdateInput,
} from './form.types';
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
      const data = await formList(params);
      return c.json({ data, meta: { total: data.length } });
    },
  )
  .post(
    '/',
    validator('param', TableParams),
    validator('json', FormCreateInput),
    async (c) => {
      const params = c.req.valid('param');
      const input = c.req.valid('json');
      const data = await formCreate(params, input);
      c.header('Location', `/api/v1/tables/${params.tableId}/forms/${data.id}`);
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
      const data = await formGet(params).catch(handlePrismaError);
      return c.json({ data });
    },
  )
  .patch(
    '/',
    validator('json', FormUpdateInput),
    validator('param', FormParams),
    async (c) => {
      const params = c.req.valid('param');
      const input = c.req.valid('json');
      const data = await formUpdate(params, input).catch(handlePrismaError);
      return c.json({ data });
    },
  )
  .delete('/', validator('param', FormParams), async (c) => {
    const params = c.req.valid('param');
    const data = await formDelete(params).catch(handlePrismaError);
    return c.json({ data });
  });

export { form, forms };

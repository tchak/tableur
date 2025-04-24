import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/valibot';

import { formCreate, formDelete, formGet, formList, formUpdate } from './form.db';
import { FormCreateInput, FormListJSON, FormParams, FormUpdateInput } from './form.types';
import { TableParams } from './table.types';

const forms = new Hono();
const form = new Hono();

forms.get(
  '/',
  describeRoute({
    description: 'List forms',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: resolver(FormListJSON),
          },
        },
      },
    },
  }),
  validator('param', TableParams),
  async (c) => {
    const params = c.req.valid('param');
    const data = await formList(params);
    return c.json({ data, meta: { total: data.length } });
  },
);
forms.post('/', validator('param', TableParams), validator('json', FormCreateInput), async (c) => {
  const params = c.req.valid('param');
  const input = c.req.valid('json');
  const data = await formCreate(params, input);
  c.header('Location', `/api/v1/tables/${params.tableId}/forms/${data.id}`);
  return c.json({ data }, { status: 201 });
});

form.get('/', validator('param', FormParams), async (c) => {
  const params = c.req.valid('param');
  const data = await formGet(params);
  return c.json({ data });
});
form.patch('/', validator('json', FormUpdateInput), validator('param', FormParams), async (c) => {
  const params = c.req.valid('param');
  const input = c.req.valid('json');
  const data = await formUpdate(params, input);
  return c.json({ data });
});
form.delete('/', validator('param', FormParams), async (c) => {
  const params = c.req.valid('param');
  const data = await formDelete(params);
  return c.json({ data });
});

export { form, forms };

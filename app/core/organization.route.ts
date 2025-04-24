import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/valibot';

import { env } from '../services/env';
import { parseServerError } from './error.types';
import {
  organizationCreate,
  organizationDelete,
  organizationGet,
  organizationList,
  organizationPathList,
  organizationUpdate,
} from './organization.db';
import {
  OrganizationCreateInput,
  OrganizationListJSON,
  OrganizationParams,
  OrganizationUpdateInput,
} from './organization.types';

const organizations = new Hono();
const organization = new Hono();

organizations.get(
  '/',
  describeRoute({
    description: 'List organizations',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: resolver(OrganizationListJSON),
          },
        },
      },
    },
    validateResponse: env.NODE_ENV == 'test',
  }),
  async (c) => {
    const data = await organizationList();
    return c.json({ data, meta: { total: data.length } });
  },
);
organizations.post('/', validator('json', OrganizationCreateInput), async (c) => {
  const input = c.req.valid('json');
  const data = await organizationCreate(input);
  c.header('Location', `/api/v1/organizations/${data.id}`);
  return c.json({ data }, { status: 201 });
});

organization.get('/', validator('param', OrganizationParams), async (c) => {
  const params = c.req.valid('param');
  try {
    const data = await organizationGet(params);
    return c.json({ data });
  } catch (error) {
    const { message, status } = parseServerError(error);
    return c.json({ error: message }, { status });
  }
});
organization.patch(
  '/',
  validator('json', OrganizationUpdateInput),
  validator('param', OrganizationParams),
  async (c) => {
    const params = c.req.valid('param');
    const input = c.req.valid('json');
    const data = await organizationUpdate(params, input);
    return c.json({ data });
  },
);
organization.delete('/', validator('param', OrganizationParams), async (c) => {
  const params = c.req.valid('param');
  const data = await organizationDelete(params);
  return c.json({ data });
});
organization.get('/paths', validator('param', OrganizationParams), async (c) => {
  const params = c.req.valid('param');
  const data = await organizationPathList(params);
  return c.json({ data });
});

export { organization, organizations };

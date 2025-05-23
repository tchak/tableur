import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/valibot';
import * as v from 'valibot';

import { env } from '~/services/env';
import {
  openapi,
  OrganizationCreateInput,
  OrganizationParams,
  OrganizationUpdateInput,
} from './organization.contract';
import { client } from './router';

const organizations = new Hono();
const organization = new Hono();

organizations
  .get(
    '/',
    describeRoute({
      description: 'List organizations',
      responses: {
        200: {
          description: '',
          content: {
            'application/json': {
              schema: resolver(openapi.list),
            },
          },
        },
      },
      validateResponse: env.NODE_ENV == 'test',
    }),
    async (c) => {
      const data = await client.organization.list(
        {},
        { context: { request: c.req.raw } },
      );
      return c.json({ data, meta: { total: data.length } });
    },
  )
  .post('/', validator('json', OrganizationCreateInput), async (c) => {
    const input = c.req.valid('json');
    const data = await client.organization.create(input, {
      context: { request: c.req.raw },
    });
    c.header('Location', `/api/v1/organizations/${data.id}`);
    return c.json({ data }, { status: 201 });
  });

organization
  .get(
    '/',
    describeRoute({
      description: 'Find organization',
      responses: {
        200: {
          description: '',
          content: {
            'application/json': {
              schema: resolver(openapi.find),
            },
          },
        },
      },
      validateResponse: env.NODE_ENV == 'test',
    }),
    validator('param', OrganizationParams),
    async (c) => {
      const params = c.req.valid('param');
      const data = await client.organization.find(params, {
        context: { request: c.req.raw },
      });
      return c.json({ data });
    },
  )
  .patch(
    '/',
    validator('json', v.omit(OrganizationUpdateInput, ['organizationId'])),
    validator('param', OrganizationParams),
    async (c) => {
      const params = c.req.valid('param');
      const input = c.req.valid('json');
      await client.organization.update(
        { ...params, ...input },
        { context: { request: c.req.raw } },
      );
      return c.body(null, { status: 204 });
    },
  )
  .delete('/', validator('param', OrganizationParams), async (c) => {
    const params = c.req.valid('param');
    await client.organization.destroy(params, {
      context: { request: c.req.raw },
    });
    return c.body(null, { status: 204 });
  })
  .get('/paths', validator('param', OrganizationParams), async (c) => {
    const params = c.req.valid('param');
    const data = await client.organization.paths(params, {
      context: { request: c.req.raw },
    });
    return c.json({ data });
  });

export { organization, organizations };

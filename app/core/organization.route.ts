import { Hono } from 'hono';
import { validator } from 'hono-openapi/valibot';
import * as v from 'valibot';

import { describeRoute } from './openapi';
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
      output: openapi.list,
    }),
    async (c) => {
      const data = await client.organization.list(
        {},
        { context: { request: c.req.raw } },
      );
      return c.json({ data, meta: { total: data.length } });
    },
  )
  .post(
    '/',
    describeRoute({
      description: 'Create organizations',
      output: openapi.create,
    }),
    validator('json', OrganizationCreateInput),
    async (c) => {
      const input = c.req.valid('json');
      const data = await client.organization.create(input, {
        context: { request: c.req.raw },
      });
      c.header('Location', `/api/v1/organizations/${data.id}`);
      return c.json({ data }, { status: 201 });
    },
  );

organization
  .get(
    '/',
    describeRoute({
      description: 'Find organizations',
      output: openapi.find,
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

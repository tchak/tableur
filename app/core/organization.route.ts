import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/valibot';

import { auth, canAccess, checkOrganization } from '~/services/auth';
import { env } from '~/services/env';
import { handlePrismaError } from './error.types';
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
  OrganizationGetJSON,
  OrganizationListJSON,
  OrganizationParams,
  OrganizationUpdateInput,
} from './organization.types';

const organizations = new Hono();
const organization = new Hono();

organizations
  .use(auth)
  .get(
    '/',
    describeRoute({
      description: 'List organizations',
      responses: {
        200: {
          description: '',
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
      const { userId } = c.var;
      const data = await organizationList({ userId });
      return c.json({ data, meta: { total: data.length } });
    },
  )
  .post('/', validator('json', OrganizationCreateInput), async (c) => {
    const { userId } = c.var;
    const input = c.req.valid('json');
    const data = await organizationCreate({ userId }, input);
    c.header('Location', `/api/v1/organizations/${data.id}`);
    return c.json({ data }, { status: 201 });
  });

organization
  .use(auth, canAccess(checkOrganization))
  .get(
    '/',
    describeRoute({
      description: 'Get organization',
      responses: {
        200: {
          description: '',
          content: {
            'application/json': {
              schema: resolver(OrganizationGetJSON),
            },
          },
        },
      },
      validateResponse: env.NODE_ENV == 'test',
    }),
    validator('param', OrganizationParams),
    async (c) => {
      const params = c.req.valid('param');
      const data = await organizationGet(params).catch(handlePrismaError);
      return c.json({ data });
    },
  )
  .patch(
    '/',
    validator('json', OrganizationUpdateInput),
    validator('param', OrganizationParams),
    async (c) => {
      const params = c.req.valid('param');
      const input = c.req.valid('json');
      await organizationUpdate(params, input).catch(handlePrismaError);
      return c.body(null, { status: 204 });
    },
  )
  .delete('/', validator('param', OrganizationParams), async (c) => {
    const params = c.req.valid('param');
    const data = await organizationDelete(params).catch(handlePrismaError);
    return c.json({ data });
  })
  .get('/paths', validator('param', OrganizationParams), async (c) => {
    const params = c.req.valid('param');
    const data = await organizationPathList(params);
    return c.json({ data });
  });

export { organization, organizations };

import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/valibot';
import * as v from 'valibot';

import { env } from '~/services/env';
import {
  CommentCreateInput,
  CommentParams,
  RowParams,
  openapi,
} from './comment.contract';
import { client } from './router';

const comments = new Hono();
const comment = new Hono();

comments
  .get(
    '/',
    describeRoute({
      description: 'List comments',
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
    validator('param', RowParams),
    async (c) => {
      const params = c.req.valid('param');
      const data = await client.comment.list(params, {
        context: { request: c.req.raw },
      });
      return c.json({ data, meta: { total: data.length } });
    },
  )
  .post(
    '/',
    validator('param', RowParams),
    validator('json', v.omit(CommentCreateInput, ['rowId'])),
    async (c) => {
      const params = c.req.valid('param');
      const input = c.req.valid('json');
      const data = await client.comment.create(
        { ...params, ...input },
        { context: { request: c.req.raw } },
      );
      return c.json({ data }, { status: 201 });
    },
  );

comment.delete('/', validator('param', CommentParams), async (c) => {
  const params = c.req.valid('param');
  await client.comment.destroy(params, { context: { request: c.req.raw } });
  return c.body(null, { status: 204 });
});

export { comment, comments };

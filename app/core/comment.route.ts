import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/valibot';
import * as v from 'valibot';

import { env } from '~/services/env';
import {
  CommentCreateInput,
  CommentListJSON,
  CommentParams,
} from './comment.types';
import { client } from './router';
import { RowParams } from './row.types';

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
              schema: resolver(CommentListJSON),
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
    validator('param', CommentParams),
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
  await client.comment.delete(params, { context: { request: c.req.raw } });
  return c.body(null, { status: 204 });
});

export { comment, comments };

import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/valibot';

import { env } from '~/services/env';
import { commentCreate, commentDelete, commentList } from './comment.db';
import {
  CommentCreateInput,
  CommentListJSON,
  CommentParams,
} from './comment.types';
import { handlePrismaError } from './error.types';
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
      const data = await commentList(params);
      return c.json({ data, meta: { total: data.length } });
    },
  )
  .post(
    '/',
    validator('param', CommentParams),
    validator('json', CommentCreateInput),
    async (c) => {
      const params = c.req.valid('param');
      const input = c.req.valid('json');
      const data = await commentCreate(params, input).catch(handlePrismaError);
      return c.json({ data }, { status: 201 });
    },
  );

comment.delete('/', validator('param', CommentParams), async (c) => {
  const params = c.req.valid('param');
  const data = await commentDelete(params).catch(handlePrismaError);
  return c.json({ data });
});

export { comment, comments };

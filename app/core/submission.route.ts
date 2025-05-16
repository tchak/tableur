import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/valibot';

import { auth } from '~/services/auth';
import { env } from '~/services/env';
import { handlePrismaError } from './error.types';
import {
  submissionDelete,
  submissionGet,
  submissionList,
  submissionStart,
  submissionSubmit,
} from './submission.db';
import {
  StartParams,
  SubmissionGetJSON,
  SubmissionListJSON,
  SubmissionParams,
} from './submission.types';

const submissions = new Hono();
const submission = new Hono();
const start = new Hono();

submissions.use(auth).get(
  '/',
  describeRoute({
    description: 'List submissions',
    responses: {
      200: {
        description: '',
        content: {
          'application/json': {
            schema: resolver(SubmissionListJSON),
          },
        },
      },
    },
    validateResponse: env.NODE_ENV == 'test',
  }),
  async (c) => {
    const { userId } = c.var;
    const data = await submissionList({ userId });
    return c.json({ data, meta: { total: data.length } });
  },
);

submission
  .get(
    '/',
    describeRoute({
      description: 'Get submission',
      responses: {
        200: {
          description: '',
          content: {
            'application/json': {
              schema: resolver(SubmissionGetJSON),
            },
          },
        },
      },
      validateResponse: env.NODE_ENV == 'test',
    }),
    validator('param', SubmissionParams),
    async (c) => {
      const params = c.req.valid('param');
      const data = await submissionGet(params).catch(handlePrismaError);
      return c.json({ data });
    },
  )
  .delete('/', validator('param', SubmissionParams), async (c) => {
    const params = c.req.valid('param');
    const data = await submissionDelete(params).catch(handlePrismaError);
    return c.json({ data });
  })
  .post('/', validator('param', SubmissionParams), async (c) => {
    const params = c.req.valid('param');
    const data = await submissionSubmit(params).catch(handlePrismaError);
    return c.json({ data });
  });

start.use(auth).post(':path', validator('param', StartParams), async (c) => {
  const { userId } = c.var;
  const params = c.req.valid('param');
  const data = await submissionStart({ userId }, params).catch(
    handlePrismaError,
  );
  return c.json({ data }, { status: 201 });
});

export { start, submission, submissions };

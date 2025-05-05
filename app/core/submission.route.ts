import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/valibot';

import { env } from '../services/env';
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

submissions.get(
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
    const data = await submissionList();
    return c.json({ data, meta: { total: data.length } });
  }
);

submission.get(
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
  }
);

submission.delete('/', validator('param', SubmissionParams), async (c) => {
  const params = c.req.valid('param');
  const data = await submissionDelete(params).catch(handlePrismaError);
  return c.json({ data });
});

submission.post('/', validator('param', SubmissionParams), async (c) => {
  const params = c.req.valid('param');
  const data = await submissionSubmit(params).catch(handlePrismaError);
  return c.json({ data });
});

start.post(':path', validator('param', StartParams), async (c) => {
  const params = c.req.valid('param');
  const data = await submissionStart(params).catch(handlePrismaError);
  return c.json({ data }, { status: 201 });
});

export { start, submission, submissions };

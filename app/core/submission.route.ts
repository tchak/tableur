import { Hono } from 'hono';
import { validator } from 'hono-openapi/valibot';

import { describeRoute } from './openapi';
import { client } from './router';
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
    output: SubmissionListJSON,
  }),
  async (c) => {
    const data = await client.submission.list(
      {},
      { context: { request: c.req.raw } },
    );
    return c.json({ data, meta: { total: data.length } });
  },
);

submission
  .get(
    '/',
    describeRoute({
      description: 'Find submission',
      output: SubmissionGetJSON,
    }),
    validator('param', SubmissionParams),
    async (c) => {
      const params = c.req.valid('param');
      const data = await client.submission.get(params, {
        context: { request: c.req.raw },
      });
      return c.json({ data });
    },
  )
  .delete('/', validator('param', SubmissionParams), async (c) => {
    const params = c.req.valid('param');
    await client.submission.delete(params, {
      context: { request: c.req.raw },
    });
    return c.body(null, { status: 204 });
  })
  .post('/', validator('param', SubmissionParams), async (c) => {
    const params = c.req.valid('param');
    const data = await client.submission.submit(params, {
      context: { request: c.req.raw },
    });
    return c.json({ data });
  });

start.post(':path', validator('param', StartParams), async (c) => {
  const params = c.req.valid('param');
  const data = await client.submission.start(params, {
    context: { request: c.req.raw },
  });
  return c.json({ data }, { status: 201 });
});

export { start, submission, submissions };

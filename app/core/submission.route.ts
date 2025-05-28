import { Hono } from 'hono';
import { validator } from 'hono-openapi/valibot';

import { describeRoute } from './openapi';
import { client } from './router';
import { StartParams, SubmissionParams, openapi } from './submission.contract';

const submissions = new Hono();
const submission = new Hono();
const start = new Hono();

submissions.get(
  '/',
  describeRoute({
    description: 'List submissions',
    output: openapi.list,
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
      output: openapi.find,
    }),
    validator('param', SubmissionParams),
    async (c) => {
      const params = c.req.valid('param');
      const data = await client.submission.find(params, {
        context: { request: c.req.raw },
      });
      return c.json({ data });
    },
  )
  .delete('/', validator('param', SubmissionParams), async (c) => {
    const params = c.req.valid('param');
    await client.submission.destroy(params, {
      context: { request: c.req.raw },
    });
    return c.body(null, { status: 204 });
  })
  .post(
    '/',
    describeRoute({
      description: 'Submit submission',
      output: openapi.submit,
    }),
    validator('param', SubmissionParams),
    async (c) => {
      const params = c.req.valid('param');
      const data = await client.submission.submit(params, {
        context: { request: c.req.raw },
      });
      return c.json({ data });
    },
  );

start.post(
  ':path',
  describeRoute({
    description: 'Start submission',
    output: openapi.start,
  }),
  validator('param', StartParams),
  async (c) => {
    const params = c.req.valid('param');
    const data = await client.submission.start(params, {
      context: { request: c.req.raw },
    });
    return c.json({ data }, { status: 201 });
  },
);

export { start, submission, submissions };

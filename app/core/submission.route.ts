import { Hono } from 'hono';
import { validator } from 'hono-openapi/valibot';

import {
  submissionDelete,
  submissionGet,
  submissionList,
  submissionStart,
  submissionSubmit,
} from './submission.db';
import { StartParams, SubmissionParams } from './submission.types';

const submissions = new Hono();
const submission = new Hono();
const start = new Hono();

submissions.get('/', async (c) => {
  const data = await submissionList();
  return c.json({ data, meta: { total: data.length } });
});

submission.get('/', validator('param', SubmissionParams), async (c) => {
  const params = c.req.valid('param');
  const data = await submissionGet(params);
  return c.json({ data });
});

submission.delete('/', validator('param', SubmissionParams), async (c) => {
  const params = c.req.valid('param');
  const data = await submissionDelete(params);
  return c.json({ data });
});

submission.post('/', validator('param', SubmissionParams), async (c) => {
  const params = c.req.valid('param');
  const data = await submissionSubmit(params);
  return c.json({ data });
});

start.post(':path', validator('param', StartParams), async (c) => {
  const params = c.req.valid('param');
  const data = await submissionStart(params);
  return c.json({ data });
});

export { start, submission, submissions };

import { Hono } from 'hono';

import { client } from './router';

const imports = new Hono();

imports.post('/', async (c) => {
  const blob = await c.req.blob();
  const file = new File([blob], 'preview.csv', { type: 'text/csv' });
  const data = await client.import.preview(
    { file },
    { context: { request: c.req.raw } },
  );
  return c.json({ data }, { status: 201 });
});

export { imports };

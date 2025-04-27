import { Hono } from 'hono';

import { importPreview } from './import.db';

const imports = new Hono();

imports.post('/', async (c) => {
  const blob = await c.req.blob();
  const file = new File([blob], 'preview.csv', { type: 'text/csv' });
  const data = await importPreview({ file });
  return c.json({ data }, { status: 201 });
});

export { imports };

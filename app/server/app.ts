import { Hono } from 'hono';
import { logger } from 'hono/logger';

import { env } from '../services/env';
import { router } from '../services/storage';
import { api } from './api';

const app = new Hono();

if (env.NODE_ENV != 'test') {
  app.use(logger());
}
app.route('/api/v1', api);
app.route('storage', router);

export { app };

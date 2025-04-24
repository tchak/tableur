import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { requestId } from 'hono/request-id';
import { timing } from 'hono/timing';

import { env } from '../services/env';
import { router } from '../services/storage';
import { api } from './api';

const app = new Hono();

app.use(requestId());
if (env.NODE_ENV != 'test') {
  app.use(logger());
  app.use(timing());
}
if (env.NODE_ENV == 'development') {
  api.use(prettyJSON());
}
app.route('/api/v1', api);
app.route('storage', router);

export { app };

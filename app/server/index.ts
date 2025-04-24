import { Scalar } from '@scalar/hono-api-reference';
import { generateSpecs, openAPISpecs } from 'hono-openapi';
import { showRoutes } from 'hono/dev';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { timing } from 'hono/timing';

import { start } from '../services/boss';
import { env } from '../services/env';
import { app } from './app';

app.get('/openapi', openAPISpecs(app));
app.get('/api/docs', Scalar({ theme: 'saturn', url: '/openapi' }));

await start();

app.use(logger());
app.use(timing());

if (env.NODE_ENV == 'development') {
  app.use(prettyJSON());
  generateSpecs(app).then((spec) => {
    Bun.write('openapi.json', JSON.stringify(spec, null, 2));
  });
  showRoutes(app);
}

export default app;

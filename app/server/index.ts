import { Scalar } from '@scalar/hono-api-reference';
import { generateSpecs, openAPISpecs } from 'hono-openapi';
import { showRoutes } from 'hono/dev';
import { start } from '../services/boss';
import { env } from '../services/env';
import { app } from './app';

app.get('/openapi', openAPISpecs(app));
app.get('/api/docs', Scalar({ theme: 'saturn', url: '/openapi' }));

await start();

if (env.NODE_ENV == 'development') {
  generateSpecs(app).then((spec) => {
    Bun.write('openapi.json', JSON.stringify(spec, null, 2));
  });
  showRoutes(app);
}

export default app;

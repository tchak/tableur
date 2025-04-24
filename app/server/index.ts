import { Scalar } from '@scalar/hono-api-reference';
import { openAPISpecs } from 'hono-openapi';
import { showRoutes } from 'hono/dev';
import { start } from '../services/boss';
import { app } from './app';

app.get('/openapi', openAPISpecs(app));
app.get('/api/docs', Scalar({ theme: 'saturn', url: '/openapi' }));

await start();
showRoutes(app);

export default app;

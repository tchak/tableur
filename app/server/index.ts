import { showRoutes } from 'hono/dev';
import { start } from '../services/boss';
import { app } from './app';

await start();
showRoutes(app);

export default app;

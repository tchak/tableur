import { Hono } from 'hono';
import { requestId } from 'hono/request-id';

import { router } from '../services/storage';
import { api } from './api';

const app = new Hono();

app.use(requestId());
app.route('/api/v1', api);
app.route('storage', router);

export { app };

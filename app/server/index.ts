import { Scalar } from '@scalar/hono-api-reference';
import { generateSpecs, openAPISpecs } from 'hono-openapi';
import { showRoutes } from 'hono/dev';
import { prettyJSON } from 'hono/pretty-json';
import { requestId } from 'hono/request-id';
import { timing } from 'hono/timing';
import { createHonoServer } from 'react-router-hono-server/bun';

import { router } from '~/lib/storage';
import { api } from './api';

const isDev = import.meta.env.MODE == 'development';

export default await createHonoServer({
  configure(app) {
    app.route('api/v1', api);
    app.route('storage', router);

    app.get('api/schema', openAPISpecs(api));
    app.get('api/docs', Scalar({ theme: 'saturn', url: '/api/schema' }));

    if (isDev) {
      generateSpecs(api).then((spec) => {
        Bun.write('openapi.json', JSON.stringify(spec, null, 2));
      });
      showRoutes(app);
    }
  },
  beforeAll(app) {
    app.use(timing());
    app.use(requestId());
    if (isDev) {
      app.use('api/v1', prettyJSON());
    }
  },
});

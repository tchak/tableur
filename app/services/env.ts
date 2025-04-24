import * as v from 'valibot';
import { createEnv } from 'valibot-env';

export const env = createEnv({
  schema: {
    private: {
      DATABASE_URL: v.string(),
      STORAGE_SECRET_KEY: v.string(),
      STORAGE_HOSTNAME: v.pipe(v.string(), v.url()),
    },
    shared: {
      NODE_ENV: v.fallback(v.picklist(['development', 'production', 'test']), 'development'),
    },
  },
  values: import.meta.env,
});

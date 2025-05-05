import * as v from 'valibot';
import { createEnv } from 'valibot-env';

const isPrivate = typeof window === 'undefined';

export const env = createEnv({
  isPrivate,
  schema: {
    private: {
      DATABASE_URL: v.string(),
      STORAGE_SECRET_KEY: v.string(),
      STORAGE_HOSTNAME: v.pipe(v.string(), v.url()),
      NODE_ENV: v.fallback(
        v.picklist(['development', 'production', 'test']),
        'development'
      ),
    },
  },
  values: isPrivate ? process.env : import.meta.env,
});

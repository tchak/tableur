import KeyvPostgres from '@keyv/postgres';
import { Cacheable } from 'cacheable';

import { env } from './env';

const secondary = new KeyvPostgres({
  uri: env.DATABASE_URL,
  schema: 'keyv',
  useUnloggedTable: true,
});
const cache = new Cacheable({ secondary, nonBlocking: false, ttl: '1d' });

export { cache };

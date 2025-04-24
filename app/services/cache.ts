import { Cacheable } from 'cacheable';

const cache = new Cacheable({ ttl: '1day' });

export { cache };

import { createRouterClient } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';

import { router as comment } from './comment';
import { router as form } from './form.db';
import { router as import_ } from './import.db';
import { router as organization } from './organization';
import { router as row } from './row.db';
import { router as submission } from './submission.db';
import { router as table } from './table.db';

export const router = {
  organization,
  table,
  row,
  form,
  submission,
  comment,
  import: import_,
};
export const client = createRouterClient(router, {
  context: (context) => context,
});
export const handler = new RPCHandler(router);

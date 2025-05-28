import { createRouterClient } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';

import { router as comment } from './comment';
import { router as form } from './form';
import { router as organization } from './organization';
import { router as row } from './row';
import { router as submission } from './submission';
import { router as table } from './table';

export const router = {
  organization,
  table,
  row,
  form,
  submission,
  comment,
};
export const client = createRouterClient(router, {
  context: (context) => context,
});
export const handler = new RPCHandler(router);

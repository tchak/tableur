import { createRouterClient } from '@orpc/server';

import { router as comment } from './comment.db';
import { router as form } from './form.db';
import { router as import_ } from './import.db';
import { router as organization } from './organization';
import { router as row } from './row.db';
import { router as submission } from './submission.db';
import { router as table } from './table.db';

export const router = {
  organization,
  form,
  comment,
  table,
  submission,
  row,
  import: import_,
};
export const client = createRouterClient(router, {
  context: (context) => context,
});

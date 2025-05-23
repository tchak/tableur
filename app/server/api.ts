import { toORPCError } from '@orpc/client';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { secureHeaders } from 'hono/secure-headers';

import { comment, comments } from '~/core/comment.route';
import { form, forms } from '~/core/form.route';
import { imports } from '~/core/import.route';
import { organization, organizations } from '~/core/organization.route';
import { row, rows } from '~/core/row.route';
import { start, submission, submissions } from '~/core/submission.route';
import { table, tables } from '~/core/table.route';

const api = new Hono();

api.onError((err) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  } else {
    const error = toORPCError(err);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new HTTPException((error.status as any) ?? 500, {
      message: err.message,
      cause: err,
    }).getResponse();
  }
});

api.use(cors({ origin: '*' }));
api.use(secureHeaders());

organization.route('tables', tables);
organizations.route(':organizationId', organization);

comments.route(':commentId', comment);
submissions.route(':submissionId', submission);

row.route('comments', comments);
rows.route(':rowId', row);

table.route('rows', rows);
table.route('forms', forms);

api.route('organizations', organizations);
api.route('tables/:tableId', table);
api.route('forms/:formId', form);
api.route('imports', imports);
api.route('submissions', submissions);
api.route('start', start);

export { api };

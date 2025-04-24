import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

import { form, forms } from '../core/form.route';
import { organization, organizations } from '../core/organization.route';
import { row, rows } from '../core/row.route';
import { start, submission, submissions } from '../core/submission.route';
import { table, tables } from '../core/table.route';

const api = new Hono();

api.use(secureHeaders());
api.use(prettyJSON());

organization.route('tables', tables);
organizations.route(':organizationId', organization);

submissions.route(':submissionId', submission);
forms.route(':formId', form);
rows.route(':rowId', row);
table.route('rows', rows);
table.route('forms', forms);

api.route('organizations', organizations);
api.route('tables/:tableId', table);
api.route('submissions', submissions);
api.route('start', start);

export { api };

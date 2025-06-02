import { href, Outlet } from 'react-router';
import { parseWithValibot } from '@conform-to/valibot';

import type { Route } from './+types/organization';
import { getSession } from '~/middleware/session';
import { breadcrumb } from '~/components/ui/breadcrumbs';
import { OrganizationParams } from '~/core/organization.contract';

export const handle = {
  ...breadcrumb(() => ({
    title: 'Organizations',
    path: href('/organizations'),
  })),
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData();
  const submission = parseWithValibot(formData, { schema: OrganizationParams });
  if (submission.status == 'success') {
    const session = getSession(context);
    session.set('organizationId', submission.value.organizationId);
  }
};

export default function RouteComponent() {
  return <Outlet />;
}

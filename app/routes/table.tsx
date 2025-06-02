import { Outlet, href } from 'react-router';

import { breadcrumb } from '~/components/ui/breadcrumbs';

export const handle = {
  ...breadcrumb(() => ({
    title: 'Tables',
    path: href('/tables'),
  })),
};

export default function RouteComponent() {
  return <Outlet />;
}

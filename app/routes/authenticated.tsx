import { Outlet } from 'react-router';

import type { Route } from './+types/layout';
import { Header } from '~/components/ui/header';
import { getUser } from '~/middleware/session';
import { authenticatedMiddleware } from '~/middleware/session';
import { pages } from './layout';

export const unstable_middleware = [authenticatedMiddleware];

export const loader = ({ context }: Route.LoaderArgs) => {
  const user = getUser(context);
  return { user };
};

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <div className="bg-background relative flex h-dvh w-full flex-col overflow-hidden">
      <Header items={pages(true)} user={loaderData.user} />
      <main className="container mx-auto mt-8">
        <Outlet />
      </main>
    </div>
  );
}

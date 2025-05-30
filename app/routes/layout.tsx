import { Outlet } from 'react-router';

import type { Route } from './+types/layout';
import { Header } from '~/components/ui/header';
import { getMaybeUser } from '~/middleware/session';

export function pages(isAuthenticated: boolean) {
  if (isAuthenticated) {
    return [{ href: '/tables', label: 'Tables' }];
  }
  return [{ href: '/about', label: 'About' }];
}

export const loader = ({ context }: Route.LoaderArgs) => {
  const user = getMaybeUser(context);
  return { user };
};

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <div className="bg-background relative flex h-dvh w-full flex-col overflow-hidden">
      <Header items={pages(!!loaderData.user)} user={loaderData.user} />
      <main className="container mx-auto flex flex-1 flex-col items-center justify-center overflow-hidden px-8">
        <Outlet />
      </main>
    </div>
  );
}

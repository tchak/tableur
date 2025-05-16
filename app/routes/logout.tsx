import { redirect } from 'react-router';

import type { Route } from './+types/logout';
import { sessionStorage } from '~/services/session';

import { authenticatedMiddleware, getSession } from '~/middleware/session';
export const unstable_middleware = [authenticatedMiddleware];

export const loader = async ({ context }: Route.LoaderArgs) => {
  const session = getSession(context);

  return redirect('/', {
    headers: { 'set-cookie': await sessionStorage.destroySession(session) },
  });
};

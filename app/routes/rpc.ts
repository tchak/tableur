import { handler } from '~/core/router';
import { getMaybeUser } from '~/middleware/session';
import type { Route } from './+types/rpc';

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const user = getMaybeUser(context);
  const { response, matched } = await handler.handle(request, {
    prefix: '/rpc',
    context: { user, request },
  });

  if (matched) {
    return response;
  }

  return new Response('Not Found', { status: 404 });
};

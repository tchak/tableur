import { RPCHandler } from '@orpc/server/fetch';

import { router } from '~/core/router';
import { getMaybeUser } from '~/middleware/session';
import type { Route } from './+types/rpc';

const handler = new RPCHandler(router);

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

import type {
  unstable_MiddlewareFunction,
  unstable_RouterContextProvider,
} from 'react-router';
import { redirect, unstable_createContext } from 'react-router';

import { findUser, type User } from '~/services/auth';
import { sessionStorage, type Session } from '~/services/session';

const sessionContext = unstable_createContext<Session>();
const maybeUserContext = unstable_createContext<User | null>();
const userContext = unstable_createContext<User>();

export const sessionMiddleware: unstable_MiddlewareFunction<Response> = async (
  { request, context },
  next,
) => {
  const session = await sessionStorage.getSession(
    request.headers.get('cookie'),
  );

  context.set(sessionContext, session);

  const userId = session.get('userId');
  if (userId) {
    const user = await findUser(userId, session.get('organizationId'));
    context.set(maybeUserContext, user);
  } else {
    context.set(maybeUserContext, null);
  }

  const response = await next();

  if (!response.headers.has('set-cookie')) {
    response.headers.set(
      'set-cookie',
      await sessionStorage.commitSession(session),
    );
  }

  return response;
};

export const authenticatedMiddleware: unstable_MiddlewareFunction<
  Response
> = async ({ context }, next) => {
  const user = context.get(maybeUserContext);

  if (!user) {
    throw redirect('/login');
  }

  context.set(userContext, user);
  return next();
};

export const unauthenticatedMiddleware: unstable_MiddlewareFunction<
  Response
> = async ({ context }, next) => {
  const user = context.get(maybeUserContext);

  if (user) {
    throw redirect('/');
  }

  return next();
};

export function getSession(context: unstable_RouterContextProvider) {
  return context.get(sessionContext);
}

export function getMaybeUser(context: unstable_RouterContextProvider) {
  return context.get(maybeUserContext);
}

export function getUser(context: unstable_RouterContextProvider) {
  return context.get(userContext);
}

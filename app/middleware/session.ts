import type {
  unstable_MiddlewareFunction,
  unstable_RouterContextProvider,
} from 'react-router';
import { redirect, unstable_createContext } from 'react-router';

import { prisma } from '~/services/db';
import { sessionStorage, type Session } from '~/services/session';

interface User {
  id: string;
  email: string;
  organization: {
    id: string;
    name: string;
  } | null;
}

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
    const user = await findUser({
      userId,
      organizationId: session.get('organizationId') ?? null,
    });
    context.set(maybeUserContext, user);
  } else {
    context.set(maybeUserContext, null);
  }

  const response = await next();

  response.headers.set(
    'Set-Cookie',
    await sessionStorage.commitSession(session),
  );

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

async function findUser({
  userId,
  organizationId,
}: {
  userId: string;
  organizationId: string | null;
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      organizations: {
        orderBy: { organization: { createdAt: 'asc' } },
        where: { deletedAt: null, organization: { deletedAt: null } },
        select: { organization: { select: { id: true, name: true } } },
      },
    },
  });
  if (!user) {
    return null;
  }
  const organizations = user.organizations.map(
    ({ organization }) => organization,
  );
  const organization =
    (organizationId
      ? organizations.find(({ id }) => id === organizationId)
      : null) ??
    organizations.at(0) ??
    null;
  return { id: user.id, email: user.email, organization };
}

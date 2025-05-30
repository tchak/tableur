import { onError, ORPCError, os } from '@orpc/server';
import { createPermix, type Permix } from 'permix';
import { Prisma } from '~/generated/prisma';

import { permissions, type Definition, type User } from './auth';
import { verifyAuthHeader } from './jwt';

export interface Context {
  request?: Request;
  user?: User | null;
}

function handleError(error: Error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2025':
      case 'P2015':
        throw new ORPCError('NOT_FOUND', {
          message: error.message,
          cause: error.cause,
        });
      case 'P1008':
        throw new ORPCError('TIMEOUT', {
          message: error.message,
          cause: error.cause,
        });
    }
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: error.message,
      cause: error.cause,
    });
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: error.message,
      cause: error.cause,
    });
  }
}

const base = os.$context<Context>().errors({ UNAUTHORIZED: {}, FORBIDDEN: {} });

const baseMiddleware = base
  .middleware(async ({ context, next, errors }) => {
    if (context.user) {
      return next();
    }
    const header = context.request?.headers?.get('authorization');

    if (header) {
      const user = await verifyAuthHeader(header);
      if (user) {
        return next({ context: { user } });
      } else {
        throw errors.UNAUTHORIZED();
      }
    }

    return next({ context: { user: null } });
  })
  .concat(onError(handleError));

export const permittedMiddleware = baseMiddleware.concat(
  base.middleware(async ({ context, next, errors }) => {
    let permissionChecked = false;
    const permix = createPermix(permissions(context.user ?? null));
    const check: Permix<Definition>['check'] = (...params) => {
      permissionChecked = true;
      const hasPermission = permix.check(...params);
      if (!hasPermission) {
        throw errors.FORBIDDEN();
      }
      return true;
    };
    const result = await next({ context: { check } });

    if (!permissionChecked) {
      throw errors.FORBIDDEN();
    }

    return result;
  }),
);

export const authenticatedMiddleware = permittedMiddleware.concat(
  base.middleware(({ context, next, errors }) => {
    if (context.user) {
      return next({ context: { user: context.user } });
    }
    throw errors.UNAUTHORIZED();
  }),
);

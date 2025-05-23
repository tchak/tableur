import { onError, os } from '@orpc/server';
import type { Permix } from 'permix';
import { createPermix } from 'permix';
import { Prisma } from '~/generated/prisma';

import { permissions, type Definition, type User } from './auth';
import { verifyAuthHeader } from './jwt';

export interface Context {
  request?: Request;
  user: User | null;
}

export const base = os
  .$context<Context>()
  .errors({
    UNAUTHORIZED: {},
    NOT_FOUND: {},
    INTERNAL_SERVER_ERROR: {},
    TIMEOUT: {},
    FORBIDDEN: {},
  })
  .use(
    onError((error, { errors }) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2025':
          case 'P2015':
            throw errors.NOT_FOUND({
              message: error.message,
              cause: error.cause,
            });
          case 'P1008':
            throw errors.TIMEOUT({
              message: error.message,
              cause: error.cause,
            });
        }
        throw errors.INTERNAL_SERVER_ERROR({
          message: error.message,
          cause: error.cause,
        });
      } else if (error instanceof Prisma.PrismaClientValidationError) {
        throw errors.INTERNAL_SERVER_ERROR({
          message: error.message,
          cause: error.cause,
        });
      }
    }),
  )
  .use(async ({ context, next, errors }) => {
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
  .use(async ({ context, next, errors }) => {
    let permissionChecked = false;
    const permix = createPermix(permissions(context.user));
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
  });

export const authenticated = base.use(({ context, next, errors }) => {
  if (context.user) {
    return next({ context: { user: context.user } });
  }
  throw errors.UNAUTHORIZED();
});

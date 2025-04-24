import { HTTPException } from 'hono/http-exception';
import { Prisma } from '../generated/prisma';

export function handlePrismaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2025':
      case 'P2015':
        throw new HTTPException(404, { message: error.message, cause: error.cause });
      case 'P1008':
        throw new HTTPException(408, { message: error.message, cause: error.cause });
    }
    throw new HTTPException(500, { message: error.message, cause: error.cause });
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    throw new HTTPException(500, { message: error.message, cause: error.cause });
  }
  throw new HTTPException(500, { message: 'Internal Server Error', cause: error });
}

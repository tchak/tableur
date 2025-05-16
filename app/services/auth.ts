import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { jwtVerify, SignJWT } from 'jose';

import { prisma } from './db';
import { env } from './env';

export interface Env {
  Variables: {
    userId: string;
  };
}

export const auth = createMiddleware<Env>(async (c, next) => {
  const header = c.req.header('authorization');
  if (header) {
    const token = extractBearerToken(header);
    const userId = await verifyAuthToken(token);
    c.set('userId', userId);
  }
  return next();
});

interface AuthParams {
  organizationId?: string;
  tableId?: string;
  formId?: string;
}

export const canAccess = (
  check: (userId: string, params: AuthParams) => Promise<boolean>,
) =>
  createMiddleware<Env>(async (c, next) => {
    const { userId } = c.var;
    if (!userId) {
      throw new HTTPException(401, { message: 'Unauthorized' });
    }
    const ok = await check(userId, c.req.param());
    if (ok) {
      return next();
    }
    throw new HTTPException(403, { message: 'Forbidden' });
  });

export async function checkOrganization(userId: string, params: AuthParams) {
  if (!params.organizationId) {
    throw new HTTPException(400, { message: 'Missing organizationId' });
  }
  const ok = await prisma.organizationMembership.findUnique({
    where: {
      userId_organizationId: { userId, organizationId: params.organizationId },
      deletedAt: null,
      organization: { deletedAt: null },
      user: { deletedAt: null },
    },
    select: { organizationId: true },
  });
  return !!ok;
}

export async function checkTable(userId: string, params: AuthParams) {
  if (!params.tableId) {
    throw new HTTPException(400, { message: 'Missing tableId' });
  }
  const ok = await prisma.table.findUnique({
    where: {
      id: params.tableId,
      deletedAt: null,
      organization: { deletedAt: null, users: { some: { userId } } },
    },
    select: { id: true },
  });
  return !!ok;
}

export async function checkForm(userId: string, params: AuthParams) {
  if (!params.formId) {
    throw new HTTPException(400, { message: 'Missing formId' });
  }
  const ok = await prisma.form.findUnique({
    where: {
      id: params.formId,
      deletedAt: null,
      table: {
        deletedAt: null,
        organization: { deletedAt: null, users: { some: { userId } } },
      },
    },
    select: { id: true },
  });
  return !!ok;
}

export async function createAuthToken(userId: string, expires = '200 days') {
  const authToken = await prisma.authToken.create({
    data: { userId },
    select: { id: true },
  });
  return createJWT(userId, {
    jti: authToken.id,
    issuer: 'urn:solaris:server',
    audience: 'urn:solaris:server',
    expires,
  });
}

function extractBearerToken(header: string) {
  const tokenMatch = header.match(/^Bearer\s+(.+)$/);
  if (!tokenMatch || !tokenMatch[1]) {
    throw new HTTPException(400, {
      message: 'Invalid Authorization header format',
    });
  }
  return tokenMatch[1];
}

export async function verifyAuthToken(token: string): Promise<string> {
  const payload = await verifyJWT(token, {
    issuer: 'urn:solaris:server',
    audience: 'urn:solaris:server',
    maxTokenAge: '1 year',
  });
  const authToken = await prisma.authToken.findUnique({
    where: {
      id: payload.jti,
      user: { id: payload.subject, deletedAt: null },
    },
    select: { userId: true },
  });
  if (authToken) {
    return authToken.userId;
  }
  throw new HTTPException(401, { message: 'Unauthorized' });
}

const secret = new TextEncoder().encode(env.JWT_SECRET_KEY);
const alg = 'HS256';

async function createJWT(
  subject: string,
  {
    jti,
    issuer,
    audience,
    expires,
  }: {
    jti: string;
    issuer: string;
    audience: string;
    expires: string;
  },
) {
  const jwt = new SignJWT()
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setJti(jti)
    .setSubject(subject)
    .setAudience(audience)
    .setIssuer(issuer)
    .setExpirationTime(expires);
  return jwt.sign(secret);
}

async function verifyJWT(
  token: string,
  options: { audience: string; issuer: string; maxTokenAge: string },
): Promise<{ subject: string; jti: string }> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      ...options,
      algorithms: [alg],
    });
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return { subject: payload.sub!, jti: payload.jti! };
  } catch (error) {
    throw new HTTPException(401, { message: 'Unauthorized', cause: error });
  }
}

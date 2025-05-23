import { jwtVerify, SignJWT } from 'jose';

import { findUser, type User } from './auth';
import { prisma } from './db';
import { env } from './env';

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

export async function verifyAuthHeader(header: string): Promise<User | null> {
  const token = extractBearerToken(header);
  if (token) {
    return verifyAuthToken(token);
  }
  return null;
}

export async function verifyAuthToken(token: string): Promise<User | null> {
  const payload = await verifyJWT(token, {
    issuer: 'urn:solaris:server',
    audience: 'urn:solaris:server',
    maxTokenAge: '1 year',
  });
  if (!payload) {
    return null;
  }
  const authToken = await prisma.authToken.findUnique({
    where: {
      id: payload.jti,
      user: { id: payload.subject, deletedAt: null },
    },
    select: { userId: true },
  });
  if (authToken) {
    return findUser(authToken.userId);
  }
  return null;
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
): Promise<{ subject: string; jti: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      ...options,
      algorithms: [alg],
    });
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return { subject: payload.sub!, jti: payload.jti! };
  } catch {
    return null;
  }
}

function extractBearerToken(header: string) {
  const tokenMatch = header.match(/^Bearer\s+(.+)$/);
  if (!tokenMatch || !tokenMatch[1]) {
    return null;
  }
  return tokenMatch[1];
}

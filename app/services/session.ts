import {
  createSessionStorage,
  type FlashSessionData,
  type Session as RRSession,
} from 'react-router';

import { maxAge, now } from '~/utils';
import { prisma } from './db';
import { env } from './env';

interface Data {
  userId?: string;
  email?: string;
  organizationId?: string;
}

interface FlashData {
  email?: string;
}

export type Session = RRSession<Data, FlashData>;

export const sessionStorage = createSessionStorage<Data, FlashData>({
  cookie: {
    name: '__session',
    httpOnly: true,
    maxAge: maxAge('1 month'),
    path: '/',
    sameSite: 'lax',
    secrets: [env.SESSION_SECRET_KEY],
    secure: env.NODE_ENV == 'production',
  },
  async readData(id) {
    const session = await prisma.session.findUnique({
      where: { id, expiresAt: { gt: now() } },
      select: { data: true, userId: true },
    });
    if (session) {
      const data = session.data as FlashSessionData<Data, FlashData>;
      if (session.userId) {
        data.userId = session.userId;
      }
      return data;
    }
    return null;
  },
  async createData(data, expires) {
    const session = await prisma.session.create({
      data: data.userId
        ? {
            data,
            userId: data.userId,
            expiresAt: expires,
          }
        : { data, expiresAt: expires },
      select: { id: true },
    });
    return session.id;
  },
  async updateData(id, data, expires) {
    await prisma.session.update({
      where: { id },
      data: data.userId
        ? { data, userId: data.userId, expiresAt: expires }
        : { data, expiresAt: expires },
    });
  },
  async deleteData(id) {
    await prisma.session.delete({ where: { id } });
  },
});

import { prisma } from '~/services/db';
import type { UserCreateInput, UserJSON } from './user.types';

export function userCreate({ email }: UserCreateInput): Promise<UserJSON> {
  return prisma.user.create({
    data: { email },
    select: { id: true, email: true },
  });
}

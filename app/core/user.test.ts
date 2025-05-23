import { findUser } from '~/services/auth';
import { prisma } from '~/services/db';
import { createAuthToken } from '~/services/jwt';

export async function createTestUser() {
  const organizationId = crypto.randomUUID();
  const { id: userId } = await prisma.user.create({
    data: {
      email: 'test@example.com',
      organizations: {
        create: {
          organization: {
            create: {
              id: organizationId,
              name: 'Test Organization',
            },
          },
        },
      },
    },
    select: { id: true },
  });
  const token = await createAuthToken(userId);
  const user = await findUser(userId);
  return { userId, organizationId, authorization: `Bearer ${token}`, user };
}

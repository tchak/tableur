import { findUser } from '~/lib/auth';
import { prisma } from '~/lib/db';
import { createAuthToken } from '~/lib/jwt';

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

import { implement } from '@orpc/server';

import { prisma } from '~/services/db';
import { authenticatedMiddleware } from '~/services/rpc';
import { contract } from './organization.contract';

const os = implement(contract).use(authenticatedMiddleware);

const find = os.find.handler(({ context, input }) => {
  context.check('organization', 'read', input);
  return prisma.organization.findUniqueOrThrow({
    where: { id: input.organizationId, deletedAt: null },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
});

const list = os.list.handler(({ context }) => {
  context.check('organization', 'list');
  return prisma.organization.findMany({
    where: {
      deletedAt: null,
      users: { some: { userId: context.user.id, deletedAt: null } },
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
});

const create = os.create.handler(({ input: { name }, context }) => {
  context.check('organization', 'create');
  return prisma.organization.create({
    data: {
      name,
      users: { create: { userId: context.user.id } },
    },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });
});

const update = os.update.handler(async ({ context, input }) => {
  context.check('organization', 'write', input);
  const { organizationId, ...data } = input;
  await prisma.organization.update({
    where: { id: organizationId, deletedAt: null },
    data,
    select: { id: true },
  });
});

const destroy = os.destroy.handler(async ({ context, input }) => {
  context.check('organization', 'write', input);
  await prisma.organization.update({
    where: { id: input.organizationId, deletedAt: null },
    data: { deletedAt: new Date() },
    select: { id: true },
  });
});

const paths = os.paths.handler(({ context, input }) => {
  context.check('organization', 'read', input);
  return prisma.formPath.findMany({
    where: {
      organization: { id: input.organizationId, deletedAt: null },
    },
    take: 100,
    select: {
      path: true,
      form: {
        select: { id: true, name: true, description: true },
        where: { deletedAt: null, table: { deletedAt: null } },
      },
    },
  });
});

export const router = os.router({
  find,
  list,
  create,
  update,
  destroy,
  paths,
});

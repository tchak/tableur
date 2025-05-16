import * as v from 'valibot';
import { prisma } from '~/services/db';

import type {
  OrganizationCreateInput,
  OrganizationJSON,
  OrganizationParams,
  OrganizationUpdateInput,
} from './organization.types';
import { DeletedOutput, type DeletedInput } from './types';
import type { UserParams } from './user.types';

export async function organizationCreate(
  { userId }: UserParams,
  input: OrganizationCreateInput,
): Promise<OrganizationJSON> {
  return prisma.organization.create({
    data: { name: input.name, users: { create: { userId } } },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });
}

export async function organizationDelete({
  organizationId,
}: OrganizationParams) {
  const organization: DeletedInput = await prisma.organization.update({
    where: { id: organizationId, deletedAt: null },
    data: { deletedAt: new Date() },
    select: { id: true, deletedAt: true },
  });
  return v.parse(DeletedOutput, organization);
}

export async function organizationUpdate(
  { organizationId }: OrganizationParams,
  input: OrganizationUpdateInput,
): Promise<void> {
  await prisma.organization.update({
    where: { id: organizationId, deletedAt: null },
    data: input,
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function organizationGet({
  organizationId,
}: OrganizationParams): Promise<OrganizationJSON> {
  return prisma.organization.findUniqueOrThrow({
    where: { id: organizationId, deletedAt: null },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function organizationList({
  userId,
}: UserParams): Promise<OrganizationJSON[]> {
  return prisma.organization.findMany({
    where: { deletedAt: null, users: { some: { userId, deletedAt: null } } },
    orderBy: { createdAt: 'asc' },
    take: 100,
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function organizationPathList({
  organizationId,
}: OrganizationParams) {
  return prisma.formPath.findMany({
    where: { organization: { id: organizationId, deletedAt: null } },
    take: 100,
    select: {
      path: true,
      form: {
        select: { id: true, name: true, description: true },
        where: { AND: [{ deletedAt: null }, { table: { deletedAt: null } }] },
      },
    },
  });
}

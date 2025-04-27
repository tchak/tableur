import * as v from 'valibot';
import { prisma } from '../services/db';

import { FormPathOutput, type FormPathInput } from './form.types';
import type {
  OrganizationCreateInput,
  OrganizationJSON,
  OrganizationParams,
  OrganizationUpdateInput,
} from './organization.types';
import { DeletedOutput, type DeletedInput } from './types';

export async function organizationCreate(
  input: OrganizationCreateInput,
): Promise<OrganizationJSON> {
  return prisma.organization.create({
    data: input,
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });
}

export async function organizationDelete({ organizationId }: OrganizationParams) {
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

export async function organizationList(): Promise<OrganizationJSON[]> {
  return prisma.organization.findMany({
    where: { deletedAt: null },
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

export async function organizationPathList({ organizationId }: OrganizationParams) {
  const paths: FormPathInput[] = await prisma.formPath.findMany({
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
  return v.parse(v.array(FormPathOutput), paths);
}

import * as v from 'valibot';

import { ID, Name, Timestamp } from './types';

export const OrganizationCreateInput = v.object({
  name: Name,
});
export type OrganizationCreateInput = v.InferInput<typeof OrganizationCreateInput>;

export const OrganizationUpdateInput = v.partial(
  v.object({
    name: Name,
  }),
);
export type OrganizationUpdateInput = v.InferInput<typeof OrganizationUpdateInput>;

export const OrganizationOutput = v.object({
  id: ID,
  name: v.string(),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type OrganizationInput = v.InferInput<typeof OrganizationOutput>;

export const OrganizationParams = v.object({ organizationId: ID });
export type OrganizationParams = v.InferOutput<typeof OrganizationParams>;

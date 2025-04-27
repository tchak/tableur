import * as v from 'valibot';

import { ID, ISOTimestamp, Name } from './types';

export const OrganizationParams = v.object({ organizationId: ID });
export type OrganizationParams = v.InferInput<typeof OrganizationParams>;

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

export const OrganizationJSON = v.object({
  id: ID,
  name: v.string(),
  createdAt: ISOTimestamp,
  updatedAt: ISOTimestamp,
});
export type OrganizationJSON = v.InferInput<typeof OrganizationJSON>;

export const OrganizationGetJSON = v.object({ data: OrganizationJSON });
export const OrganizationListJSON = v.object({
  data: v.array(OrganizationJSON),
  meta: v.object({ total: v.pipe(v.number(), v.integer()) }),
});

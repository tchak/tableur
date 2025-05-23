import { oc } from '@orpc/contract';
import * as v from 'valibot';

import { ID, ISOTimestamp, Name } from './types';

export const OrganizationParams = v.object({ organizationId: ID });
export const OrganizationCreateInput = v.object({ name: Name });
export const OrganizationUpdateInput = v.object({
  organizationId: ID,
  name: v.optional(Name),
});

const Organization = v.object({
  id: ID,
  name: v.string(),
  createdAt: ISOTimestamp,
  updatedAt: ISOTimestamp,
});

const FormPath = v.object({
  path: v.string(),
  form: v.nullable(
    v.object({
      id: ID,
      name: v.string(),
      description: v.nullable(v.string()),
    }),
  ),
});

const find = oc
  .route({ method: 'GET' })
  .input(OrganizationParams)
  .output(Organization);
const list = oc.route({ method: 'GET' }).output(v.array(Organization));
const paths = oc
  .route({ method: 'GET' })
  .input(OrganizationParams)
  .output(v.array(FormPath));
const create = oc.input(OrganizationCreateInput).output(Organization);
const update = oc.input(OrganizationUpdateInput).output(v.void());
const destroy = oc.input(OrganizationParams).output(v.void());

function defined<T>(x: T | undefined): T {
  if (x === undefined) throw new Error('Value is undefined');
  return x;
}

export const openapi = {
  find: v.object({
    data: defined(find['~orpc'].outputSchema),
  }),
  list: v.object({
    data: defined(list['~orpc'].outputSchema),
    meta: v.object({ total: v.pipe(v.number(), v.integer()) }),
  }),
  paths: v.object({
    data: defined(paths['~orpc'].outputSchema),
  }),
  create: v.object({
    data: defined(create['~orpc'].outputSchema),
  }),
};

export const contract = {
  find,
  list,
  create,
  update,
  destroy,
  paths,
};

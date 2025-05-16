import * as v from 'valibot';

import { Email, ID } from './types';

export const UserParams = v.object({ userId: ID });
export type UserParams = v.InferInput<typeof UserParams>;

export const UserCreateInput = v.object({
  email: Email,
});
export type UserCreateInput = v.InferInput<typeof UserCreateInput>;

export interface UserJSON {
  id: string;
  email: string;
}

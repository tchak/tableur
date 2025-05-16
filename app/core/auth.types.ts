import * as v from 'valibot';

import { Email } from './types';

export const LoginRequestCreateInput = v.object({
  email: Email,
});
export type LoginRequestCreateInput = v.InferInput<
  typeof LoginRequestCreateInput
>;

export const LoginRequestVerifyInput = v.object({
  email: Email,
  otp: v.pipe(v.string(), v.length(6)),
});
export type LoginRequestVerifyInput = v.InferInput<
  typeof LoginRequestVerifyInput
>;

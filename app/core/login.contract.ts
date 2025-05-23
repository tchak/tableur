import { oc } from '@orpc/contract';
import * as v from 'valibot';

import { Email } from './types';

export const LoginRequestCreateInput = v.object({ email: Email });
export const LoginRequestVerifyInput = v.object({
  email: Email,
  otp: v.pipe(v.string(), v.length(6)),
});

export const loginRequestCreate = oc.input(LoginRequestCreateInput);

export const loginRequestVerify = oc
  .input(LoginRequestVerifyInput)
  .output(v.nullable(v.object({ id: v.string(), email: v.string() })));

export const contract = {
  loginRequestCreate,
  loginRequestVerify,
};

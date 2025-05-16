import { redirect, Form } from 'react-router';
import { Button, Input, InputOtp } from '@heroui/react';

import type { Route } from './+types/login.verify';

import { unauthenticatedMiddleware, getSession } from '~/middleware/session';
import { loginRequestVerify } from '~/core/auth.db';
import { LoginRequestVerifyInput } from '~/core/auth.types';
import { parseFormData } from '~/utils';

export const unstable_middleware = [unauthenticatedMiddleware];

export const loader = async ({ context }: Route.LoaderArgs) => {
  const session = getSession(context);
  const email = session.get('email');
  return { email };
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData();
  const submission = parseFormData(LoginRequestVerifyInput, formData);
  if (submission.status != 'success') {
    return submission.reply();
  }
  const user = await loginRequestVerify(submission.value);
  if (!user) {
    return { errors: ['Wrong code !'] };
  }
  const session = getSession(context);
  session.set('userId', user.id);
  return redirect('/');
};

export default function RouteComponent({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  console.log(actionData);
  return (
    <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
      <Form method="post">
        <fieldset className="flex flex-col gap-4">
          <legend className="pb-4 text-left text-3xl font-semibold">
            Verify Log In
          </legend>

          {loaderData.email ? (
            <input type="hidden" value={loaderData.email} />
          ) : (
            <Input
              isRequired
              label="Email"
              name="email"
              type="email"
              variant="bordered"
            />
          )}

          <InputOtp
            isRequired
            name="otp"
            variant="bordered"
            length={6}
            size="lg"
            fullWidth
            description="Enter the OTP sent to your email"
            className="items-center"
          />

          <Button className="w-full" color="primary" type="submit">
            Verify
          </Button>
        </fieldset>
      </Form>
    </div>
  );
}

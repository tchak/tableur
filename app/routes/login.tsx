import { redirect, Form } from 'react-router';
import { Button, Input, Link } from '@heroui/react';

import type { Route } from './+types/login';

import { unauthenticatedMiddleware, getSession } from '~/middleware/session';
import { loginRequestCreate, LoginRequestCreateInput } from '~/core/login';
import { parseFormData } from '~/utils';

export const unstable_middleware = [unauthenticatedMiddleware];

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData();
  const submission = parseFormData(LoginRequestCreateInput, formData);
  if (submission.status != 'success') {
    return submission.reply();
  }
  await loginRequestCreate(submission.value);
  const session = getSession(context);
  session.flash('email', submission.value.email);
  return redirect('/login/verify');
};

export default function RouteComponent() {
  return (
    <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
      <Form method="post">
        <fieldset className="flex flex-col gap-4">
          <legend className="pb-4 text-left text-3xl font-semibold">
            Log In
          </legend>

          <Input
            isRequired
            label="Email"
            name="email"
            type="email"
            variant="bordered"
          />
          <Button className="w-full" color="primary" type="submit">
            Log In
          </Button>
        </fieldset>
      </Form>
      <p className="text-small text-center">
        <Link href="/signup" size="sm">
          Create an account
        </Link>
      </p>
    </div>
  );
}

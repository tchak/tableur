import { redirect, Form } from 'react-router';
import { Button, Input, InputOtp } from '@heroui/react';
import { useForm, getFormProps } from '@conform-to/react';
import { parseWithValibot, getValibotConstraint } from '@conform-to/valibot';

import type { Route } from './+types/login.verify';

import { unauthenticatedMiddleware, getSession } from '~/middleware/session';
import { loginRequestVerify } from '~/core/login';
import { LoginRequestVerifyInput } from '~/core/login.contract';

export const unstable_middleware = [unauthenticatedMiddleware];

export const loader = async ({ context }: Route.LoaderArgs) => {
  const session = getSession(context);
  const email = session.get('email');
  return { email };
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData();
  const submission = parseWithValibot(formData, {
    schema: LoginRequestVerifyInput,
  });
  if (submission.status != 'success') {
    return submission.reply();
  }
  const user = await loginRequestVerify(submission.value);
  if (!user) {
    return submission.reply({ formErrors: ['Wrong code'] });
  }
  const session = getSession(context);
  session.set('userId', user.id);
  return redirect('/');
};

export default function RouteComponent({
  loaderData,
  actionData: lastResult,
}: Route.ComponentProps) {
  const [form, fields] = useForm({
    lastResult,
    constraint: getValibotConstraint(LoginRequestVerifyInput),
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: LoginRequestVerifyInput });
    },
  });
  return (
    <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
      <Form method="post" {...getFormProps(form)}>
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
              variant="bordered"
              name={fields.email.name}
              isInvalid={!fields.email.valid}
              errorMessage={fields.email.errors}
            />
          )}

          <InputOtp
            isRequired
            name={fields.otp.name}
            variant="bordered"
            length={6}
            size="lg"
            fullWidth
            description="Enter the OTP sent to your email"
            className="items-center"
            isInvalid={!fields.otp.valid || !form.valid}
            errorMessage={fields.otp.errors ?? form.errors}
          />

          <Button className="w-full" color="primary" type="submit">
            Verify
          </Button>
        </fieldset>
      </Form>
    </div>
  );
}

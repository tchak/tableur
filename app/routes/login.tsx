import { redirect, Form } from 'react-router';
import { Button, Input } from '@heroui/react';
import { useForm, getFormProps } from '@conform-to/react';
import { parseWithValibot, getValibotConstraint } from '@conform-to/valibot';
import { Trans } from '@lingui/react/macro';

import type { Route } from './+types/login';

import { unauthenticatedMiddleware, getSession } from '~/middleware/session';
import { loginRequestCreate } from '~/core/login';
import { LoginRequestCreateInput } from '~/core/login.contract';

export const unstable_middleware = [unauthenticatedMiddleware];

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData();
  const submission = parseWithValibot(formData, {
    schema: LoginRequestCreateInput,
  });
  if (submission.status != 'success') {
    return submission.reply();
  }
  await loginRequestCreate(submission.value);
  const session = getSession(context);
  session.flash('email', submission.value.email);
  return redirect('/login/verify');
};

export default function RouteComponent({
  actionData: lastResult,
}: Route.ComponentProps) {
  const [form, fields] = useForm({
    lastResult,
    constraint: getValibotConstraint(LoginRequestCreateInput),
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: LoginRequestCreateInput });
    },
  });
  return (
    <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
      <Form method="post" {...getFormProps(form)}>
        <fieldset className="flex flex-col gap-4">
          <legend className="pb-4 text-left text-3xl font-semibold">
            <Trans>Sign In</Trans>
          </legend>

          <Input
            isRequired
            label={<Trans>Email</Trans>}
            name={fields.email.name}
            type="email"
            variant="bordered"
          />
          <Button className="w-full" color="primary" type="submit">
            <Trans>Sign In</Trans>
          </Button>
        </fieldset>
      </Form>
    </div>
  );
}

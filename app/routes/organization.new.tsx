import { Input } from '@heroui/react';
import { Form, href, redirect } from 'react-router';
import { parseWithValibot, getValibotConstraint } from '@conform-to/valibot';
import { useForm, getFormProps } from '@conform-to/react';
import { Trans, useLingui } from '@lingui/react/macro';

import type { Route } from './+types/organization.new';
import { getUser } from '~/middleware/session';
import { client } from '~/core/router';
import { OrganizationCreateInput } from '~/core/organization.contract';
import { ModalForm } from '~/components/ui/modal-form';

export const action = async ({ request, context }: Route.ActionArgs) => {
  const user = getUser(context);
  const formData = await request.formData();
  const submission = parseWithValibot(formData, {
    schema: OrganizationCreateInput,
  });
  if (submission.status != 'success') {
    return submission.reply();
  }
  await client.organization.create(submission.value, {
    context: { user },
  });
  return redirect(href('/organizations'));
};

export default function RouteComponent() {
  const { t } = useLingui();
  return (
    <ModalForm
      title={t`Create organization`}
      formId="create"
      redirectTo={href('/organizations')}
    >
      <OrganizationCreate formId="create" />
    </ModalForm>
  );
}

function OrganizationCreate({ formId }: { formId: string }) {
  const [form, fields] = useForm({
    id: formId,
    constraint: getValibotConstraint(OrganizationCreateInput),
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: OrganizationCreateInput });
    },
  });
  return (
    <Form
      method="post"
      className="flex flex-col items-end gap-2"
      {...getFormProps(form)}
    >
      <input type="hidden" name="action" value="create" />
      <Input
        type="text"
        label={<Trans>Name</Trans>}
        variant="flat"
        name={fields.name.name}
        isRequired
      />
    </Form>
  );
}

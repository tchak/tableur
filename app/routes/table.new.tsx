import { Input } from '@heroui/react';
import { Form, href, redirect } from 'react-router';
import { parseWithValibot, getValibotConstraint } from '@conform-to/valibot';
import { useForm, getFormProps } from '@conform-to/react';
import * as v from 'valibot';

import type { Route } from './+types/table.new';
import { getUser } from '~/middleware/session';
import { client } from '~/core/router';
import { ModalForm } from '~/components/ui/modal-form';

const TableCreateInput = v.object({
  name: v.string(),
});

export const action = async ({ request, context }: Route.ActionArgs) => {
  const user = getUser(context);
  if (!user.currentOrganizationId) {
    return redirect(href('/tables'));
  }
  const formData = await request.formData();
  const submission = parseWithValibot(formData, {
    schema: TableCreateInput,
  });
  if (submission.status != 'success') {
    return submission.reply();
  }
  await client.table.create(
    {
      organizationId: user.currentOrganizationId,
      columns: [{ name: 'Name', type: 'text' }],
      ...submission.value,
    },
    {
      context: { user },
    },
  );
  return redirect(href('/tables'));
};

export default function RouteComponent() {
  return (
    <ModalForm
      title="Create table"
      formId="create"
      redirectTo={href('/tables')}
    >
      <TableCreate formId="create" />
    </ModalForm>
  );
}

function TableCreate({ formId }: { formId: string }) {
  const [form, fields] = useForm({
    id: formId,
    constraint: getValibotConstraint(TableCreateInput),
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: TableCreateInput });
    },
  });
  return (
    <Form
      method="post"
      className="flex flex-col items-end gap-2"
      {...getFormProps(form)}
    >
      <Input
        type="text"
        label="Name"
        variant="flat"
        name={fields.name.name}
        isRequired
      />
    </Form>
  );
}

import { redirect, Form, href } from 'react-router';
import { Button } from '@heroui/react';

import type { Route } from './+types/organization.show';
import { getUser } from '~/middleware/session';

import { client } from '~/core/router';

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: `Tableur - ${data.organization.name}` },
    { name: 'description', content: '' },
  ];
}

export const loader = async ({ params, context }: Route.LoaderArgs) => {
  const user = getUser(context);
  const organization = await client.organization.find(params, {
    context: { user },
  });
  return { organization };
};

export const action = async ({
  request,
  params,
  context,
}: Route.ActionArgs) => {
  const user = getUser(context);
  const formData = await request.formData();
  const action = formData.get('action');
  switch (action) {
    case 'delete': {
      await client.organization.destroy(params, { context: { user } });
      return redirect(href('/account'));
    }
  }
};

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col gap-4 px-2 md:flex-row">
      <h1 className="mb-2">{loaderData.organization.name}</h1>
      <Form method="post">
        <input type="hidden" name="action" value="delete" />
        <Button variant="flat" color="danger" type="submit">
          Delete
        </Button>
      </Form>
    </div>
  );
}

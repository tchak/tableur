import { redirect, Form, href } from 'react-router';
import { Button } from '@heroui/react';

import type { Route } from './+types/organization';
import { Header } from '~/components/ui/header';

import { organizationGet, organizationDelete } from '../core/organization.db';

export function meta() {
  return [{ title: 'Solaris' }, { name: 'description', content: '' }];
}

export const loader = async ({ params }: Route.LoaderArgs) => {
  const organization = await organizationGet(params);
  return { organization };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const formData = await request.formData();
  const action = formData.get('action');
  switch (action) {
    case 'delete': {
      await organizationDelete(params);
      return redirect(href('/account'));
    }
  }
};

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <div className="bg-background relative flex h-dvh w-full flex-col overflow-hidden">
      <Header items={[]} />
      <main className="container mx-auto mt-8">
        <h1 className="mb-2">{loaderData.organization.name}</h1>
        <Form method="post">
          <input type="hidden" name="action" value="delete" />
          <Button variant="flat" color="danger" type="submit">
            Delete
          </Button>
        </Form>
      </main>
    </div>
  );
}

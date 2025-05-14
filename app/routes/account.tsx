import { useMemo, useRef, useEffect } from 'react';
import {
  Listbox,
  ListboxItem,
  Input,
  Button,
  Link,
  type Selection,
} from '@heroui/react';
import { useFetcher, href } from 'react-router';
import { EditIcon } from 'lucide-react';

import type { Route } from './+types/account';
import { Header } from '~/components/ui/header';

import { organizationList, organizationCreate } from '../core/organization.db';

export const loader = async () => {
  const organizations = await organizationList();
  return { organizations, organizationId: organizations.at(0)?.id ?? null };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const action = formData.get('action');
  switch (action) {
    case 'create': {
      const name = String(formData.get('name') ?? '');
      await organizationCreate({ name });
      break;
    }
    case 'select': {
      const organizationId = formData.get('organizationId');
      console.log(organizationId);
      break;
    }
  }
};

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <div className="bg-background relative flex h-dvh w-full flex-col overflow-hidden">
      <Header items={[]} />
      <main className="container mx-auto mt-8">
        <div className="flex flex-col gap-4 px-2 md:flex-row">
          <OrganizationList {...loaderData} />
          <OrganizationCreate />
        </div>
      </main>
    </div>
  );
}

function OrganizationList({
  organizations,
  organizationId,
}: Route.ComponentProps['loaderData']) {
  const [selectedKeys, onSelectionChange] =
    useCurrentOrganization(organizationId);
  return (
    <div className="flex-2/3">
      <h2 className="mb-2" id="organization-list">
        Organizations
      </h2>
      <div className="border-small rounded-small border-default-200 dark:border-default-100 px-1 py-2">
        <Listbox
          disallowEmptySelection
          aria-labelledby="organization-list"
          selectedKeys={selectedKeys}
          selectionMode="single"
          variant="flat"
          onSelectionChange={onSelectionChange}
          items={organizations}
        >
          {(organization) => (
            <ListboxItem
              key={organization.id}
              textValue={organization.name}
              endContent={
                <Button
                  variant="flat"
                  isIconOnly
                  as={Link}
                  href={href('/organizations/:organizationId', {
                    organizationId: organization.id,
                  })}
                >
                  <EditIcon className="size-4" />
                </Button>
              }
            >
              {organization.name}
            </ListboxItem>
          )}
        </Listbox>
      </div>
    </div>
  );
}

function OrganizationCreate() {
  const fetcher = useFetcher();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (fetcher.state == 'idle') {
      formRef.current?.reset();
    }
  }, [fetcher.state]);

  return (
    <fetcher.Form method="post" className="flex-1/3" ref={formRef}>
      <fieldset className="flex flex-col items-end gap-2">
        <legend className="mb-2">
          <h2>Create new organization</h2>
        </legend>
        <input type="hidden" name="action" value="create" />
        <Input type="text" name="name" label="Name" variant="flat" />
        <Button
          type="submit"
          isDisabled={fetcher.state === 'submitting'}
          variant="flat"
        >
          Create
        </Button>
      </fieldset>
    </fetcher.Form>
  );
}

function useCurrentOrganization(
  organizationId: string | null,
): [Selection, (selection: Selection) => void] {
  const fetcher = useFetcher({ key: 'update-account' });
  const maybeOrganizationId =
    fetcher.state != 'idle' ? fetcher.formData?.get('organizationId') : null;

  const selectedKeys = useMemo<Selection>(() => {
    const selectedKey = maybeOrganizationId
      ? String(maybeOrganizationId)
      : organizationId;
    return selectedKey ? new Set([selectedKey]) : new Set();
  }, [organizationId, maybeOrganizationId]);
  return [
    selectedKeys,
    (selection) => {
      const organizationId = getSelectedKey(selection);
      if (organizationId) {
        const formData = new FormData();
        formData.set('action', 'select');
        formData.set('organizationId', organizationId);
        fetcher.submit(formData, { method: 'POST' });
      }
    },
  ];
}

function getSelectedKey(selection: Selection): string | null {
  if (typeof selection === 'string') {
    return null;
  }
  const [key] = selection;
  return key ? String(key) : null;
}

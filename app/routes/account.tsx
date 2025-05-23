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
import { getUser, getSession } from '~/middleware/session';
import { client } from '~/core/router';
import {
  OrganizationCreateInput,
  OrganizationParams,
} from '~/core/organization.types';
import { parseFormData } from '~/utils';

export const loader = async ({ context }: Route.LoaderArgs) => {
  const user = getUser(context);
  const organizations = await client.organization.list(
    {},
    { context: { user } },
  );
  return { organizations, organizationId: user.currentOrganizationId };
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const user = getUser(context);
  const formData = await request.formData();
  const action = formData.get('action');
  switch (action) {
    case 'create': {
      const submission = parseFormData(OrganizationCreateInput, formData);
      if (submission.status != 'success') {
        return submission.reply();
      }
      await client.organization.create(submission.value, {
        context: { user },
      });
      break;
    }
    case 'select': {
      const submission = parseFormData(OrganizationParams, formData);
      if (submission.status == 'success') {
        const session = getSession(context);
        session.set('organizationId', submission.value.organizationId);
      }
      break;
    }
  }
};

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col gap-4 px-2 md:flex-row">
      <OrganizationList {...loaderData} />
      <OrganizationCreate />
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

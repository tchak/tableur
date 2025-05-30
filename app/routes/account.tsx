import { useMemo } from 'react';
import {
  Listbox,
  ListboxItem,
  Button,
  Link,
  type Selection,
} from '@heroui/react';
import { useFetcher, href, Outlet } from 'react-router';
import { EditIcon } from 'lucide-react';
import { parseWithValibot } from '@conform-to/valibot';

import type { Route } from './+types/account';
import { getUser, getSession } from '~/middleware/session';
import { client } from '~/core/router';
import { OrganizationParams } from '~/core/organization.contract';

export const loader = async ({ context }: Route.LoaderArgs) => {
  const user = getUser(context);
  const organizations = await client.organization.list(
    {},
    { context: { user } },
  );
  return { organizations, organizationId: user.currentOrganizationId };
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData();
  const action = formData.get('action');
  switch (action) {
    case 'select': {
      const submission = parseWithValibot(formData, {
        schema: OrganizationParams,
      });
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
    <>
      <OrganizationList {...loaderData} />
      <Outlet />
    </>
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
      <div className="mb-2 flex items-center justify-between">
        <h2 id="organization-list">Organizations</h2>
        <Button
          variant="flat"
          as={Link}
          href={href('/account/new-organization')}
        >
          New Organization
        </Button>
      </div>
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

import { redirect, Outlet } from 'react-router';
import { Listbox, ListboxItem, Button, Link } from '@heroui/react';
import { href } from 'react-router';
import { Trans } from '@lingui/react/macro';

import type { Route } from './+types/table.list';

import { getUser } from '~/middleware/session';
import { client } from '~/core/router';

export const loader = async ({ context }: Route.LoaderArgs) => {
  const user = getUser(context);
  if (!user.currentOrganizationId) {
    throw redirect('/');
  }
  const tables = await client.table.list(
    { organizationId: user.currentOrganizationId },
    { context: { user } },
  );
  return { tables };
};

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <TableList tables={loaderData.tables} />
      <Outlet />
    </>
  );
}

function TableList({ tables }: Route.ComponentProps['loaderData']) {
  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <h2 id="table-list">
          <Trans>Tables</Trans>
        </h2>
        <Button variant="flat" as={Link} href={href('/tables/new')}>
          <Trans>New Table</Trans>
        </Button>
      </div>
      <div className="border-small rounded-small border-default-200 dark:border-default-100 px-1 py-2">
        <Listbox
          disallowEmptySelection
          aria-labelledby="table-list"
          variant="flat"
          items={tables}
        >
          {(table) => (
            <ListboxItem
              key={table.id}
              textValue={table.name}
              href={`/tables/${table.id}`}
            >
              {table.name}
            </ListboxItem>
          )}
        </Listbox>
      </div>
    </>
  );
}

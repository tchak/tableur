import { redirect } from 'react-router';
import { Listbox, ListboxItem } from '@heroui/react';

import type { Route } from './+types/tables.index';

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
  return <TableList tables={loaderData.tables} />;
}

function TableList({ tables }: Route.ComponentProps['loaderData']) {
  return (
    <div className="flex-2/3">
      <h2 className="mb-2" id="table-list">
        Tables
      </h2>
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
    </div>
  );
}

import {
  Button,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from '@heroui/react';
import { useFetcher, redirect, href } from 'react-router';
import { type Key, useMemo } from 'react';
import { Trans } from '@lingui/react/macro';

import type { Route } from './+types/table.show';
import { getUser } from '~/middleware/session';
import { client } from '~/core/router';
import { breadcrumb } from '~/components/ui/breadcrumbs';

export const handle = {
  ...breadcrumb<Route.ComponentProps['loaderData']>((data) => ({
    title: data.table.name,
    path: href('/tables/:tableId', { tableId: data.table.id }),
  })),
};

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: `Tableur - ${data?.table.name}` },
    { name: 'description', content: data?.table.description },
  ];
}

export const loader = async ({ context, params }: Route.LoaderArgs) => {
  const user = getUser(context);
  if (!user.currentOrganizationId) {
    throw redirect('/');
  }
  const table = await client.table.find(
    { tableId: params.tableId },
    { context: { user } },
  );
  const rows = await client.row.list(
    { tableId: params.tableId, take: 20, order: 'asc' },
    { context: { user } },
  );
  return { table, rows: rows.items };
};

export const action = async ({ context, params }: Route.ActionArgs) => {
  const user = getUser(context);
  await client.row.create({ tableId: params.tableId }, { context: { user } });
};

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return <RowList rows={loaderData.rows} table={loaderData.table} />;
}

function RowList({ rows, table }: Route.ComponentProps['loaderData']) {
  const fetcher = useFetcher();
  const topContent = useMemo(
    () => (
      <div className="flex items-center justify-between">
        <h2 id="table-row-list">{table.name}</h2>
        <Button
          color="primary"
          variant="flat"
          onPress={() => {
            fetcher.submit({}, { method: 'POST' });
          }}
        >
          <Trans>Add Row</Trans>
        </Button>
      </div>
    ),
    [table.name, fetcher],
  );
  return (
    <Table aria-label="table-row-list" topContent={topContent}>
      <TableHeader
        columns={[
          { name: 'ID', id: 'id' } as const,
          { name: 'Number', id: 'number' } as const,
          ...table.columns,
        ]}
      >
        {(column) => <TableColumn key={column.id}>{column.name}</TableColumn>}
      </TableHeader>
      <TableBody items={rows}>
        {(item) => (
          <TableRow key={item.id}>
            {(columnKey) => (
              <TableCell>{getKeyValue(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function getKeyValue(
  row: Route.ComponentProps['loaderData']['rows'][0],
  key: Key,
) {
  switch (key) {
    case 'id':
      return row.id;
    case 'number':
      return row.number;
    default:
      return String(row.data[String(key)]?.value ?? '');
  }
}

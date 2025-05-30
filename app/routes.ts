import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

export default [
  layout('routes/layout.tsx', [
    index('routes/home.tsx'),
    route('login', 'routes/login.tsx'),
    route('login/verify', 'routes/login.verify.tsx'),
  ]),
  layout('routes/authenticated.tsx', [
    route('account', 'routes/account.tsx'),
    route('organizations', 'routes/organization.tsx', [
      layout('routes/organization.list.tsx', [
        index('routes/organization.index.tsx'),
        route('new', 'routes/organization.new.tsx'),
      ]),
      route(':organizationId', 'routes/organization.show.tsx'),
    ]),
    route('tables', 'routes/table.tsx', [
      layout('routes/table.list.tsx', [
        index('routes/table.index.tsx'),
        route('new', 'routes/table.new.tsx'),
      ]),
      route(':tableId', 'routes/table.show.tsx'),
    ]),
  ]),
  route('logout', 'routes/logout.tsx'),
  route('rpc', 'routes/rpc.ts'),
] satisfies RouteConfig;

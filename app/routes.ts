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
    route('organizations/:organizationId', 'routes/organization.tsx'),
    route('tables', 'routes/tables.tsx', [
      index('routes/tables.index.tsx'),
      route('new', 'routes/tables.new.tsx'),
      route(':tableId', 'routes/tables.show.tsx'),
    ]),
  ]),
  route('logout', 'routes/logout.tsx'),
  route('rpc', 'routes/rpc.ts'),
] satisfies RouteConfig;

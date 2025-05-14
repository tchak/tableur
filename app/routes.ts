import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('account', 'routes/account.tsx'),
  route('organizations/:organizationId', 'routes/organization.tsx'),
] satisfies RouteConfig;

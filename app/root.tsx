import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import type { ReactNode } from 'react';
import { I18nProvider } from '@lingui/react';

import { UIProvider } from '~/components/ui/provider';
import type { Route } from './+types/root';
import './app.css';
import { sessionMiddleware } from '~/middleware/session';
import { getI18n } from '~/lib/i18n.server';
import { useI18n } from '~/lib/i18n';

export const unstable_middleware = [sessionMiddleware];
export const links: Route.LinksFunction = () => [];

export function loader({ request }: Route.LoaderArgs) {
  const i18n = getI18n(request);
  return { locale: i18n.locale, messages: i18n.messages };
}

export function meta() {
  return [{ title: 'Tableur' }, { name: 'description', content: '' }];
}

export function Layout({ children }: { children: ReactNode }) {
  const i18n = useI18n();

  return (
    <html lang={i18n.locale} className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <I18nProvider i18n={i18n}>
          <UIProvider locale={i18n.locale}>{children}</UIProvider>
        </I18nProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

import { lingui } from '@lingui/vite-plugin';
import locales from '@react-aria/optimize-locales-plugin';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { reactRouterHonoServer } from 'react-router-hono-server/dev';
import { defineConfig } from 'vite';
import macros from 'vite-plugin-babel-macros';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  server: { port: process.env.PORT ? parseInt(process.env.PORT) : 8080 },
  plugins: [
    tailwindcss(),
    reactRouterHonoServer({ runtime: 'bun' }),
    reactRouter(),
    macros(),
    lingui(),
    tsconfigPaths(),
    { ...locales.vite({ locales: ['en', 'fr'] }), enforce: 'pre' },
  ],
});

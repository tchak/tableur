import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:8282',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'safari',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'edge',
      use: { ...devices['Desktop Edge'] },
    },
  ],
  webServer: {
    command: 'bun -b --env-file=.env.test vite -m test',
    url: 'http://localhost:8282',
    reuseExistingServer: !process.env.CI,
  },
});

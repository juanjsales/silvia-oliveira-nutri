import { defineConfig, devices } from '@playwright/test';

const host = '127.0.0.1';
const appPort = 5199;
const mockApiPort = 3199;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  globalTimeout: 120_000,
  timeout: 20_000,
  use: {
    baseURL: `http://${host}:${appPort}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: `node tests/e2e/mock-api-server.mjs ${mockApiPort}`,
      url: `http://${host}:${mockApiPort}/health`,
      reuseExistingServer: false,
      timeout: 10_000,
    },
    {
      command: `npm run dev -- --mode e2e --host ${host} --port ${appPort} --strictPort`,
      url: `http://${host}:${appPort}`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});

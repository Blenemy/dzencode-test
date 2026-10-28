import { defineConfig, devices } from '@playwright/test';
import { DEMO_STATE } from './support/auth-state';

const channel = process.env.E2E_BROWSER_CHANNEL;
const reporter = process.env.CI ? 'github' : 'list';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [[reporter], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8080',
    locale: 'ru-RU',
    timezoneId: 'Europe/Kyiv',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], channel },
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel, storageState: DEMO_STATE },
      dependencies: ['setup'],
    },
  ],
});

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:8080',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run build && npm start',
    env: {
      CORS_ORIGIN: 'false',
      FRONTEND_STATIC_DIR: '../frontend/dist',
      HOST: '127.0.0.1',
      NODE_ENV: 'test',
      PORT: '8080',
      SQLITE_PATH: '../data/e2e.sqlite',
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: 'http://127.0.0.1:8080/health',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

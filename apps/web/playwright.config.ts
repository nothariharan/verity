import { defineConfig, devices } from "@playwright/test";

const webPort = 3010;
const apiPort = 8791;
const webOrigin = `http://127.0.0.1:${webPort}`;
const serverUrl = `http://127.0.0.1:${apiPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  use: { ...devices["Desktop Chrome"], baseURL: webOrigin },
  webServer: [
    {
      command: "pnpm --filter server exec tsx src/main.ts",
      cwd: "../..",
      env: {
        ...process.env,
        PROVIDERS: "fake",
        PORT: String(apiPort),
        WEB_ORIGIN: webOrigin,
        DATABASE_URL: "file:./data/e2e.db",
        LOG_LEVEL: "error",
      },
      url: `${serverUrl}/health`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: "node apps/web/scripts/e2e-web.mjs",
      cwd: "../..",
      env: {
        ...process.env,
        NEXT_PUBLIC_SERVER_URL: serverUrl,
      },
      url: webOrigin,
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});

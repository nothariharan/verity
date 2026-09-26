import { loadConfig, type Config } from "../src/config";

export function testConfig(over: Partial<Config> = {}): Config {
  const base = loadConfig({ PROVIDERS: "fake", DATABASE_URL: ":memory:" } as NodeJS.ProcessEnv);
  return { ...base, databaseUrl: "file::memory:", ...over };
}

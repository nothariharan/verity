import { spawn } from "node:child_process";

const env = { ...process.env };
const build = spawn("pnpm", ["--filter", "web", "exec", "next", "build"], {
  stdio: "inherit",
  env,
  shell: true,
});

build.on("exit", (code) => {
  if (code !== 0) {
    process.exit(code ?? 1);
  }
  const start = spawn("pnpm", ["--filter", "web", "exec", "next", "start", "--port", "3010"], {
    stdio: "inherit",
    env,
    shell: true,
  });
  start.on("exit", (startCode) => process.exit(startCode ?? 1));
});

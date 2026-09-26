import { buildApp } from "./app";
import { loadConfig } from "./config";
import { createBrain } from "./wiring";

const config = loadConfig();
const wiring = createBrain(config);
const { app } = await buildApp({ config, brain: wiring.brain, onCreate: wiring.onCreate });

await app.listen({ port: config.port, host: "0.0.0.0" });
app.log.info(`Verity server on :${config.port} (providers=${config.providers})`);

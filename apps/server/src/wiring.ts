import type { AppDeps } from "./app";
import type { Config } from "./config";
import type { SessionBrain } from "./session/session";

/** Chooses providers and the case engine. P0: no engine attached. */
export function createBrain(_config: Config): { brain: SessionBrain | null; onCreate?: AppDeps["onCreate"] } {
  return { brain: null };
}

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("server boot", () => {
  it("passes Scribe and Flash into the live app", () => {
    const src = readFileSync(new URL("../../src/main.ts", import.meta.url), "utf8");
    expect(src).toContain("speech: wiring.speech");
  });
});

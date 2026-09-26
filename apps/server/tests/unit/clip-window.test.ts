import { describe, expect, it } from "vitest";
import { clipWindow } from "../../src/session/clip-window";

describe("clip window", () => {
  it("pads 1.5s before the quote and 0.5s after", () => {
    expect(clipWindow(10_000, 12_000, 900_000)).toEqual({ startMs: 8_500, endMs: 12_500 });
  });

  it("clamps to the start of the session", () => {
    expect(clipWindow(100, 400, 900_000)).toEqual({ startMs: 0, endMs: 900 });
  });

  it("caps a long quote at 20 seconds", () => {
    expect(clipWindow(0, 30_000, 900_000)).toEqual({ startMs: 0, endMs: 20_000 });
  });

  it("clamps to the end of the session", () => {
    expect(clipWindow(899_000, 899_500, 900_000)).toEqual({ startMs: 897_500, endMs: 900_000 });
  });
});

import { describe, expect, it } from "vitest";
import { normalizeForSpeech } from "../../src/providers/tts/normalize";

describe("normalizeForSpeech", () => {
  it("replaces k8s and K8s with Kubernetes", () => {
    expect(normalizeForSpeech("k8s")).toBe("Kubernetes");
    expect(normalizeForSpeech("K8s")).toBe("Kubernetes");
    expect(normalizeForSpeech("We ran k8s and then K8s.")).toBe("We ran Kubernetes and then Kubernetes.");
  });

  it("replaces p95 and P95 with P ninety-five", () => {
    expect(normalizeForSpeech("p95")).toBe("P ninety-five");
    expect(normalizeForSpeech("P95")).toBe("P ninety-five");
    expect(normalizeForSpeech("Watch p95 and P95.")).toBe("Watch P ninety-five and P ninety-five.");
  });

  it("replaces QPS with queries per second", () => {
    expect(normalizeForSpeech("QPS")).toBe("queries per second");
    expect(normalizeForSpeech("Peak QPS held.")).toBe("Peak queries per second held.");
  });

  it("replaces 50k and 100k", () => {
    expect(normalizeForSpeech("50k")).toBe("fifty thousand");
    expect(normalizeForSpeech("100k")).toBe("one hundred thousand");
    expect(normalizeForSpeech("From 50k to 100k.")).toBe("From fifty thousand to one hundred thousand.");
  });

  it("rewrites a full question and leaves the other words alone", () => {
    expect(normalizeForSpeech("At 50k QPS on k8s, what did p95 look like when you hit 100k?")).toBe(
      "At fifty thousand queries per second on Kubernetes, what did P ninety-five look like when you hit one hundred thousand?",
    );
  });

  it("does not rewrite lookalike tokens or add a trailing space", () => {
    expect(normalizeForSpeech("Kafka handles 150k events at p99.")).toBe("Kafka handles 150k events at p99.");
    expect(normalizeForSpeech("xk8s stays")).toBe("xk8s stays");
    expect(normalizeForSpeech("  k8s  ")).toBe("  Kubernetes  ");
  });
});

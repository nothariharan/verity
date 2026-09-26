import type { Fact } from "@verity/contracts";
import { describe, expect, it } from "vitest";
import { normalizeFact, suspectConflict } from "../../src/mind/ledger";

function fact(over: Partial<Fact> & Pick<Fact, "id">): Fact {
  return {
    entity: "ingest pipeline",
    attribute: "throughput",
    value: "50000",
    quote: "we handled about fifty thousand a day",
    atMs: 1_000,
    ...over,
  };
}

describe("normalizeFact", () => {
  it("lowercases entity and attribute, parses comma numbers, and keeps the unit", () => {
    const raw = fact({
      id: "fact_n",
      entity: "Ingest Pipeline",
      attribute: "Throughput_Daily",
      value: "50,000",
      unit: "Events",
    });
    const n = normalizeFact(raw);
    expect(n.entity).toBe("ingest pipeline");
    expect(n.attribute).toBe("throughput_daily");
    expect(n.value).toBe("50000");
    expect(n.unit).toBe("events");
    expect(raw.value).toBe("50,000");
  });
});

describe("suspectConflict", () => {
  it("does not flag the same fact", () => {
    const stated = fact({ id: "fact_a", entity: "Ingest Pipeline", value: "50,000", unit: "events" });
    expect(suspectConflict([stated], stated)).toBeNull();
    expect(
      suspectConflict([stated], fact({ id: "fact_b", entity: "ingest pipeline", value: "50000", unit: "Events" })),
    ).toBeNull();
  });

  it("flags 50k against 5k", () => {
    const hit = suspectConflict(
      [fact({ id: "fact_early", value: "50k", atMs: 10 })],
      fact({ id: "fact_late", value: "5k", atMs: 20 }),
    );
    expect(hit?.factIds).toEqual(["fact_early", "fact_late"]);
    expect(hit?.note).toBe("ingest pipeline throughput is recorded as 50k and as 5k.");
    expect(hit?.note).not.toMatch(/inconsist|contradict|lie|wrong|false|cheat|suspect/i);
  });

  it("treats 500 ms and 0.5 s as the same quantity", () => {
    expect(
      suspectConflict(
        [fact({ id: "fact_ms", attribute: "latency", value: "500ms" })],
        fact({ id: "fact_s", attribute: "latency", value: "0.5s" }),
      ),
    ).toBeNull();
    expect(
      suspectConflict(
        [fact({ id: "fact_ms", attribute: "latency", value: "500", unit: "milliseconds" })],
        fact({ id: "fact_s", attribute: "latency", value: "0.5", unit: "seconds" }),
      ),
    ).toBeNull();
  });

  it("treats k and thousand as the same scale", () => {
    expect(
      suspectConflict(
        [fact({ id: "fact_k", value: "50", unit: "k" })],
        fact({ id: "fact_th", value: "50", unit: "thousand" }),
      ),
    ).toBeNull();
    expect(
      suspectConflict(
        [fact({ id: "fact_k", value: "50", unit: "k" })],
        fact({ id: "fact_plain", value: "50,000" }),
      ),
    ).toBeNull();
  });

  it("flags the same number when the units are not aliases", () => {
    const hit = suspectConflict(
      [fact({ id: "fact_a", attribute: "latency", value: "500", unit: "ms", atMs: 5 })],
      fact({ id: "fact_b", attribute: "latency", value: "500", unit: "requests", atMs: 6 }),
    );
    expect(hit?.factIds).toEqual(["fact_a", "fact_b"]);
  });

  it("allows a numeric gap of 10 percent and flags a wider one", () => {
    expect(suspectConflict([fact({ id: "fact_a", value: "100" })], fact({ id: "fact_b", value: "110" }))).toBeNull();
    expect(suspectConflict([fact({ id: "fact_a", value: "100" })], fact({ id: "fact_b", value: "111" }))).not.toBeNull();
    expect(suspectConflict([fact({ id: "fact_a", value: "10" })], fact({ id: "fact_b", value: "20" }))).not.toBeNull();
  });

  it("does not treat forgetting as a conflict", () => {
    expect(
      suspectConflict([fact({ id: "fact_a", value: "50k" })], fact({ id: "fact_b", value: "I don't remember" })),
    ).toBeNull();
    expect(
      suspectConflict([fact({ id: "fact_a", value: "I don't remember" })], fact({ id: "fact_b", value: "5k" })),
    ).toBeNull();
    const hit = suspectConflict(
      [
        fact({ id: "fact_forget", value: "I don't remember", atMs: 1 }),
        fact({ id: "fact_early", value: "50k", atMs: 2 }),
      ],
      fact({ id: "fact_late", value: "5k", atMs: 3 }),
    );
    expect(hit?.factIds).toEqual(["fact_early", "fact_late"]);
  });

  it("does not flag different entities", () => {
    expect(
      suspectConflict(
        [fact({ id: "fact_a", entity: "ingest pipeline", value: "50k" })],
        fact({ id: "fact_b", entity: "billing api", value: "5k" }),
      ),
    ).toBeNull();
  });

  it("does not flag a non-numeric value that contains the other", () => {
    expect(
      suspectConflict(
        [fact({ id: "fact_a", attribute: "stack", value: "Kafka" })],
        fact({ id: "fact_b", attribute: "stack", value: "managed Kafka" }),
      ),
    ).toBeNull();
    expect(
      suspectConflict(
        [fact({ id: "fact_a", attribute: "stack", value: "managed Kafka" })],
        fact({ id: "fact_b", attribute: "stack", value: "our own brokers" }),
      )?.factIds,
    ).toEqual(["fact_a", "fact_b"]);
  });
});

import { describe, expect, it } from "vitest";
import { groundSpan, heuristicExtract } from "../../src/mind/engine";

describe("heuristic extract skills", () => {
  it("marks required skills and links them to a claim that names them", () => {
    const resume = "Designed a Kafka pipeline processing 50k events per second for click ingestion.";
    const jd = "Required: Kafka and SQL.\nNice to have: Figma.";
    const out = heuristicExtract(resume, jd);
    const kafka = out.skills.find((s) => s.name === "Kafka");
    expect(kafka?.requirement).toBe("required");
    expect(out.cases[0]?.skills).toContain("Kafka");
    expect(out.cases[0]?.skills).not.toContain("SQL");
  });

  it("grounds a paraphrase on the resume line that shares its terms", () => {
    const line = "Engineered the SOD Analyzer backend in FastAPI for audit exports.";
    const span = "Built the SOD Analyzer backend in FastAPI with controls that are not written on the resume.";
    expect(groundSpan(line, span)).toBe(line);
    expect(groundSpan(line, "A completely unrelated claim about cooking pasta for a dinner party tonight.")).toBeNull();
  });
});

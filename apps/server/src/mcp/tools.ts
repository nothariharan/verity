export interface McpApi {
  origin: string;
  createInterview(raw: Record<string, unknown>): Promise<string>;
  listInterviews(): Promise<unknown>;
  readDossier(sessionId: string): Promise<unknown | null>;
}

export interface ToolResult {
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

const TOOLS = [
  {
    name: "create_interview",
    description:
      "Create a Verity interview from resume text. Returns a session id and the website links. The candidate speaks on the interview URL. This does not ask questions or change beliefs.",
    inputSchema: {
      type: "object",
      properties: {
        resumeText: { type: "string", description: "Plain text of the resume." },
        jdText: { type: "string", description: "Plain text of the job description, if any." },
        role: { type: "string", description: "Role title. Defaults to Software Engineer." },
        candidateName: { type: "string" },
        mode: { type: "string", enum: ["recruiter", "practice"] },
        durationSec: { type: "integer", minimum: 60, maximum: 3600 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "list_interviews",
    description: "List Verity interviews with role, whether each has ended, and the current case beliefs.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_dossier",
    description: "Read one interview: cases, beliefs, questions, and receipts. Beliefs are evidence from the interview, not a score.",
    inputSchema: {
      type: "object",
      properties: { sessionId: { type: "string", description: "Session id returned by create_interview." } },
      required: ["sessionId"],
      additionalProperties: false,
    },
  },
] as const;

export function listTools() {
  return TOOLS;
}

function textResult(value: unknown, isError = false): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], ...(isError ? { isError: true } : {}) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export async function callTool(name: string, args: unknown, api: McpApi): Promise<ToolResult> {
  const record = isRecord(args) ? args : {};
  if (name === "create_interview") {
    try {
      const sessionId = await api.createInterview(record);
      const origin = api.origin.replace(/\/$/, "");
      return textResult({
        sessionId,
        interviewUrl: `${origin}/interview/${sessionId}`,
        watchUrl: `${origin}/app/live/${sessionId}`,
      });
    } catch (err) {
      return textResult({ error: err instanceof Error ? err.message : "could not create the interview" }, true);
    }
  }
  if (name === "list_interviews") return textResult(await api.listInterviews());
  if (name === "get_dossier") {
    const sessionId = record.sessionId;
    if (typeof sessionId !== "string" || !sessionId) return textResult({ error: "sessionId is required" }, true);
    const dossier = await api.readDossier(sessionId);
    if (!dossier) return textResult({ error: "no interview with that id" }, true);
    return textResult(dossier);
  }
  return textResult({ error: `unknown tool: ${name}` }, true);
}

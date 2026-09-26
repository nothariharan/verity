import { callTool, listTools, type McpApi, type ToolResult } from "./tools";

const PROTOCOL = "2025-03-26";

export interface RpcMessage {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
  params?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isRequest(msg: RpcMessage): msg is RpcMessage & { method: string; id: string | number } {
  return msg.jsonrpc === "2.0" && typeof msg.method === "string" && (typeof msg.id === "string" || typeof msg.id === "number");
}

function rpcResult(id: string | number, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(id: string | number | null, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function dispatch(msg: RpcMessage & { method: string; id: string | number }, api: McpApi) {
  const params = isRecord(msg.params) ? msg.params : {};
  switch (msg.method) {
    case "initialize": {
      const requested = typeof params.protocolVersion === "string" ? params.protocolVersion : PROTOCOL;
      const protocolVersion = requested === "2025-06-18" || requested === "2025-03-26" ? requested : PROTOCOL;
      return rpcResult(msg.id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "verity", version: "0.1.0" },
        instructions:
          "Verity investigates resume claims out loud on the website. create_interview returns the link where the candidate speaks. list_interviews and get_dossier only read what the interview already recorded. Do not invent a score.",
      });
    }
    case "ping":
      return rpcResult(msg.id, {});
    case "tools/list":
      return rpcResult(msg.id, { tools: listTools() });
    case "tools/call": {
      const name = typeof params.name === "string" ? params.name : "";
      const result: ToolResult = await callTool(name, params.arguments, api);
      return rpcResult(msg.id, result);
    }
    default:
      return rpcError(msg.id, -32601, `method not found: ${msg.method}`);
  }
}

export async function handleMcpMessage(body: unknown, api: McpApi): Promise<{ status: number; body?: unknown }> {
  if (Array.isArray(body)) {
    const requests = body.filter((item): item is RpcMessage => isRecord(item)).filter(isRequest);
    if (!requests.length) return { status: 202 };
    const responses = [];
    for (const item of requests) responses.push(await dispatch(item, api));
    return { status: 200, body: responses };
  }
  if (!isRecord(body)) return { status: 400, body: rpcError(null, -32700, "parse error") };
  const msg = body as RpcMessage;
  if (msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return { status: 400, body: rpcError(null, -32600, "invalid request") };
  if (!isRequest(msg)) return { status: 202 };
  return { status: 200, body: await dispatch(msg, api) };
}

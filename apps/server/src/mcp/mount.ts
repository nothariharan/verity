import type { FastifyInstance } from "fastify";
import { bearerAllowed, headerOne, originAllowed } from "./auth";
import { handleMcpMessage } from "./protocol";
import type { McpApi } from "./tools";

export function mountMcp(app: FastifyInstance, opts: { apiKey?: string; allowedOrigins: string[]; api: McpApi }) {
  const guard = (headers: { authorization?: string | string[]; origin?: string | string[] }) => {
    if (!originAllowed(headerOne(headers.origin), opts.allowedOrigins)) return 403 as const;
    if (!bearerAllowed(headerOne(headers.authorization), opts.apiKey)) return 401 as const;
    return null;
  };

  app.get("/mcp", async (req, reply) => {
    const denied = guard(req.headers);
    if (denied) return reply.code(denied).send({ error: denied === 401 ? "unauthorized" : "origin_not_allowed" });
    return reply.code(405).send({ error: "method_not_allowed" });
  });

  app.delete("/mcp", async (req, reply) => {
    const denied = guard(req.headers);
    if (denied) return reply.code(denied).send({ error: denied === 401 ? "unauthorized" : "origin_not_allowed" });
    return reply.code(405).send({ error: "method_not_allowed" });
  });

  app.post("/mcp", async (req, reply) => {
    const denied = guard(req.headers);
    if (denied) return reply.code(denied).send({ error: denied === 401 ? "unauthorized" : "origin_not_allowed" });
    const result = await handleMcpMessage(req.body, opts.api);
    if (result.status === 202) return reply.code(202).send();
    const accept = headerOne(req.headers.accept) ?? "";
    const jsonOk = !accept || accept.includes("application/json") || accept.includes("*/*");
    if (!jsonOk && accept.includes("text/event-stream") && result.body !== undefined) {
      reply.header("content-type", "text/event-stream");
      reply.header("cache-control", "no-cache");
      return reply.code(result.status).send(`event: message\ndata: ${JSON.stringify(result.body)}\n\n`);
    }
    return reply.code(result.status).send(result.body);
  });
}

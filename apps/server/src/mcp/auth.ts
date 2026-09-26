import { timingSafeEqual } from "node:crypto";

export function headerOne(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Empty key means local use: the route stays open. A set key requires Bearer. */
export function bearerAllowed(authorization: string | undefined, apiKey: string | undefined): boolean {
  if (!apiKey) return true;
  const match = authorization ? /^Bearer\s+(\S+)\s*$/i.exec(authorization) : null;
  const token = match?.[1];
  if (!token) return false;
  const got = Buffer.from(token);
  const want = Buffer.from(apiKey);
  if (got.length !== want.length) return false;
  return timingSafeEqual(got, want);
}

/**
 * Native MCP clients omit Origin. Browsers send it. Localhost is allowed so the
 * website can call the same host; any other origin must be in WEB_ORIGIN.
 */
export function originAllowed(origin: string | undefined, allowed: string[]): boolean {
  if (!origin) return true;
  let host = "";
  try {
    host = new URL(origin).hostname;
  } catch {
    return false;
  }
  if (host === "localhost" || host === "127.0.0.1") return true;
  const normalized = origin.replace(/\/$/, "");
  return allowed.some((entry) => entry.replace(/\/$/, "") === normalized);
}

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const events = sqliteTable(
  "events",
  {
    sessionId: text("session_id").notNull(),
    seq: integer("seq").notNull(),
    type: text("type").notNull(),
    atMs: integer("at_ms").notNull(),
    payload: text("payload").notNull(),
    prevHash: text("prev_hash").notNull(),
    hash: text("hash").notNull(),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.seq] })],
);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at").notNull(),
  mode: text("mode").notNull(),
  role: text("role").notNull(),
  candidateName: text("candidate_name"),
});

const BOOTSTRAP = [
  `CREATE TABLE IF NOT EXISTS events (
    session_id TEXT NOT NULL, seq INTEGER NOT NULL, type TEXT NOT NULL, at_ms INTEGER NOT NULL,
    payload TEXT NOT NULL, prev_hash TEXT NOT NULL, hash TEXT NOT NULL,
    PRIMARY KEY (session_id, seq))`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, mode TEXT NOT NULL, role TEXT NOT NULL, candidate_name TEXT)`,
];

export type Db = LibSQLDatabase<{ events: typeof events; sessions: typeof sessions }>;

export async function openDb(url: string): Promise<{ db: Db; client: Client }> {
  if (url.startsWith("file:") && !url.includes(":memory:")) {
    mkdirSync(dirname(url.slice("file:".length)), { recursive: true });
  }
  const client = createClient({ url });
  for (const sql of BOOTSTRAP) await client.execute(sql);
  const db = drizzle(client, { schema: { events, sessions } });
  return { db, client };
}

import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema";

type Database = ReturnType<typeof createDatabase>;

let database: Database | undefined;

function createDatabase(databaseUrl: string) {
  return drizzle(databaseUrl, { schema });
}

export function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to load the destination catalog.");
  }

  database ??= createDatabase(databaseUrl);
  return database;
}

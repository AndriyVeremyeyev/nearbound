import { migrate } from "drizzle-orm/neon-http/migrator";

import { loadLocalEnvironment } from "./load-local-env";

loadLocalEnvironment();

const { getDatabase } = await import("@/lib/db/client");

await migrate(getDatabase(), { migrationsFolder: "./db/migrations" });

console.log("Database migrations are up to date.");

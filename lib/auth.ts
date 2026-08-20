import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import {
  authAccounts,
  authSessions,
  authVerifications,
  users,
} from "@/db/schema";
import { getDatabase } from "@/lib/db/client";

export const auth = betterAuth({
  appName: "Nearbound",
  database: drizzleAdapter(getDatabase(), {
    provider: "pg",
    schema: {
      user: users,
      session: authSessions,
      account: authAccounts,
      verification: authVerifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
});

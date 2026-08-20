import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { userSavedOrigins } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db/client";

type RouteContext = { params: Promise<{ originId: string }> };

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Sign in to update saved starting points." }, { status: 401 });

  const { originId } = await params;
  const [origin] = await getDatabase()
    .delete(userSavedOrigins)
    .where(and(eq(userSavedOrigins.id, originId), eq(userSavedOrigins.userId, session.user.id)))
    .returning({ id: userSavedOrigins.id });
  if (!origin) return Response.json({ error: "Saved starting point not found." }, { status: 404 });

  return Response.json({ id: origin.id, status: "removed" });
}

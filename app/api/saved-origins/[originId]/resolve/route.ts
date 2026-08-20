import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { userSavedOrigins } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db/client";
import { MapboxSearchError, resolveSavedOriginQuery } from "@/lib/trips/mapbox-search";

type RouteContext = { params: Promise<{ originId: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Sign in to use a saved starting point." }, { status: 401 });

  const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
  if (!accessToken) return Response.json({ error: "Starting-point search is not configured on this environment." }, { status: 503 });

  const { originId } = await params;
  const [savedOrigin] = await getDatabase()
    .select({ addressInput: userSavedOrigins.addressInput })
    .from(userSavedOrigins)
    .where(and(eq(userSavedOrigins.id, originId), eq(userSavedOrigins.userId, session.user.id)));
  if (!savedOrigin) return Response.json({ error: "Saved starting point not found." }, { status: 404 });

  try {
    const origin = await resolveSavedOriginQuery({ accessToken, query: savedOrigin.addressInput });
    return Response.json({ origin });
  } catch (error) {
    if (error instanceof MapboxSearchError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Saved starting point is temporarily unavailable." }, { status: 502 });
  }
}

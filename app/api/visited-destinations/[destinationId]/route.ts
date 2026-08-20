import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { destinations, userDestinationHistory } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db/client";

type RouteContext = { params: Promise<{ destinationId: string }> };

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function POST(_request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to save visited places." }, { status: 401 });

  const { destinationId } = await params;
  const database = getDatabase();
  const [destination] = await database.select({ id: destinations.id }).from(destinations)
    .where(and(eq(destinations.id, destinationId), eq(destinations.published, true)));
  if (!destination) return NextResponse.json({ error: "Destination not found." }, { status: 404 });

  await database.insert(userDestinationHistory).values({ userId: user.id, destinationId }).onConflictDoNothing();
  return NextResponse.json({ destinationId, status: "visited" });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to update visited places." }, { status: 401 });

  const { destinationId } = await params;
  await getDatabase().delete(userDestinationHistory).where(
    and(eq(userDestinationHistory.userId, user.id), eq(userDestinationHistory.destinationId, destinationId)),
  );
  return NextResponse.json({ destinationId, status: "removed" });
}

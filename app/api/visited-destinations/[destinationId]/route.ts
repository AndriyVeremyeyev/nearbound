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

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to update visited places." }, { status: 401 });

  const body = await request.json() as { rating?: unknown; note?: unknown };
  const rating = body.rating === null ? null : body.rating;
  const note = body.note === null ? null : body.note;
  if (rating !== undefined && rating !== null && (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
  }
  if (note !== undefined && note !== null && (typeof note !== "string" || note.length > 1000)) {
    return NextResponse.json({ error: "Note must be 1,000 characters or fewer." }, { status: 400 });
  }

  const { destinationId } = await params;
  const update: { rating?: number | null; note?: string | null; updatedAt: Date } = { updatedAt: new Date() };
  if (rating !== undefined) update.rating = rating as number | null;
  if (note !== undefined) update.note = typeof note === "string" ? note.trim() || null : note;

  const [history] = await getDatabase().update(userDestinationHistory).set(update).where(
    and(eq(userDestinationHistory.userId, user.id), eq(userDestinationHistory.destinationId, destinationId)),
  ).returning({ destinationId: userDestinationHistory.destinationId, rating: userDestinationHistory.rating, note: userDestinationHistory.note });
  if (!history) return NextResponse.json({ error: "Mark this place as visited first." }, { status: 404 });
  return NextResponse.json(history);
}

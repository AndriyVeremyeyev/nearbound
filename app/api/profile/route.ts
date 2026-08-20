import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db/client";

function readName(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Sign in to update your profile." }, { status: 401 });

  let body: { firstName?: unknown; lastName?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const firstName = readName(body.firstName);
  const lastName = readName(body.lastName);
  if (!firstName || !lastName || firstName.length > 80 || lastName.length > 80) {
    return Response.json({ error: "Enter a first and last name of up to 80 characters each." }, { status: 400 });
  }

  const [profile] = await getDatabase()
    .update(users)
    .set({
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id))
    .returning({ firstName: users.firstName, lastName: users.lastName });

  return Response.json(profile);
}

import { headers } from "next/headers";

import { userSavedOrigins } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db/client";

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Sign in to save a starting point." }, { status: 401 });

  let body: {
    label?: unknown;
    streetAddress?: unknown;
    city?: unknown;
    regionCode?: unknown;
    postalCode?: unknown;
    countryCode?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const label = readText(body.label);
  const streetAddress = readText(body.streetAddress);
  const city = readText(body.city);
  const regionCode = readText(body.regionCode).toUpperCase();
  const postalCode = readText(body.postalCode).toUpperCase();
  const countryCode = readText(body.countryCode).toUpperCase();
  if (
    !label || label.length > 60 || !streetAddress || streetAddress.length > 140
    || !city || city.length > 80 || !/^[A-Z]{2}$/.test(regionCode)
    || !postalCode || postalCode.length > 16 || !["US", "CA"].includes(countryCode)
  ) {
    return Response.json({ error: "Enter a complete address with a state or province and ZIP or postal code." }, { status: 400 });
  }

  const addressInput = `${streetAddress}, ${city}, ${regionCode} ${postalCode}, ${countryCode}`;

  const origin = {
    id: crypto.randomUUID(),
    userId: session.user.id,
    label,
    addressInput,
    streetAddress,
    city,
    regionCode,
    postalCode,
    countryCode,
  };
  await getDatabase().insert(userSavedOrigins).values(origin);
  return Response.json(origin, { status: 201 });
}

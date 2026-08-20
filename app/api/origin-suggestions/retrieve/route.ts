import {
  MapboxSearchError,
  retrieveOriginSuggestion,
} from "@/lib/trips/mapbox-search";

export async function POST(request: Request) {
  const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
  if (!accessToken) {
    return Response.json(
      { error: "Starting-point search is not configured on this environment." },
      { status: 503 },
    );
  }

  let body: { suggestionId?: unknown; sessionToken?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (typeof body.suggestionId !== "string" || typeof body.sessionToken !== "string") {
    return Response.json({ error: "A suggested starting point is required." }, { status: 400 });
  }

  try {
    const origin = await retrieveOriginSuggestion({
      accessToken,
      suggestionId: body.suggestionId,
      sessionToken: body.sessionToken,
    });
    return Response.json({ origin });
  } catch (error) {
    if (error instanceof MapboxSearchError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "Starting-point confirmation is temporarily unavailable." },
      { status: 502 },
    );
  }
}

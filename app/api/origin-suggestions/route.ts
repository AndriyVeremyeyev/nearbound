import {
  findOriginSuggestions,
  MapboxSearchError,
} from "@/lib/trips/mapbox-search";

export async function GET(request: Request) {
  const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
  if (!accessToken) {
    return Response.json(
      { error: "Starting-point search is not configured on this environment." },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const sessionToken = url.searchParams.get("sessionToken") ?? "";

  try {
    const suggestions = await findOriginSuggestions({
      accessToken,
      query,
      sessionToken,
    });
    return Response.json({ suggestions });
  } catch (error) {
    if (error instanceof MapboxSearchError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "Starting-point suggestions are temporarily unavailable." },
      { status: 502 },
    );
  }
}

export type OriginSuggestion = {
  id: string;
  label: string;
  context: string;
};

export type ResolvedOrigin = {
  label: string;
  latitude: number;
  longitude: number;
};

type MapboxSuggestionResponse = {
  suggestions?: Array<{
    mapbox_id?: string;
    name?: string;
    full_address?: string;
    place_formatted?: string;
  }>;
};

type MapboxRetrieveResponse = {
  features?: Array<{
    properties?: {
      name?: string;
      full_address?: string;
      place_formatted?: string;
      coordinates?: { latitude?: unknown; longitude?: unknown };
    };
  }>;
};

export class MapboxSearchError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function assertSessionToken(sessionToken: string) {
  if (!/^[a-zA-Z0-9-]{16,100}$/.test(sessionToken)) {
    throw new MapboxSearchError("The search session is invalid. Try typing the location again.", 400);
  }
}

function assertQuery(query: string) {
  if (query.trim().length < 3 || query.trim().length > 180) {
    throw new MapboxSearchError("Enter at least three characters to search for a starting point.", 400);
  }
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    throw new MapboxSearchError("Mapbox returned an unreadable search response.", 502);
  }
}

export async function findOriginSuggestions({
  accessToken,
  query,
  sessionToken,
  fetcher = fetch,
}: {
  accessToken: string;
  query: string;
  sessionToken: string;
  fetcher?: typeof fetch;
}): Promise<OriginSuggestion[]> {
  const trimmedQuery = query.trim();
  assertQuery(trimmedQuery);
  assertSessionToken(sessionToken);

  const url = new URL("https://api.mapbox.com/search/searchbox/v1/suggest");
  url.searchParams.set("q", trimmedQuery);
  url.searchParams.set("session_token", sessionToken);
  url.searchParams.set("country", "US,CA");
  url.searchParams.set("types", "address,place,locality,neighborhood");
  url.searchParams.set("proximity", "-122.3321,47.6062");
  url.searchParams.set("limit", "5");
  url.searchParams.set("access_token", accessToken);

  const response = await fetcher(url);
  if (!response.ok) {
    throw new MapboxSearchError("Mapbox could not find starting-point suggestions.", 502);
  }

  const payload = (await readJson(response)) as MapboxSuggestionResponse;
  return (payload.suggestions ?? []).flatMap((suggestion) => {
    if (!suggestion.mapbox_id || !suggestion.name || !suggestion.place_formatted) return [];

    return [{
      id: suggestion.mapbox_id,
      label: suggestion.full_address ?? `${suggestion.name}, ${suggestion.place_formatted}`,
      context: suggestion.place_formatted,
    }];
  });
}

export async function retrieveOriginSuggestion({
  accessToken,
  suggestionId,
  sessionToken,
  fetcher = fetch,
}: {
  accessToken: string;
  suggestionId: string;
  sessionToken: string;
  fetcher?: typeof fetch;
}): Promise<ResolvedOrigin> {
  if (!/^[a-zA-Z0-9._:-]{1,200}$/.test(suggestionId)) {
    throw new MapboxSearchError("That starting point is invalid. Search again and choose a suggestion.", 400);
  }
  assertSessionToken(sessionToken);

  const url = new URL(
    `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(suggestionId)}`,
  );
  url.searchParams.set("session_token", sessionToken);
  url.searchParams.set("access_token", accessToken);

  const response = await fetcher(url);
  if (!response.ok) {
    throw new MapboxSearchError("Mapbox could not confirm that starting point.", 502);
  }

  const payload = (await readJson(response)) as MapboxRetrieveResponse;
  const properties = payload.features?.[0]?.properties;
  const latitude = properties?.coordinates?.latitude;
  const longitude = properties?.coordinates?.longitude;
  const label = properties?.full_address ?? properties?.place_formatted ?? properties?.name;

  if (
    !label ||
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new MapboxSearchError("Mapbox did not return a usable starting point.", 502);
  }

  return { label, latitude, longitude };
}

export function isResolvedOrigin(value: unknown): value is ResolvedOrigin {
  if (!value || typeof value !== "object") return false;

  const origin = value as Record<string, unknown>;
  return (
    typeof origin.label === "string" &&
    origin.label.trim().length >= 2 &&
    origin.label.length <= 240 &&
    typeof origin.latitude === "number" &&
    Number.isFinite(origin.latitude) &&
    origin.latitude >= -90 &&
    origin.latitude <= 90 &&
    typeof origin.longitude === "number" &&
    Number.isFinite(origin.longitude) &&
    origin.longitude >= -180 &&
    origin.longitude <= 180
  );
}

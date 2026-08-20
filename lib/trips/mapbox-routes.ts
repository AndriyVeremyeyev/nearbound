import type { RoutableDestination } from "./repository";
import type { ResolvedOrigin } from "./mapbox-search";

const MAX_DESTINATIONS_PER_REQUEST = 24;

export type LiveRouteEstimate = {
  destinationId: string;
  durationMinutes: number;
  distanceMeters: number | null;
};

export type LiveRouteResult = {
  originLabel: string;
  calculatedAt: string;
  routes: LiveRouteEstimate[];
};

type MapboxMatrixResponse = {
  code?: string;
  durations?: Array<Array<number | null>>;
  distances?: Array<Array<number | null>>;
};

export class MapboxRouteError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    throw new MapboxRouteError("Mapbox returned an unreadable response.", 502);
  }
}

export async function calculateLiveRouteEstimates({
  accessToken,
  origin,
  destinations,
  fetcher = fetch,
  now = () => new Date(),
}: {
  accessToken: string;
  origin: ResolvedOrigin;
  destinations: readonly RoutableDestination[];
  fetcher?: typeof fetch;
  now?: () => Date;
}): Promise<LiveRouteResult> {
  if (destinations.length === 0 || destinations.length > MAX_DESTINATIONS_PER_REQUEST) {
    throw new MapboxRouteError("The destination catalog cannot be routed right now.", 500);
  }

  const coordinates = [
    [origin.longitude, origin.latitude] as const,
    ...destinations.map((destination) => [destination.longitude, destination.latitude] as const),
  ];
  const matrixUrl = new URL("https://api.mapbox.com/directions-matrix/v1/mapbox/driving");
  matrixUrl.pathname += `/${coordinates.map(([longitude, latitude]) => `${longitude},${latitude}`).join(";")}`;
  matrixUrl.searchParams.set("sources", "0");
  matrixUrl.searchParams.set(
    "destinations",
    destinations.map((_, index) => index + 1).join(";"),
  );
  matrixUrl.searchParams.set("annotations", "duration,distance");
  matrixUrl.searchParams.set("access_token", accessToken);

  const matrixResponse = await fetcher(matrixUrl);
  if (!matrixResponse.ok) {
    throw new MapboxRouteError("Mapbox could not calculate the live drive times.", 502);
  }

  const matrix = (await readJson(matrixResponse)) as MapboxMatrixResponse;
  if (matrix.code !== "Ok" || !matrix.durations?.[0]) {
    throw new MapboxRouteError("Mapbox did not return usable drive times.", 502);
  }

  const routes = destinations.flatMap((destination, index) => {
    const durationSeconds = matrix.durations?.[0]?.[index];
    if (typeof durationSeconds !== "number") return [];

    const distanceMeters = matrix.distances?.[0]?.[index];
    return [{
      destinationId: destination.id,
      durationMinutes: Math.round(durationSeconds / 60),
      distanceMeters: typeof distanceMeters === "number" ? distanceMeters : null,
    }];
  });

  if (routes.length === 0) {
    throw new MapboxRouteError("No drivable route was found for the current catalog.", 404);
  }

  return {
    originLabel: origin.label,
    calculatedAt: now().toISOString(),
    routes,
  };
}

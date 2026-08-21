import type { RoutableDestination } from "./repository";
import type { ResolvedOrigin } from "./mapbox-search";

const MAX_DESTINATIONS_PER_REQUEST = 24;
const MAX_ROUTE_AREAS_PER_REQUEST = 24;

export type LiveRouteEstimate = {
  destinationId: string;
  durationMinutes: number;
  distanceMeters: number | null;
  returnDurationMinutes: number;
  returnDistanceMeters: number | null;
};

export type LiveRouteResult = {
  originLabel: string;
  calculatedAt: string;
  routes: LiveRouteEstimate[];
  routeAccess?: readonly LiveRouteAccessEstimate[];
};

export type LiveRouteAccessEstimate = {
  areaId: string;
  outboundMinutes: number;
  outboundDistanceMeters: number | null;
  returnMinutes: number;
  returnDistanceMeters: number | null;
};

export type RoutableRouteArea = {
  id: string;
  latitude: number;
  longitude: number;
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

function createMatrixUrl({
  accessToken,
  coordinates,
  sources,
  destinations,
}: {
  accessToken: string;
  coordinates: readonly (readonly [number, number])[];
  sources?: string;
  destinations?: string;
}) {
  const matrixUrl = new URL("https://api.mapbox.com/directions-matrix/v1/mapbox/driving");
  matrixUrl.pathname += `/${coordinates.map(([longitude, latitude]) => `${longitude},${latitude}`).join(";")}`;
  if (sources) matrixUrl.searchParams.set("sources", sources);
  if (destinations) matrixUrl.searchParams.set("destinations", destinations);
  matrixUrl.searchParams.set("annotations", "duration,distance");
  matrixUrl.searchParams.set("access_token", accessToken);
  return matrixUrl;
}

async function calculateMatrix({
  accessToken,
  coordinates,
  sources,
  destinations,
  fetcher,
  errorMessage,
}: {
  accessToken: string;
  coordinates: readonly (readonly [number, number])[];
  sources?: string;
  destinations?: string;
  fetcher: typeof fetch;
  errorMessage: string;
}) {
  const matrixResponse = await fetcher(
    createMatrixUrl({ accessToken, coordinates, sources, destinations }),
  );
  if (!matrixResponse.ok) {
    throw new MapboxRouteError(errorMessage, 502);
  }

  const matrix = (await readJson(matrixResponse)) as MapboxMatrixResponse;
  if (matrix.code !== "Ok" || !matrix.durations?.length) {
    throw new MapboxRouteError(errorMessage, 502);
  }

  return matrix;
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
  const matrices = destinations.length === 1
    ? [
        await calculateMatrix({
          accessToken,
          coordinates,
          fetcher,
          errorMessage: "Mapbox could not calculate the live drive times.",
        }),
      ] as const
    : await Promise.all([
        calculateMatrix({
          accessToken,
          coordinates,
          sources: "0",
          destinations: destinations.map((_, index) => index + 1).join(";"),
          fetcher,
          errorMessage: "Mapbox could not calculate the live drive times.",
        }),
        calculateMatrix({
          accessToken,
          coordinates,
          sources: destinations.map((_, index) => index + 1).join(";"),
          destinations: "0",
          fetcher,
          errorMessage: "Mapbox could not calculate the live drive times.",
        }),
      ] as const);
  const [outboundMatrix, returnMatrix = outboundMatrix] = matrices;

  const routes = destinations.flatMap((destination, index) => {
    const durationSeconds = outboundMatrix.durations?.[0]?.[destinations.length === 1 ? 1 : index];
    const returnSeconds = returnMatrix.durations?.[destinations.length === 1 ? 1 : index]?.[destinations.length === 1 ? 0 : 0];
    if (typeof durationSeconds !== "number" || typeof returnSeconds !== "number") return [];

    const distanceMeters = outboundMatrix.distances?.[0]?.[destinations.length === 1 ? 1 : index];
    const returnDistanceMeters = returnMatrix.distances?.[destinations.length === 1 ? 1 : index]?.[0];
    return [{
      destinationId: destination.id,
      durationMinutes: Math.round(durationSeconds / 60),
      distanceMeters: typeof distanceMeters === "number" ? distanceMeters : null,
      returnDurationMinutes: Math.round(returnSeconds / 60),
      returnDistanceMeters:
        typeof returnDistanceMeters === "number" ? returnDistanceMeters : null,
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

export async function calculateLiveRouteAccessEstimates({
  accessToken,
  origin,
  areas,
  fetcher = fetch,
}: {
  accessToken: string;
  origin: ResolvedOrigin;
  areas: readonly RoutableRouteArea[];
  fetcher?: typeof fetch;
}): Promise<LiveRouteAccessEstimate[]> {
  if (areas.length === 0 || areas.length > MAX_ROUTE_AREAS_PER_REQUEST) {
    throw new MapboxRouteError("Route areas cannot be routed right now.", 500);
  }

  const coordinates = [
    [origin.longitude, origin.latitude] as const,
    ...areas.map((area) => [area.longitude, area.latitude] as const),
  ];

  if (areas.length === 1) {
    const matrix = await calculateMatrix({
      accessToken,
      coordinates,
      fetcher,
      errorMessage: "Mapbox could not calculate access to this trip.",
    });
    const outboundSeconds = matrix.durations?.[0]?.[1];
    const returnSeconds = matrix.durations?.[1]?.[0];

    if (typeof outboundSeconds !== "number" || typeof returnSeconds !== "number") {
      return [];
    }

    const area = areas[0];
    const outboundDistanceMeters = matrix.distances?.[0]?.[1];
    const returnDistanceMeters = matrix.distances?.[1]?.[0];
    return [{
      areaId: area.id,
      outboundMinutes: Math.round(outboundSeconds / 60),
      outboundDistanceMeters:
        typeof outboundDistanceMeters === "number" ? outboundDistanceMeters : null,
      returnMinutes: Math.round(returnSeconds / 60),
      returnDistanceMeters:
        typeof returnDistanceMeters === "number" ? returnDistanceMeters : null,
    }];
  }

  const areaIndexes = areas.map((_, index) => index + 1).join(";");
  const [outboundMatrix, returnMatrix] = await Promise.all([
    calculateMatrix({
      accessToken,
      coordinates,
      sources: "0",
      destinations: areaIndexes,
      fetcher,
      errorMessage: "Mapbox could not calculate access to this trip.",
    }),
    calculateMatrix({
      accessToken,
      coordinates,
      sources: areaIndexes,
      destinations: "0",
      fetcher,
      errorMessage: "Mapbox could not calculate access to this trip.",
    }),
  ]);

  return areas.flatMap((area, index) => {
    const outboundSeconds = outboundMatrix.durations?.[0]?.[index];
    const returnSeconds = returnMatrix.durations?.[index]?.[0];
    if (typeof outboundSeconds !== "number" || typeof returnSeconds !== "number") {
      return [];
    }

    const outboundDistanceMeters = outboundMatrix.distances?.[0]?.[index];
    const returnDistanceMeters = returnMatrix.distances?.[index]?.[0];
    return [{
      areaId: area.id,
      outboundMinutes: Math.round(outboundSeconds / 60),
      outboundDistanceMeters:
        typeof outboundDistanceMeters === "number" ? outboundDistanceMeters : null,
      returnMinutes: Math.round(returnSeconds / 60),
      returnDistanceMeters:
        typeof returnDistanceMeters === "number" ? returnDistanceMeters : null,
    }];
  });
}

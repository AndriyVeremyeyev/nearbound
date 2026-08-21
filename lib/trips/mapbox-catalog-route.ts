import type { RouteCatalog } from "@/lib/catalog/compose-trip";
import type { ResolvedOrigin } from "./mapbox-search";
import { MapboxRouteError } from "./mapbox-routes";

const MAX_ROUTE_WAYPOINTS = 25;

export type CatalogRouteGeometry = {
  routeId: string;
  coordinates: readonly (readonly [number, number])[];
  includesTemporaryOrigin: boolean;
};

type MapboxDirectionsResponse = {
  code?: string;
  routes?: Array<{
    geometry?: {
      type?: string;
      coordinates?: unknown;
    };
  }>;
};

function isCoordinatePair(value: unknown): value is [number, number] {
  return Array.isArray(value)
    && value.length === 2
    && value.every((coordinate) => typeof coordinate === "number");
}

function routeCoordinates(
  catalog: Pick<RouteCatalog, "shape" | "areas">,
  origin?: ResolvedOrigin,
) {
  const areas = catalog.areas.map((area) => [area.longitude, area.latitude] as const);

  if (catalog.shape === "loop" && origin) {
    const temporaryOrigin = [origin.longitude, origin.latitude] as const;
    return [temporaryOrigin, ...areas, temporaryOrigin] as const;
  }

  return areas;
}

export function createCatalogRouteDirectionsUrl({
  accessToken,
  catalog,
  origin,
}: {
  accessToken: string;
  catalog: Pick<RouteCatalog, "shape" | "areas">;
  origin?: ResolvedOrigin;
}) {
  const coordinates = routeCoordinates(catalog, origin);
  if (coordinates.length < 2 || coordinates.length > MAX_ROUTE_WAYPOINTS) {
    throw new MapboxRouteError("This route cannot be drawn from the current catalog.", 500);
  }

  const url = new URL("https://api.mapbox.com/directions/v5/mapbox/driving");
  url.pathname += `/${coordinates.map(([longitude, latitude]) => `${longitude},${latitude}`).join(";")}`;
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("steps", "false");
  url.searchParams.set("access_token", accessToken);
  return url;
}

export async function calculateCatalogRouteGeometry({
  accessToken,
  catalog,
  origin,
  fetcher = fetch,
}: {
  accessToken: string;
  catalog: Pick<RouteCatalog, "id" | "shape" | "areas">;
  origin?: ResolvedOrigin;
  fetcher?: typeof fetch;
}): Promise<CatalogRouteGeometry> {
  const response = await fetcher(
    createCatalogRouteDirectionsUrl({ accessToken, catalog, origin }),
  );
  if (!response.ok) {
    throw new MapboxRouteError("Mapbox could not draw this route right now.", 502);
  }

  let result: MapboxDirectionsResponse;
  try {
    result = await response.json() as MapboxDirectionsResponse;
  } catch {
    throw new MapboxRouteError("Mapbox returned an unreadable route geometry.", 502);
  }

  const geometry = result.routes?.[0]?.geometry;
  if (
    result.code !== "Ok"
    || geometry?.type !== "LineString"
    || !Array.isArray(geometry.coordinates)
    || !geometry.coordinates.every(isCoordinatePair)
  ) {
    throw new MapboxRouteError("Mapbox could not draw this route right now.", 502);
  }

  return {
    routeId: catalog.id,
    coordinates: geometry.coordinates,
    includesTemporaryOrigin: catalog.shape === "loop" && Boolean(origin),
  };
}

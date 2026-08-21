import { loadRouteCatalog } from "@/lib/catalog/repository";
import { calculateCatalogRouteGeometry } from "@/lib/trips/mapbox-catalog-route";
import { MapboxRouteError } from "@/lib/trips/mapbox-routes";
import { isResolvedOrigin } from "@/lib/trips/mapbox-search";

type RouteGeometryRequest = {
  origin?: unknown;
  areaIds?: unknown;
};

function selectedCatalogAreas(
  catalog: Awaited<ReturnType<typeof loadRouteCatalog>>,
  requestedAreaIds: unknown,
) {
  if (!catalog || !Array.isArray(requestedAreaIds) || requestedAreaIds.length < 2) {
    return null;
  }
  if (!requestedAreaIds.every((areaId) => typeof areaId === "string")) return null;

  const firstIndex = catalog.areas.findIndex((area) => area.id === requestedAreaIds[0]);
  if (firstIndex < 0) return null;
  const selectedAreas = catalog.areas.slice(firstIndex, firstIndex + requestedAreaIds.length);
  if (!selectedAreas.every((area, index) => area.id === requestedAreaIds[index])) return null;

  return { ...catalog, areas: selectedAreas };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ routeId: string }> },
) {
  const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
  if (!accessToken) {
    return Response.json({ error: "Route drawing is not configured on this environment." }, { status: 503 });
  }

  let body: RouteGeometryRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { routeId } = await params;
  const catalog = await loadRouteCatalog(routeId);
  if (!catalog) {
    return Response.json({ error: "This route is not available." }, { status: 404 });
  }
  const selectedCatalog = selectedCatalogAreas(catalog, body.areaIds);
  if (!selectedCatalog) {
    return Response.json({ error: "This route segment is not available." }, { status: 400 });
  }
  if (selectedCatalog.shape === "loop" && !isResolvedOrigin(body.origin)) {
    return Response.json({ error: "Choose a starting point before drawing this loop." }, { status: 400 });
  }

  try {
    const geometry = await calculateCatalogRouteGeometry({
      accessToken,
      catalog: selectedCatalog,
      origin: isResolvedOrigin(body.origin) ? body.origin : undefined,
    });
    return Response.json(geometry, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof MapboxRouteError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: "Route drawing is temporarily unavailable." }, { status: 502 });
  }
}

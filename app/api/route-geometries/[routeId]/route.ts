import { loadRouteCatalog } from "@/lib/catalog/repository";
import { calculateCatalogRouteGeometry } from "@/lib/trips/mapbox-catalog-route";
import { MapboxRouteError } from "@/lib/trips/mapbox-routes";
import { isResolvedOrigin } from "@/lib/trips/mapbox-search";

type RouteGeometryRequest = {
  origin?: unknown;
};

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
  if (catalog.shape === "loop" && !isResolvedOrigin(body.origin)) {
    return Response.json({ error: "Choose a starting point before drawing this loop." }, { status: 400 });
  }

  try {
    const geometry = await calculateCatalogRouteGeometry({
      accessToken,
      catalog,
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

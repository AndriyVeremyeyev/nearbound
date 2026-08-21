import { OREGON_COAST_ROUTE_ID } from "@/lib/catalog/catalog-routes";
import { loadRouteCatalog } from "@/lib/catalog/repository";
import { loadRoutableDestinations } from "@/lib/trips/repository";
import {
  calculateLiveRouteAccessEstimates,
  calculateLiveRouteEstimates,
  MapboxRouteError,
} from "@/lib/trips/mapbox-routes";
import { isResolvedOrigin } from "@/lib/trips/mapbox-search";

export async function POST(request: Request) {
  const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
  if (!accessToken) {
    return Response.json(
      { error: "Live routing is not configured on this environment." },
      { status: 503 },
    );
  }

  let body: { origin?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isResolvedOrigin(body.origin)) {
    return Response.json(
      { error: "Choose a starting point from the suggestions first." },
      { status: 400 },
    );
  }

  try {
    const [destinations, oregonCoastCatalog] = await Promise.all([
      loadRoutableDestinations(),
      loadRouteCatalog(OREGON_COAST_ROUTE_ID),
    ]);
    const [result, routeAccess] = await Promise.all([
      calculateLiveRouteEstimates({
        accessToken,
        origin: body.origin,
        destinations,
      }),
      oregonCoastCatalog
        ? calculateLiveRouteAccessEstimates({
            accessToken,
            origin: body.origin,
            areas: oregonCoastCatalog.areas,
          })
        : Promise.resolve([]),
    ]);

    return Response.json({ ...result, routeAccess });
  } catch (error) {
    if (error instanceof MapboxRouteError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "Live routing is temporarily unavailable." },
      { status: 502 },
    );
  }
}

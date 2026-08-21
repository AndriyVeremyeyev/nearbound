import { loadDestinationCatalog, loadSavedOrigins, loadVisitedDestinationIds } from "@/lib/trips/repository";
import { OREGON_COAST_ROUTE_ID } from "@/lib/catalog/catalog-routes";
import { loadRouteCatalog } from "@/lib/catalog/repository";
import { getCurrentUser } from "@/lib/auth-session";
import { TripPlanner } from "./trip-planner";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toSearchString(searchParams: Record<string, string | string[] | undefined>) {
  const parameters = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) parameters.append(key, item);
    } else if (value !== undefined) {
      parameters.set(key, value);
    }
  }

  return parameters.toString();
}

export default async function Home({ searchParams }: HomeProps) {
  const [catalog, oregonCoastCatalog, currentUser] = await Promise.all([
    loadDestinationCatalog(),
    loadRouteCatalog(OREGON_COAST_ROUTE_ID),
    getCurrentUser(),
  ]);
  const [visitedDestinationIds, savedOrigins] = currentUser
    ? await Promise.all([
        loadVisitedDestinationIds(currentUser.id),
        loadSavedOrigins(currentUser.id),
      ])
    : [[], []];
  const initialSearch = toSearchString(await searchParams);

  return (
    <TripPlanner
      catalog={catalog}
      oregonCoastCatalog={oregonCoastCatalog}
      currentUser={currentUser}
      initialVisitedDestinationIds={visitedDestinationIds}
      savedOrigins={savedOrigins}
      initialSearch={initialSearch}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
    />
  );
}

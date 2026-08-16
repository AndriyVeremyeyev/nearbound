import { loadDestinationCatalog } from "@/lib/trips/repository";
import { TripPlanner } from "./trip-planner";

export const dynamic = "force-dynamic";

export default async function Home() {
  const catalog = await loadDestinationCatalog();

  return <TripPlanner catalog={catalog} />;
}

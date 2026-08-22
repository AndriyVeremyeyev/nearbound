import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth-session";
import { findTripIdea } from "@/lib/catalog/compose-trip";
import { loadRouteCatalog } from "@/lib/catalog/repository";
import { getTripIdeaMedia } from "@/lib/catalog/trip-idea-media";
import {
  createInitialPlannerState,
} from "@/lib/trips/planner-state";
import {
  readPlannerStateFromSearch,
  writePlannerSearch,
} from "@/lib/trips/planner-url-state";
import { AccountMenu } from "../../account-menu";
import { CatalogHeroImage } from "../../catalog-hero-image";
import { TripIdeaMap } from "../../trip-idea-map";

export const dynamic = "force-dynamic";

type TripPageProps = {
  params: Promise<{ routeId: string }>;
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

function readSingleSearchParameter(
  searchParams: Record<string, string | string[] | undefined>,
  name: string,
) {
  const value = searchParams[name];
  return typeof value === "string" ? value : null;
}

function formatDriveMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours ? `${hours}h ` : ""}${remainingMinutes ? `${remainingMinutes}m` : ""}`.trim();
}

function formatPace(pace: "easy" | "balanced" | "see-more") {
  return {
    easy: "Easy pace",
    balanced: "Balanced pace",
    "see-more": "See more",
  }[pace];
}

function groupAreasByDay<T>(areas: readonly T[], days: number) {
  const dayCount = Math.min(Math.max(1, Math.round(days)), areas.length);

  return Array.from({ length: dayCount }, (_, dayIndex) => {
    const start = Math.floor((dayIndex * areas.length) / dayCount);
    const end = Math.floor(((dayIndex + 1) * areas.length) / dayCount);
    return areas.slice(start, end);
  });
}

export default async function TripPage({ params, searchParams }: TripPageProps) {
  const { routeId } = await params;
  const routeSearchParams = await searchParams;
  const startAreaId = readSingleSearchParameter(routeSearchParams, "start");
  const endAreaId = readSingleSearchParameter(routeSearchParams, "end");
  if (!startAreaId || !endAreaId) notFound();

  const [catalog, currentUser] = await Promise.all([
    loadRouteCatalog(routeId),
    getCurrentUser(),
  ]);
  if (!catalog) notFound();

  const sharedPlannerState =
    readPlannerStateFromSearch(toSearchString(routeSearchParams)) ??
    createInitialPlannerState();
  const idea = findTripIdea(
    catalog,
    {
      days: sharedPlannerState.days,
      pace: sharedPlannerState.pace,
      preferences: sharedPlannerState.preferences,
      travelingWithChildren: sharedPlannerState.travelingWithChildren,
      allowFerryRoutes: sharedPlannerState.allowFerryRoutes,
    },
    { startAreaId, endAreaId },
  );
  if (!idea) notFound();

  const tripAreas = idea.areaIds.flatMap((areaId) => {
    const area = catalog.areas.find((candidate) => candidate.id === areaId);
    return area ? [area] : [];
  });
  if (tripAreas.length !== idea.areaIds.length) notFound();

  const selectedStops = [...idea.stops].sort(
    (left, right) =>
      idea.areaIds.indexOf(left.areaId) - idea.areaIds.indexOf(right.areaId),
  );
  const tripDays = groupAreasByDay(tripAreas, sharedPlannerState.days);
  const plannerSearch = writePlannerSearch(sharedPlannerState);
  const backHref = `/${plannerSearch ? `?${plannerSearch}` : ""}#matches`;
  const heroMedia = getTripIdeaMedia({ routeId: catalog.id });

  return (
    <main className="destination-page trip-detail-page">
      <header className="detail-header">
        <Link className="brand" href="/" aria-label="Nearbound home">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>nearbound</span>
        </Link>
        <div className="detail-nav">
          <Link className="detail-back" href={backHref}>← Back to matches</Link>
          <AccountMenu currentUser={currentUser} />
        </div>
      </header>

      <section className="detail-hero">
        <p className="eyebrow">{catalog.shape === "loop" ? "Loop route" : "Route"} · {catalog.name}</p>
        <h1>{idea.title}</h1>
        <p>A {sharedPlannerState.days}-day route idea from {idea.startArea.name} to {idea.endArea.name}, with room to choose the anchors that suit the trip.</p>
        <div className="detail-tags">
          <span>{sharedPlannerState.days} days</span>
          <span>{formatPace(sharedPlannerState.pace)}</span>
          <span>{tripAreas.length} areas</span>
        </div>
        {heroMedia && <CatalogHeroImage media={heroMedia} />}
      </section>

      <section className="detail-layout">
        <aside className="detail-facts" aria-label="Trip context">
          <p className="eyebrow">Trip context</p>
          <dl>
            <div><dt>Begins in</dt><dd>{idea.startArea.name}</dd></div>
            <div><dt>Finishes in</dt><dd>{idea.endArea.name}</dd></div>
            <div><dt>Drive within the route</dt><dd>{idea.distanceMiles} miles · {formatDriveMinutes(idea.driveMinutes)}</dd></div>
            <div><dt>Selected anchors</dt><dd>{selectedStops.length} places</dd></div>
          </dl>
          <p className="detail-facts-note">Live time to begin the trip and get home stays in your active planner, where the selected starting point remains temporary.</p>
        </aside>

        <div className="detail-story">
          <section className="trip-detail-map-section">
            <p className="eyebrow">The route</p>
            <h2>One connected route, in order.</h2>
            <TripIdeaMap accessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN} areas={tripAreas} />
            <p className="trip-map-caption">The map shows the ordered area sequence, not turn-by-turn navigation.</p>
          </section>

          <section>
            <p className="eyebrow">How it unfolds</p>
            <h2>A flexible {sharedPlannerState.days}-day outline.</h2>
            <div className="trip-day-list">
              {tripDays.map((areasForDay, index) => (
                <article key={`day-${index + 1}`}>
                  <span>Day {index + 1}</span>
                  <strong>{areasForDay.map((area) => area.name).join(" → ")}</strong>
                  <p>Choose the anchors that work for the day instead of trying to complete every stop.</p>
                </article>
              ))}
            </div>
            <h3 className="trip-area-heading">Areas in order</h3>
            <ol className="trip-area-list">
              {tripAreas.map((area, index) => (
                <li key={area.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{area.name}</strong>
                    <p>{area.summary ?? "A curated planning area on this trip."}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <p className="eyebrow">Possible anchors</p>
            <h2>Choose the stops that make the trip yours.</h2>
            <div className="trip-stop-list">
              {selectedStops.map((stop) => (
                <article key={stop.id}>
                  <div>
                    <span>{formatDriveMinutes(stop.typicalDurationMinutes)}</span>
                    <h3>{stop.name}</h3>
                  </div>
                  <p>{stop.summary ?? "A curated anchor on this route."}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="detail-caution">
            <p className="eyebrow">Reality check</p>
            <h2>Keep the route flexible.</h2>
            <p>Drive estimates between areas are curated planning baselines. Check weather, road conditions, closures and timed access before you leave.</p>
          </section>

          {catalog.sourceReferences && catalog.sourceReferences.length > 0 && (
            <section className="detail-sources">
              <p className="eyebrow">Research sources</p>
              <h2>Start with the route’s official context.</h2>
              <ul>
                {catalog.sourceReferences.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>
                    <small>{source.publisherType} · {source.lastVerifiedAt ?? "date not recorded"}</small>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>

      <section className="detail-return">
        <div>
          <p className="eyebrow">Ready to compare?</p>
          <h2>Return to the planner for live access and the rest of your trip ideas.</h2>
        </div>
        <Link className="detail-primary-link" href={backHref}>Back to matches <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}

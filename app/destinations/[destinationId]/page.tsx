import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth-session";
import { loadDestinationById } from "@/lib/trips/repository";
import {
  readPlannerStateFromSearch,
  writePlannerSearch,
} from "@/lib/trips/planner-url-state";
import { AccountMenu } from "../../account-menu";

export const dynamic = "force-dynamic";

type DestinationPageProps = {
  params: Promise<{ destinationId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatDriveTime(hours: number) {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return `${whole}h ${minutes ? `${minutes}m` : ""}`.trim();
}

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

export default async function DestinationPage({ params, searchParams }: DestinationPageProps) {
  const { destinationId } = await params;
  const [destination, currentUser] = await Promise.all([
    loadDestinationById(destinationId),
    getCurrentUser(),
  ]);
  if (!destination) notFound();

  const sharedPlannerState = readPlannerStateFromSearch(toSearchString(await searchParams));
  const plannerSearch = sharedPlannerState ? writePlannerSearch(sharedPlannerState) : "";
  const backHref = `/${plannerSearch ? `?${plannerSearch}` : ""}#matches`;

  return (
    <main className="destination-page">
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
        <p className="eyebrow">{destination.region}</p>
        <h1>{destination.name}</h1>
        <p>{destination.summary}</p>
        <div className="detail-tags">
          <span>{destination.minDays === 1 && destination.maxDays <= 2 ? "Day-trip friendly" : `${destination.minDays}–${destination.maxDays} days`}</span>
          {destination.usesFerry && <span>Ferry route</span>}
          {destination.crossesBorder && <span>Border crossing</span>}
        </div>
      </section>

      <section className="detail-layout">
        <aside className="detail-facts" aria-label="Trip context">
          <p className="eyebrow">Trip context</p>
          <dl>
            <div><dt>Curated drive baseline</dt><dd>{formatDriveTime(destination.hours)} from Issaquah</dd></div>
            <div><dt>Best trip length</dt><dd>{destination.minDays}–{destination.maxDays} days</dd></div>
            <div><dt>Family fit</dt><dd>{destination.familyFit}/10</dd></div>
            <div><dt>Rain backup</dt><dd>{destination.weatherBackup}/10</dd></div>
          </dl>
          <p className="detail-facts-note">Live route times stay in the planner, where the chosen starting point remains temporary.</p>
        </aside>

        <div className="detail-story">
          <section>
            <p className="eyebrow">The anchor</p>
            <h2>One strong plan, not a packed itinerary.</h2>
            <p>{destination.anchor}</p>
          </section>
          <section>
            <p className="eyebrow">Where to stay</p>
            <h2>Keep the base easy.</h2>
            <p>{destination.stay}</p>
          </section>
          <section className="detail-caution">
            <p className="eyebrow">Reality check</p>
            <h2>What to plan around.</h2>
            <p>{destination.caution}</p>
          </section>
          <section className="detail-sources">
            <p className="eyebrow">Research sources</p>
            <h2>Start with the official details.</h2>
            <ul>
              {destination.sourceReferences.map((source) => (
                <li key={`${source.title}-${source.url}`}>
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>
                  ) : (
                    <span>{source.title}</span>
                  )}
                  <small>{source.sourceType} · {source.lastVerifiedAt ?? "date not recorded"}</small>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      <section className="detail-return">
        <div>
          <p className="eyebrow">Ready to compare?</p>
          <h2>Return to the shortlist with this context in mind.</h2>
        </div>
        <Link className="detail-primary-link" href={backHref}>Back to matches <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}

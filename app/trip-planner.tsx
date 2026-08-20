"use client";

import { FormEvent, useEffect, useMemo, useReducer, useState } from "react";
import type { CSSProperties } from "react";

import {
  createInitialPlannerState,
  plannerReducer,
  PLANNER_LIMITS,
  toTripCriteria,
} from "@/lib/trips/planner-state";
import { recommendDestinations } from "@/lib/trips/recommend";
import {
  clearPlannerSearch,
  readPlannerStateFromSearch,
  writePlannerSearch,
} from "@/lib/trips/planner-url-state";
import type {
  DestinationCatalog,
  ExcludedDestination,
  ExclusionReason,
  Preference,
} from "@/lib/trips/types";
import type {
  LiveRouteResult,
} from "@/lib/trips/mapbox-routes";
import type { ResolvedOrigin } from "@/lib/trips/mapbox-search";
import type { CurrentUser } from "@/lib/auth-session";
import { AccountMenu } from "./account-menu";
import { OriginAutocomplete } from "./origin-autocomplete";
import { PlannerWizard } from "./planner-wizard";

type TripPlannerProps = {
  catalog: DestinationCatalog;
  currentUser?: CurrentUser | null;
  initialSearch?: string;
};

const prototypeMapPositions: Record<string, CSSProperties> = {
  "point-defiance": { left: "43%", top: "59%" },
  "northwest-trek": { left: "50%", top: "70%" },
  "ocean-shores": { left: "14%", top: "69%" },
  bellingham: { left: "49%", top: "21%" },
  alderbrook: { left: "29%", top: "64%" },
  "great-wolf": { left: "44%", top: "78%" },
  suncadia: { left: "69%", top: "55%" },
  leavenworth: { left: "79%", top: "42%" },
  vancouver: { left: "50%", top: "7%" },
  seabrook: { left: "12%", top: "61%" },
  sequim: { left: "20%", top: "39%" },
  "long-beach": { left: "16%", top: "89%" },
  "gig-harbor": { left: "39%", top: "61%" },
  "whidbey-island": { left: "40%", top: "18%" },
  "port-townsend": { left: "25%", top: "28%" },
  "mount-rainier": { left: "64%", top: "80%" },
  "lake-chelan": { left: "91%", top: "36%" },
  anacortes: { left: "42%", top: "11%" },
};

const prototypeVisitedDestinationIds = ["sequim", "long-beach"];

const dayOptions = [
  { value: 1, label: "Day trip" },
  { value: 2, label: "2 days" },
  { value: 3, label: "3 days" },
  { value: 4, label: "4 days" },
];

const exclusionLabels: Record<
  ExclusionReason,
  { singular: string; plural: string }
> = {
  "drive-time": {
    singular: "beyond drive time",
    plural: "beyond drive time",
  },
  "trip-length": {
    singular: "outside the trip length",
    plural: "outside the trip length",
  },
  ferry: { singular: "ferry route", plural: "ferry routes" },
  border: { singular: "border crossing", plural: "border crossings" },
  visited: { singular: "already visited", plural: "already visited" },
};

function formatDriveTime(hours: number) {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return `${whole}h ${minutes ? `${minutes}m` : ""}`.trim();
}

function formatExclusionSummary(exclusions: readonly ExcludedDestination[]) {
  const counts = new Map<ExclusionReason, number>();

  for (const exclusion of exclusions) {
    for (const reason of exclusion.reasons) {
      counts.set(reason, (counts.get(reason) ?? 0) + 1);
    }
  }

  return Object.entries(exclusionLabels)
    .map(([reason, labels]) => {
      const count = counts.get(reason as ExclusionReason) ?? 0;
      if (count === 0) return null;
      return `${count} ${count === 1 ? labels.singular : labels.plural}`;
    })
    .filter((item): item is string => item !== null)
    .join(" · ");
}

function createPlannerStateFromInitialSearch(initialSearch: string) {
  return readPlannerStateFromSearch(initialSearch) ?? createInitialPlannerState();
}

type LiveRouteState = {
  originQuery: string;
  result: LiveRouteResult;
};

type RouteStatus = "idle" | "loading" | "success" | "error";

const defaultOrigin: ResolvedOrigin = {
  label: "Issaquah, Washington, United States",
  latitude: 47.5301,
  longitude: -122.0326,
};

export function TripPlanner({
  catalog,
  currentUser = null,
  initialSearch = "",
}: TripPlannerProps) {
  const { destinations, preferenceOptions } = catalog;
  const [plannerState, dispatch] = useReducer(
    plannerReducer,
    initialSearch,
    createPlannerStateFromInitialSearch,
  );
  const [selectedId, setSelectedId] = useState("point-defiance");
  const [searchCount, setSearchCount] = useState(0);
  const [showWizard, setShowWizard] = useState(
    () => readPlannerStateFromSearch(initialSearch) === null,
  );
  const [hasShareableState, setHasShareableState] = useState(
    () => readPlannerStateFromSearch(initialSearch) !== null,
  );
  const [liveRouteState, setLiveRouteState] = useState<LiveRouteState | null>(null);
  const [routeStatus, setRouteStatus] = useState<RouteStatus>("idle");
  const [routeError, setRouteError] = useState<string | null>(null);
  const [confirmedOrigin, setConfirmedOrigin] = useState<ResolvedOrigin>(defaultOrigin);
  const [confirmedOriginQuery, setConfirmedOriginQuery] = useState("Issaquah, WA");
  const {
    originQuery: address,
    maxDriveHours: radius,
    travelingWithChildren,
    days,
    preferences,
    allowFerryRoutes,
    allowBorderCrossings,
    hideVisited,
  } = plannerState;

  const currentOriginQuery = address.trim();
  const liveRouteResult =
    liveRouteState?.originQuery === currentOriginQuery
      ? liveRouteState.result
      : null;
  const liveRoutesByDestinationId = useMemo(
    () =>
      new Map(
        (liveRouteResult?.routes ?? []).map((route) => [
          route.destinationId,
          route,
        ]),
      ),
    [liveRouteResult],
  );
  const destinationsWithCurrentRoutes = useMemo(
    () =>
      destinations.map((destination) => {
        const route = liveRoutesByDestinationId.get(destination.id);
        return route
          ? { ...destination, hours: route.durationMinutes / 60 }
          : destination;
      }),
    [destinations, liveRoutesByDestinationId],
  );

  const { recommendations: ranked, exclusions } = useMemo(
    () =>
      recommendDestinations(
        destinationsWithCurrentRoutes,
        toTripCriteria(plannerState, prototypeVisitedDestinationIds),
      ),
    [destinationsWithCurrentRoutes, plannerState],
  );

  const topResults = ranked.slice(0, 5);
  const selected = ranked.find((destination) => destination.id === selectedId) ?? topResults[0];
  const exclusionSummary = formatExclusionSummary(exclusions);
  const isIssaquah = /issaquah/i.test(address);
  const mapOriginLabel = liveRouteResult
    ? liveRouteResult.originLabel.split(",")[0]
    : isIssaquah
      ? "Issaquah"
      : "Your start";
  const plannerSearch = hasShareableState ? writePlannerSearch(plannerState) : "";

  function destinationHref(destinationId: string) {
    return `/destinations/${destinationId}${plannerSearch ? `?${plannerSearch}` : ""}`;
  }

  function openDestination(destinationId: string) {
    window.location.assign(destinationHref(destinationId));
  }

  useEffect(() => {
    if (!hasShareableState) return;

    const search = writePlannerSearch(plannerState, window.location.search);
    const url = `${window.location.pathname}?${search}${window.location.hash}`;

    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== url) {
      window.history.replaceState(null, "", url);
    }
  }, [hasShareableState, plannerState]);

  function togglePreference(preference: Preference) {
    dispatch({ type: "toggle-preference", preference });
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmedOriginQuery !== currentOriginQuery) {
      setRouteStatus("error");
      setRouteError("Choose a starting point from the suggestions to calculate live routes.");
      setSearchCount((current) => current + 1);
      return;
    }

    setRouteStatus("loading");
    setRouteError(null);
    setLiveRouteState(null);
    document.getElementById("matches")?.scrollIntoView({ behavior: "smooth", block: "start" });

    try {
      const response = await fetch("/api/route-estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: confirmedOrigin }),
      });
      const payload = (await response.json()) as LiveRouteResult & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Live routing is temporarily unavailable.");
      }

      setLiveRouteState({ originQuery: currentOriginQuery, result: payload });
      setRouteStatus("success");
      if (payload.routes[0]) setSelectedId(payload.routes[0].destinationId);
    } catch (error) {
      setRouteStatus("error");
      setRouteError(
        error instanceof Error ? error.message : "Live routing is temporarily unavailable.",
      );
    } finally {
      setSearchCount((current) => current + 1);
    }
  }

  function restartPlanner() {
    dispatch({ type: "reset" });
    setSelectedId("point-defiance");
    setSearchCount(0);
    setConfirmedOrigin(defaultOrigin);
    setConfirmedOriginQuery("Issaquah, WA");
    setShowWizard(true);
    setHasShareableState(false);

    const search = clearPlannerSearch(window.location.search);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`,
    );
  }

  function completeWizard() {
    setHasShareableState(true);
    setShowWizard(false);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Nearbound home">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>nearbound</span>
        </a>
        <div className="header-actions">
          <div className="header-note">
            <span className="status-dot" aria-hidden="true" />
            Family travel prototype · Cascadia
          </div>
          <AccountMenu currentUser={currentUser} />
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">A smarter way to choose a short trip</p>
          <h1>Find somewhere that fits your <em>actual</em> family.</h1>
          <p className="hero-intro">
            Start with the constraints that usually ruin a weekend—drive time, naps, weather, and logistics.
            Then match the destination.
          </p>
        </div>
        <div className="hero-proof" aria-label="Prototype research summary">
          <span><strong>87</strong> researched ideas</span>
          <span><strong>4</strong> planning constraints</span>
          <span><strong>1</strong> strong plan per day</span>
        </div>
      </section>

      {showWizard ? (
        <PlannerWizard
          state={plannerState}
          preferenceOptions={preferenceOptions}
          dispatch={dispatch}
          onOriginChange={(value) => {
            dispatch({ type: "set-origin-query", value });
            setConfirmedOriginQuery("");
          }}
          onOriginSelect={(origin) => {
            setConfirmedOrigin(origin);
            setConfirmedOriginQuery(origin.label);
          }}
          onComplete={completeWizard}
        />
      ) : (
        <>
      <section className="planner-shell" id="planner-workspace" aria-label="Trip planner">
        <form className="planner-card" onSubmit={handleSearch}>
          <div className="section-heading">
            <span>01</span>
            <div>
              <p>Your trip brief</p>
              <small>Set the constraints that make or break a short trip.</small>
            </div>
          </div>

          <div className="workspace-actions" aria-label="Setup actions">
            <button type="button" onClick={() => setShowWizard(true)}>Edit setup</button>
            <button type="button" onClick={restartPlanner}>Start over</button>
          </div>

          <label className="field-label" htmlFor="address">Starting point</label>
          <OriginAutocomplete
            id="address"
            value={address}
            onChange={(value) => {
              dispatch({ type: "set-origin-query", value });
              setConfirmedOriginQuery("");
              setRouteStatus("idle");
              setRouteError(null);
              setLiveRouteState(null);
            }}
            onSelect={(origin) => {
              setConfirmedOrigin(origin);
              setConfirmedOriginQuery(origin.label);
            }}
          />
          <p className={`demo-note ${routeStatus === "error" || !isIssaquah ? "is-warning" : ""}`}>
            {routeStatus === "loading"
              ? "Checking live drive times with Mapbox…"
              : liveRouteResult
                ? `Live drive times from ${liveRouteResult.originLabel}. Ferry and border filters still use curated route metadata.`
                : routeStatus === "error"
                  ? `${routeError} Showing curated Issaquah drive-time estimates.`
                  : isIssaquah
                    ? "Select Find my trips to replace the Issaquah baseline with live drive times."
                    : "Choose a suggestion to confirm the starting point before calculating live drive times."}
          </p>

          <div className="form-row">
            <div>
              <span className="field-label">Travel mode</span>
              <div className="segmented" aria-label="Travel mode">
                <button type="button" className="active" aria-pressed="true">Drive</button>
                <button type="button" disabled title="Planned after the driving MVP">Fly <small>next</small></button>
              </div>
            </div>
            <div>
              <span className="field-label">Family fit</span>
              <label className="logistics-option family-fit-option compact">
                <input
                  type="checkbox"
                  aria-label="Traveling with children"
                  checked={travelingWithChildren}
                  onChange={(event) =>
                    dispatch({
                      type: "set-traveling-with-children",
                      value: event.target.checked,
                    })
                  }
                />
                <span>
                  <strong>Traveling with children</strong>
                  <small>Prioritize family-friendly fit</small>
                </span>
              </label>
            </div>
          </div>

          <div className="radius-block">
            <div className="label-line">
              <span className="field-label">Maximum drive</span>
              <strong>{radius.toFixed(1)} hours</strong>
            </div>
            <input
              className="range-input"
              type="range"
              min={PLANNER_LIMITS.maxDriveHours.min}
              max={PLANNER_LIMITS.maxDriveHours.max}
              step="0.5"
              value={radius}
              onChange={(event) =>
                dispatch({
                  type: "set-max-drive-hours",
                  value: Number(event.target.value),
                })
              }
              aria-label="Maximum drive time in hours"
            />
            <div className="range-labels" aria-hidden="true"><span>1 hour</span><span>6 hours</span></div>
          </div>

          <div className="days-block">
            <span className="field-label">Time away</span>
            <div className="day-options">
              {dayOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={days === option.value ? "active" : ""}
                  aria-pressed={days === option.value}
                  onClick={() =>
                    dispatch({ type: "set-days", value: option.value })
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="preferences-block">
            <span className="field-label">What sounds good?</span>
            <div className="preference-list">
              {preferenceOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={preferences.includes(option.id) ? "active" : ""}
                  aria-pressed={preferences.includes(option.id)}
                  onClick={() => togglePreference(option.id)}
                >
                  <span aria-hidden="true">{preferences.includes(option.id) ? "✓" : "+"}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <fieldset className="logistics-block">
            <legend className="field-label">Route logistics</legend>
            <div className="logistics-options">
              <label className="logistics-option">
                <input
                  type="checkbox"
                  checked={allowFerryRoutes}
                  onChange={(event) =>
                    dispatch({
                      type: "set-allow-ferry-routes",
                      value: event.target.checked,
                    })
                  }
                />
                <span><strong>Allow ferries</strong><small>Include routes with a ferry crossing</small></span>
              </label>
              <label className="logistics-option">
                <input
                  type="checkbox"
                  checked={allowBorderCrossings}
                  onChange={(event) =>
                    dispatch({
                      type: "set-allow-border-crossings",
                      value: event.target.checked,
                    })
                  }
                />
                <span><strong>Allow borders</strong><small>Include international crossings</small></span>
              </label>
            </div>
          </fieldset>

          <label className="check-row">
            <input
              type="checkbox"
              checked={hideVisited}
              onChange={(event) =>
                dispatch({
                  type: "set-hide-visited",
                  value: event.target.checked,
                })
              }
            />
            <span>Hide places we’ve already visited</span>
          </label>

          <button className="primary-button" type="submit" disabled={routeStatus === "loading"}>
            {routeStatus === "loading" ? "Checking live routes" : "Find my trips"}
            <span aria-hidden="true">↗</span>
          </button>
        </form>

        <div className="map-card">
          <div className="map-topline">
            <div>
              <span className="map-kicker">{liveRouteResult ? "Live driving times" : "Your search area"}</span>
              <strong>{topResults.length} strong matches near {mapOriginLabel}</strong>
            </div>
            <span className="map-scale">≈ {radius.toFixed(1)}h drive</span>
          </div>

          <div className="map-canvas" aria-label="Illustrative map of recommended destinations around your starting point">
            <div className="water-shape water-one" />
            <div className="water-shape water-two" />
            <div className="mountain-band" aria-hidden="true">CASCADE RANGE</div>
            <div className="road road-one" />
            <div className="road road-two" />
            <div className="radius-ring" style={{ width: `${32 + radius * 8}%`, height: `${32 + radius * 8}%` }} />
            <div className="home-pin" aria-label={`Starting point: ${mapOriginLabel}`}>
              <span />
              <small>{mapOriginLabel}</small>
            </div>
            <span className="map-label seattle">Seattle</span>
            <span className="map-label olympia">Olympia</span>
            <span className="map-label canada">CANADA</span>
            <span className="map-label pacific">PACIFIC OCEAN</span>
            {topResults.map((destination, index) => (
              <button
                key={destination.id}
                type="button"
                className={`destination-pin ${selected?.id === destination.id ? "active" : ""}`}
                style={prototypeMapPositions[destination.id]}
                onClick={() => setSelectedId(destination.id)}
                aria-label={`${destination.name}, ${destination.score}% match`}
              >
                <span><i>{index + 1}</i></span>
                <small>{destination.name}</small>
              </button>
            ))}
          </div>

          {selected && (
            <article className="map-spotlight" aria-live="polite">
              <div className="match-score"><strong>{selected.score}%</strong><span>trip match</span></div>
              <div className="spotlight-copy">
                <p>{selected.region} · {formatDriveTime(selected.hours)} drive</p>
                <h2>{selected.name}</h2>
                <span>{selected.summary}</span>
              </div>
              <button type="button" onClick={() => openDestination(selected.id)}>
                View details <span aria-hidden="true">→</span>
              </button>
            </article>
          )}
        </div>
      </section>

      <section className="results-section" id="matches">
        <div className="results-heading">
          <div>
            <p className="eyebrow">Ranked for your real constraints</p>
            <h2>Your best fits</h2>
          </div>
          <p>
            Every option already fits your hard constraints. Experience match, drive-time margin, family fit,
            weather backup, and route simplicity decide the order.
          </p>
        </div>

        <div className="results-grid">
          {topResults.slice(0, 3).map((destination, index) => (
            <article
              className={`result-card ${selected?.id === destination.id ? "selected" : ""}`}
              id={`result-${destination.id}`}
              key={destination.id}
              onMouseEnter={() => setSelectedId(destination.id)}
              onClick={(event) => {
                if (event.target instanceof Element && event.target.closest("a")) return;
                openDestination(destination.id);
              }}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openDestination(destination.id);
                }
              }}
              role="link"
              tabIndex={0}
              aria-label={`Open details for ${destination.name}`}
            >
              <div className="result-rank">0{index + 1}</div>
              <div className="result-title-row">
                <div>
                  <p>{destination.region}</p>
                  <h3>{destination.name}</h3>
                </div>
                <div
                  className="result-score"
                  aria-label={`${destination.score} out of 100 trip match`}
                >
                  <strong>{destination.score}</strong><span>/100</span>
                </div>
              </div>
              <p className="result-summary">{destination.summary}</p>
              <div className="tag-row">
                <span>{formatDriveTime(destination.hours)} drive</span>
                <span>{destination.minDays === 1 && destination.maxDays <= 2 ? "Day-trip friendly" : `${destination.minDays}–${destination.maxDays} days`}</span>
                {destination.usesFerry && <span>Ferry route</span>}
                {destination.crossesBorder && <span>Border crossing</span>}
              </div>
              <div className="micro-plan">
                <div className="match-explanation">
                  <span>Why this ranks here</span>
                  <p>{destination.matchReasons.join(" ")}</p>
                </div>
                <div><span>One strong anchor</span><p>{destination.anchor}</p></div>
                <div><span>Where to stay</span><p>{destination.stay}</p></div>
                <div className="caution">
                  <span>Reality check</span>
                  <p>{destination.tradeoffs[0] ? `${destination.tradeoffs[0]} ${destination.caution}` : destination.caution}</p>
                </div>
                {destination.sourceReferences[0]?.url && (
                  <div className="source-reference">
                    <span>Research source</span>
                    <a
                      href={destination.sourceReferences[0].url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {destination.sourceReferences[0].title} ↗
                    </a>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
        {topResults.length === 0 && (
          <div className="empty-state">
            <h3>No destination fits every active constraint.</h3>
            <p>Adjust the drive time, trip length, or route logistics—we won’t pretend a rushed weekend is a good fit.</p>
          </div>
        )}
        <p className="search-status" aria-live="polite">
          {routeStatus === "loading"
            ? "Calculating live drive times…"
            : liveRouteResult
              ? `Live drive times calculated for ${liveRouteResult.originLabel} · search ${searchCount}`
              : searchCount > 0
                ? `Updated with curated fallback estimates · search ${searchCount}`
                : "Adjust the brief above—the ranking updates as you go."}
          {exclusionSummary && ` · Filtered: ${exclusionSummary}`}
        </p>
      </section>
        </>
      )}

      <section className="principle-section">
        <p className="eyebrow">The product principle</p>
        <blockquote>
          “A good short trip isn’t the farthest place or the longest checklist. It’s one strong destination,
          comfortable sleep, one main plan a day, and a Monday that doesn’t feel like recovery.”
        </blockquote>
        <div className="research-note">
          <span>Built from a family travel calendar, a 17-page destination guide, and real post-trip preferences.</span>
          <span>Prototype data current to August 2026 · verify live conditions before booking.</span>
        </div>
      </section>

      <footer>
        <a className="brand" href="#top"><span className="brand-mark" aria-hidden="true">N</span><span>nearbound</span></a>
        <p>Short trips, chosen well.</p>
      </footer>
    </main>
  );
}

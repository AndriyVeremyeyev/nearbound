"use client";

import { FormEvent, useEffect, useMemo, useReducer, useState } from "react";

import {
  createInitialPlannerState,
  FERRY_PREFERENCE,
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
import { composeTripIdeas, fitTripIdeaToAccess, type RouteCatalog } from "@/lib/catalog/compose-trip";
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
import type { SavedOrigin } from "@/lib/trips/repository";
import { AccountMenu } from "./account-menu";
import { OriginAutocomplete } from "./origin-autocomplete";
import { PlannerWizard } from "./planner-wizard";
import { SavedOriginSelector } from "./saved-origin-selector";
import { InteractiveMap } from "./interactive-map";

type TripPlannerProps = {
  catalog: DestinationCatalog;
  routeCatalogs?: readonly RouteCatalog[];
  /** @deprecated Kept briefly so existing focused planner tests remain readable. */
  oregonCoastCatalog?: RouteCatalog | null;
  currentUser?: CurrentUser | null;
  initialVisitedDestinationIds?: readonly string[];
  savedOrigins?: readonly SavedOrigin[];
  initialSearch?: string;
  mapboxAccessToken?: string;
};

const dayOptions = [
  { value: 1, label: "Day trip" },
  { value: 2, label: "2 days" },
  { value: 3, label: "3 days" },
  { value: 4, label: "4 days" },
];

function getPaceOptions(days: number) {
  if (days === 1) {
    return [
      { value: "easy", label: "Take it easy", detail: "One main plan, room to wander" },
      { value: "balanced", label: "Balanced", detail: "A full day with a couple of moments" },
      { value: "see-more", label: "See more", detail: "Fit in a little more" },
    ] as const;
  }

  return [
    { value: "easy", label: "Take it easy", detail: "Fewer stops, more room" },
    { value: "balanced", label: "Balanced", detail: "A few strong moments" },
    { value: "see-more", label: "See more", detail: "Cover more ground" },
  ] as const;
}

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

function formatPreference(preference: string) {
  return preference
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
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

type PlannerTripIdea = {
  id: string;
  context: string;
  title: string;
  summary: string;
  facts: string[];
  matchReasons: string[];
  anchors: string;
  source?: { title: string; url: string };
  destinationId?: string;
  routeId?: string;
  startAreaId?: string;
  endAreaId?: string;
};

const defaultOrigin: ResolvedOrigin = {
  label: "Issaquah, Washington, United States",
  latitude: 47.5301,
  longitude: -122.0326,
};

export function TripPlanner({
  catalog,
  routeCatalogs: initialRouteCatalogs = [],
  oregonCoastCatalog = null,
  currentUser = null,
  initialVisitedDestinationIds = [],
  savedOrigins = [],
  initialSearch = "",
  mapboxAccessToken,
}: TripPlannerProps) {
  const routeCatalogs = useMemo(
    () => initialRouteCatalogs.length > 0
      ? initialRouteCatalogs
      : oregonCoastCatalog
        ? [oregonCoastCatalog]
        : [],
    [initialRouteCatalogs, oregonCoastCatalog],
  );
  const { destinations, preferenceOptions } = catalog;
  const [plannerState, dispatch] = useReducer(
    plannerReducer,
    initialSearch,
    createPlannerStateFromInitialSearch,
  );
  const [appliedPlannerState, setAppliedPlannerState] = useState(
    () => createPlannerStateFromInitialSearch(initialSearch),
  );
  const [selectedId, setSelectedId] = useState("point-defiance");
  const [visitedDestinationIds, setVisitedDestinationIds] = useState(initialVisitedDestinationIds);
  const [searchCount, setSearchCount] = useState(0);
  const [hasRunSearch, setHasRunSearch] = useState(false);
  const [showWizard, setShowWizard] = useState(
    () => readPlannerStateFromSearch(initialSearch) === null,
  );
  const [hasShareableState, setHasShareableState] = useState(
    () => readPlannerStateFromSearch(initialSearch) !== null,
  );
  const [liveRouteState, setLiveRouteState] = useState<LiveRouteState | null>(null);
  const [routeStatus, setRouteStatus] = useState<RouteStatus>("idle");
  const [routeError, setRouteError] = useState<string | null>(null);
  const [showAllIdeas, setShowAllIdeas] = useState(false);
  const [confirmedOrigin, setConfirmedOrigin] = useState<ResolvedOrigin>(defaultOrigin);
  const [confirmedOriginQuery, setConfirmedOriginQuery] = useState("Issaquah, WA");
  const [appliedOrigin, setAppliedOrigin] = useState<ResolvedOrigin>(defaultOrigin);
  const {
    originQuery: address,
    maxDriveHours: radius,
    travelingWithChildren,
    days,
    pace,
    preferences,
    allowFerryRoutes,
    allowBorderCrossings,
    hideVisited,
  } = plannerState;
  const appliedDriveHours = appliedPlannerState.maxDriveHours;
  const appliedOriginQuery = appliedPlannerState.originQuery.trim();
  const hasPendingChanges = JSON.stringify(plannerState) !== JSON.stringify(appliedPlannerState);

  const currentOriginQuery = address.trim();
  const liveRouteResult =
    liveRouteState?.originQuery === appliedOriginQuery
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
  const liveRouteAccessByAreaId = useMemo(
    () =>
      new Map(
        (liveRouteResult?.routeAccess ?? []).map((access) => [
          access.areaId,
          access,
        ]),
      ),
    [liveRouteResult],
  );
  const destinationsWithCurrentRoutes = useMemo(
    () =>
      destinations.flatMap((destination) => {
        const route = liveRoutesByDestinationId.get(destination.id);
        if (!route) return [destination];
        if (route.returnDurationMinutes > appliedPlannerState.maxDriveHours * 60) {
          return [];
        }
        return [{ ...destination, hours: route.durationMinutes / 60 }];
      }),
    [appliedPlannerState.maxDriveHours, destinations, liveRoutesByDestinationId],
  );
  const destinationsReadyForTripLength = useMemo(
    () =>
      appliedPlannerState.days >= 3
        ? destinationsWithCurrentRoutes.filter((destination) => destination.minDays >= 3)
        : destinationsWithCurrentRoutes,
    [appliedPlannerState.days, destinationsWithCurrentRoutes],
  );

  const { recommendations: ranked, exclusions } = useMemo(
    () =>
      recommendDestinations(
        destinationsReadyForTripLength,
        toTripCriteria(appliedPlannerState, visitedDestinationIds),
      ),
    [destinationsReadyForTripLength, appliedPlannerState, visitedDestinationIds],
  );
  const catalogRouteIdeas = useMemo(
    () => {
      if (routeCatalogs.length === 0 || !liveRouteResult) return [];

      const maximumTravelDayMinutes = appliedPlannerState.maxDriveHours * 60;
      return routeCatalogs.flatMap((catalog) =>
        composeTripIdeas(catalog, {
          days: appliedPlannerState.days,
          pace: appliedPlannerState.pace,
          preferences: appliedPlannerState.preferences,
          travelingWithChildren: appliedPlannerState.travelingWithChildren,
        }).flatMap((idea) => {
          const outboundAccess = liveRouteAccessByAreaId.get(idea.startArea.id);
          const returnAccess = liveRouteAccessByAreaId.get(idea.endArea.id);

          if (
            !outboundAccess ||
            !returnAccess ||
            outboundAccess.outboundMinutes > maximumTravelDayMinutes ||
            returnAccess.returnMinutes > maximumTravelDayMinutes
          ) {
            return [];
          }

          const fittedIdea = fitTripIdeaToAccess(idea, appliedPlannerState, {
            outboundMinutes: outboundAccess.outboundMinutes,
            returnMinutes: returnAccess.returnMinutes,
          });
          return fittedIdea ? [{ catalog, idea: fittedIdea, outboundAccess, returnAccess }] : [];
        }),
      );
    },
    [appliedPlannerState, liveRouteAccessByAreaId, liveRouteResult, routeCatalogs],
  );
  const tripIdeas = useMemo<PlannerTripIdea[]>(() => {
    const destinationIdeas = ranked.map((destination) => {
      const liveRoute = liveRoutesByDestinationId.get(destination.id);
      return {
        id: `destination:${destination.id}`,
        context: destination.region,
        title: destination.name,
        summary: destination.summary,
        facts: [
          `${formatDriveTime(destination.hours)} from your start`,
          ...(liveRoute
            ? [`${formatDriveTime(liveRoute.returnDurationMinutes / 60)} home`]
            : []),
          ...destination.preferences
            .slice(0, 2)
            .map((preference) => formatPreference(preference)),
        ],
        matchReasons: destination.matchReasons,
        anchors: destination.anchor,
        source: destination.sourceReferences[0]?.url
          ? {
              title: destination.sourceReferences[0].title,
              url: destination.sourceReferences[0].url,
            }
          : undefined,
        destinationId: destination.id,
      };
    });
    const routeIdeas = catalogRouteIdeas.map(({ catalog, idea, outboundAccess, returnAccess }) => ({
          id: `route:${idea.id}`,
          context: catalog.name,
          title: idea.title,
        summary: idea.summary ?? catalog.summary ?? "A connected route with room to choose the stops that suit the day.",
          facts: [
            `${idea.areaIds.length} areas · ${idea.stops.length} stops`,
            `${formatDriveTime(outboundAccess.outboundMinutes / 60)} to ${idea.startArea.name}`,
            `${formatDriveTime(idea.driveMinutes / 60)} moving between areas`,
            `${formatDriveTime(returnAccess.returnMinutes / 60)} home from ${idea.endArea.name}`,
          ],
          matchReasons: idea.matchedPreferences.length
            ? [`Includes ${idea.matchedPreferences.map(formatPreference).join(" and ")}.`]
            : ["Built as a connected coastal option."],
          anchors: idea.stops.slice(0, 3).map((stop) => stop.name).join(" · "),
          routeId: catalog.id,
          startAreaId: idea.startArea.id,
          endAreaId: idea.endArea.id,
        }));

    if (!hasRunSearch) return [];

    return appliedPlannerState.days >= 2
      ? [...routeIdeas, ...destinationIdeas]
      : destinationIdeas;
  }, [appliedPlannerState.days, catalogRouteIdeas, hasRunSearch, liveRoutesByDestinationId, ranked]);
  const visibleTripIdeas = showAllIdeas ? tripIdeas : tripIdeas.slice(0, 3);
  const mapRouteLayers = useMemo(
    () => hasRunSearch
      ? catalogRouteIdeas.map(({ catalog, idea }) => ({
          id: `route:${idea.id}`,
          catalogId: catalog.id,
          name: idea.title,
          shape: catalog.shape,
          areas: catalog.areas.filter((area) => idea.areaIds.includes(area.id)),
        }))
      : [],
    [catalogRouteIdeas, hasRunSearch],
  );

  const topResults = hasRunSearch ? ranked.slice(0, 5) : [];
  const selected = hasRunSearch
    ? ranked.find((destination) => destination.id === selectedId) ?? topResults[0]
    : undefined;
  const exclusionSummary = formatExclusionSummary(exclusions);
  const isAppliedIssaquah = /issaquah/i.test(appliedOriginQuery);
  const mapOriginLabel = liveRouteResult
    ? liveRouteResult.originLabel.split(",")[0]
    : isAppliedIssaquah
      ? "Issaquah"
      : "Your start";
  const plannerSearch = hasShareableState ? writePlannerSearch(appliedPlannerState) : "";
  const ferryExperienceSelected = preferences.includes(FERRY_PREFERENCE);

  function destinationHref(destinationId: string) {
    return `/destinations/${destinationId}${plannerSearch ? `?${plannerSearch}` : ""}`;
  }

  function openDestination(destinationId: string) {
    window.location.assign(destinationHref(destinationId));
  }

  function routeIdeaHref(idea: PlannerTripIdea) {
    if (!idea.routeId || !idea.startAreaId || !idea.endAreaId) return null;

    const parameters = new URLSearchParams(plannerSearch);
    parameters.set("start", idea.startAreaId);
    parameters.set("end", idea.endAreaId);
    return `/trips/${idea.routeId}?${parameters.toString()}`;
  }

  useEffect(() => {
    if (!hasShareableState) return;

    const search = writePlannerSearch(appliedPlannerState, window.location.search);
    const url = `${window.location.pathname}?${search}${window.location.hash}`;

    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== url) {
      window.history.replaceState(null, "", url);
    }
  }, [appliedPlannerState, hasShareableState]);

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

    setAppliedPlannerState(plannerState);
    setHasRunSearch(true);
    setShowAllIdeas(false);
    setAppliedOrigin(confirmedOrigin);
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
    setAppliedPlannerState(createInitialPlannerState());
    setSelectedId("point-defiance");
    setSearchCount(0);
    setHasRunSearch(false);
    setConfirmedOrigin(defaultOrigin);
    setConfirmedOriginQuery("Issaquah, WA");
    setAppliedOrigin(defaultOrigin);
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
    setAppliedPlannerState(plannerState);
    setShowAllIdeas(false);
    setHasRunSearch(false);
    setAppliedOrigin(confirmedOrigin);
    setHasShareableState(true);
    setShowWizard(false);
  }

  function selectSavedOrigin(origin: ResolvedOrigin) {
    dispatch({ type: "set-origin-query", value: origin.label });
    setConfirmedOrigin(origin);
    setConfirmedOriginQuery(origin.label);
    setRouteStatus("idle");
    setRouteError(null);
  }

  async function markVisitedDestination(destinationId: string) {
    const response = await fetch(`/api/visited-destinations/${destinationId}`, {
      method: "POST",
    });
    if (!response.ok) return;

    setVisitedDestinationIds((current) =>
      current.includes(destinationId) ? current : [...current, destinationId],
    );
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
          <h1>Where should you go this <em>weekend?</em></h1>
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
          savedOrigins={savedOrigins}
          onSavedOriginSelect={selectSavedOrigin}
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
          <SavedOriginSelector origins={savedOrigins} onSelect={selectSavedOrigin} />
          <OriginAutocomplete
            id="address"
            value={address}
            onChange={(value) => {
              dispatch({ type: "set-origin-query", value });
              setConfirmedOriginQuery("");
              setRouteStatus("idle");
              setRouteError(null);
            }}
            onSelect={(origin) => {
              setConfirmedOrigin(origin);
              setConfirmedOriginQuery(origin.label);
            }}
          />
          <p className={`demo-note ${routeStatus === "error" || !isAppliedIssaquah ? "is-warning" : ""}`}>
            {routeStatus === "loading"
              ? "Checking live drive times with Mapbox…"
              : routeStatus === "error"
                ? `${routeError} Showing the previously applied results.`
                : hasPendingChanges
                  ? "Your changes will apply when you select Find my trips."
                  : liveRouteResult
                    ? `Live drive times from ${liveRouteResult.originLabel}. Ferry and border filters still use curated route metadata.`
                    : isAppliedIssaquah
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
              <span className="field-label">Getting there</span>
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
              aria-label="Maximum one-way drive time in hours"
            />
            <div className="range-labels" aria-hidden="true"><span>1 hour</span><span>6 hours</span></div>
            <p className="drive-guidance">
              Maximum one-way drive from your starting point to begin the trip. We also check the drive home.
            </p>
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
            <div className="pace-options" aria-label="Trip pace">
              {getPaceOptions(days).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={pace === option.value ? "active" : ""}
                  aria-pressed={pace === option.value}
                  onClick={() => dispatch({ type: "set-pace", value: option.value })}
                >
                  <strong>{option.label}</strong>
                  <small>{option.detail}</small>
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
                  disabled={ferryExperienceSelected}
                  checked={allowFerryRoutes}
                  onChange={(event) =>
                    dispatch({
                      type: "set-allow-ferry-routes",
                      value: event.target.checked,
                    })
                  }
                />
                <span><strong>Allow ferries</strong><small>{ferryExperienceSelected ? "Included because Ferry is selected above" : "Include routes with a ferry crossing"}</small></span>
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
              disabled={!currentUser}
              checked={hideVisited}
              onChange={(event) =>
                dispatch({
                  type: "set-hide-visited",
                  value: event.target.checked,
                })
              }
            />
            <span>{currentUser ? "Hide places we’ve already visited" : "Sign in to hide visited places"}</span>
          </label>

          <button className="primary-button" type="submit" disabled={routeStatus === "loading"}>
            {routeStatus === "loading" ? "Checking live routes" : "Find my trips"}
            <span aria-hidden="true">↗</span>
          </button>
        </form>

        <div className="map-card">
          <div className="map-topline">
            <div>
              <span className="map-kicker">{hasRunSearch ? (hasPendingChanges ? "Current results" : liveRouteResult ? "Live driving times" : "Your search area") : "Ready when you are"}</span>
              <strong>{hasRunSearch ? `${topResults.length} strong matches near ${mapOriginLabel}` : "Choose your brief, then find your trips"}</strong>
            </div>
            {hasRunSearch && <span className="map-scale">≈ {appliedDriveHours.toFixed(1)}h getting there</span>}
          </div>

          <InteractiveMap
            accessToken={mapboxAccessToken}
            origin={appliedOrigin}
            destinations={topResults}
            routeLayers={mapRouteLayers}
            showResultPlaces={hasRunSearch}
            selectedDestinationId={selected?.id}
            onDestinationSelect={setSelectedId}
          />

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
            <p className="eyebrow">Built around your brief</p>
            <h2>Your trip ideas</h2>
          </div>
          <p>
            Compare concrete ways to spend the time — a focused place, a coastal stretch, or a longer stay.
          </p>
        </div>

        <div className="results-grid">
          {visibleTripIdeas.map((idea) => {
            const detailHref = idea.destinationId
              ? destinationHref(idea.destinationId)
              : routeIdeaHref(idea);

            return (
              <article
              className={`trip-idea-card ${idea.destinationId && selected?.id === idea.destinationId ? "selected" : ""}`}
              id={`idea-${idea.id}`}
              key={idea.id}
              onMouseEnter={() => {
                if (idea.destinationId) setSelectedId(idea.destinationId);
              }}
              onClick={(event) => {
                if (!detailHref) return;
                if (event.target instanceof Element && event.target.closest("a")) return;
                window.location.assign(detailHref);
              }}
              onKeyDown={(event) => {
                if (!detailHref) return;
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  window.location.assign(detailHref);
                }
              }}
              role={detailHref ? "link" : undefined}
              tabIndex={detailHref ? 0 : undefined}
              aria-label={detailHref ? `Open details for ${idea.title}` : undefined}
            >
              <div className="result-title-row">
                <div>
                  <p>{idea.context}</p>
                  <h3>{idea.title}</h3>
                </div>
              </div>
              <p className="result-summary">{idea.summary}</p>
              <div className="tag-row">
                {idea.facts.map((fact) => <span key={fact}>{fact}</span>)}
              </div>
              <div className="micro-plan">
                <div className="match-explanation">
                  <span>Why this fits</span>
                  <p>{idea.matchReasons.join(" ")}</p>
                </div>
                <div><span>Possible anchors</span><p>{idea.anchors}</p></div>
                {idea.source && (
                  <div className="source-reference">
                    <span>Research source</span>
                    <a
                      href={idea.source.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {idea.source.title} ↗
                    </a>
                  </div>
                )}
              </div>
              {currentUser && idea.destinationId && (
                <button
                  className="visited-toggle"
                  type="button"
                  aria-pressed={visitedDestinationIds.includes(idea.destinationId)}
                  disabled={visitedDestinationIds.includes(idea.destinationId)}
                  onClick={(event) => {
                    event.stopPropagation();
                    void markVisitedDestination(idea.destinationId!);
                  }}
                >
                  {visitedDestinationIds.includes(idea.destinationId)
                    ? "Visited"
                    : "Mark as visited"}
                </button>
              )}
            </article>
            );
          })}
        </div>
        {tripIdeas.length > 3 && (
          <button className="show-more-ideas" type="button" onClick={() => setShowAllIdeas((current) => !current)}>
            {showAllIdeas ? "Show fewer ideas" : `Show ${tripIdeas.length - 3} more ideas`}
          </button>
        )}
        {!hasRunSearch ? (
          <div className="empty-state">
            <h3>Ready to plan a trip?</h3>
            <p>Set the brief above, then select Find my trips to calculate the shortlist and map.</p>
          </div>
        ) : tripIdeas.length === 0 && (
          <div className="empty-state">
            <h3>No trip idea fits every active constraint.</h3>
            <p>Adjust the drive time, interests, or route boundaries — we won’t pretend a rushed plan is a good fit.</p>
          </div>
        )}
        <p className="search-status" aria-live="polite">
          {routeStatus === "loading"
            ? "Calculating live drive times…"
            : hasPendingChanges
              ? "Changes are waiting to be applied."
              : liveRouteResult
                ? `Live drive times calculated for ${liveRouteResult.originLabel} · search ${searchCount}`
                : searchCount > 0
                  ? `Updated with curated fallback estimates · search ${searchCount}`
                  : "Set the brief above, then select Find my trips."}
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

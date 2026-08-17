"use client";

import { FormEvent, useMemo, useReducer, useState } from "react";
import type { CSSProperties } from "react";

import {
  createInitialPlannerState,
  plannerReducer,
  PLANNER_LIMITS,
  toTripCriteria,
} from "@/lib/trips/planner-state";
import { recommendDestinations } from "@/lib/trips/recommend";
import type {
  DestinationCatalog,
  ExcludedDestination,
  ExclusionReason,
  Preference,
} from "@/lib/trips/types";
import { PlannerWizard } from "./planner-wizard";

type TripPlannerProps = {
  catalog: DestinationCatalog;
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

export function TripPlanner({ catalog }: TripPlannerProps) {
  const { destinations, preferenceOptions } = catalog;
  const [plannerState, dispatch] = useReducer(
    plannerReducer,
    undefined,
    createInitialPlannerState,
  );
  const [selectedId, setSelectedId] = useState("point-defiance");
  const [searchCount, setSearchCount] = useState(0);
  const [showWizard, setShowWizard] = useState(true);
  const {
    originQuery: address,
    maxDriveHours: radius,
    adults,
    children,
    days,
    preferences,
    allowFerryRoutes,
    allowBorderCrossings,
    hideVisited,
  } = plannerState;

  const { recommendations: ranked, exclusions } = useMemo(
    () =>
      recommendDestinations(
        destinations,
        toTripCriteria(plannerState, prototypeVisitedDestinationIds),
      ),
    [destinations, plannerState],
  );

  const topResults = ranked.slice(0, 5);
  const selected = ranked.find((destination) => destination.id === selectedId) ?? topResults[0];
  const exclusionSummary = formatExclusionSummary(exclusions);

  function togglePreference(preference: Preference) {
    dispatch({ type: "toggle-preference", preference });
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchCount((current) => current + 1);
    if (topResults[0]) setSelectedId(topResults[0].id);
    document.getElementById("matches")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function restartPlanner() {
    dispatch({ type: "reset" });
    setSelectedId("point-defiance");
    setSearchCount(0);
    setShowWizard(true);
  }

  const isIssaquah = /issaquah/i.test(address);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Nearbound home">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>nearbound</span>
        </a>
        <div className="header-note">
          <span className="status-dot" aria-hidden="true" />
          Family travel prototype · Cascadia
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
          onComplete={() => setShowWizard(false)}
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
          <div className="address-field">
            <span className="pin-mini" aria-hidden="true" />
            <input
              id="address"
              value={address}
              onChange={(event) =>
                dispatch({
                  type: "set-origin-query",
                  value: event.target.value,
                })
              }
              placeholder="City or street address"
            />
          </div>
          <p className={`demo-note ${isIssaquah ? "" : "is-warning"}`}>
            {isIssaquah
              ? "Live prototype uses the Issaquah drive-time dataset."
              : "Address captured. Recommendations still use the Issaquah demo dataset."}
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
              <span className="field-label">Travelers</span>
              <div className="travelers">
                <div className="traveler-row">
                  <span><strong>{adults}</strong><small>adults</small></span>
                  <div className="stepper-buttons">
                    <button
                      type="button"
                      disabled={adults === PLANNER_LIMITS.adults.min}
                      onClick={() => dispatch({ type: "set-adults", value: adults - 1 })}
                      aria-label="Remove one adult"
                    >−</button>
                    <button
                      type="button"
                      disabled={adults === PLANNER_LIMITS.adults.max}
                      onClick={() => dispatch({ type: "set-adults", value: adults + 1 })}
                      aria-label="Add one adult"
                    >+</button>
                  </div>
                </div>
                <div className="traveler-row">
                  <span><strong>{children}</strong><small>kids</small></span>
                  <div className="stepper-buttons">
                    <button
                      type="button"
                      disabled={children === PLANNER_LIMITS.children.min}
                      onClick={() => dispatch({ type: "set-children", value: children - 1 })}
                      aria-label="Remove one child"
                    >−</button>
                    <button
                      type="button"
                      disabled={children === PLANNER_LIMITS.children.max}
                      onClick={() => dispatch({ type: "set-children", value: children + 1 })}
                      aria-label="Add one child"
                    >+</button>
                  </div>
                </div>
              </div>
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

          <button className="primary-button" type="submit">
            Find my trips
            <span aria-hidden="true">↗</span>
          </button>
        </form>

        <div className="map-card">
          <div className="map-topline">
            <div>
              <span className="map-kicker">Your search area</span>
              <strong>{topResults.length} strong matches near {isIssaquah ? "Issaquah" : "your start"}</strong>
            </div>
            <span className="map-scale">≈ {radius.toFixed(1)}h drive</span>
          </div>

          <div className="map-canvas" aria-label="Stylized map of recommended destinations around Issaquah">
            <div className="water-shape water-one" />
            <div className="water-shape water-two" />
            <div className="mountain-band" aria-hidden="true">CASCADE RANGE</div>
            <div className="road road-one" />
            <div className="road road-two" />
            <div className="radius-ring" style={{ width: `${32 + radius * 8}%`, height: `${32 + radius * 8}%` }} />
            <div className="home-pin" aria-label="Starting point: Issaquah">
              <span />
              <small>Issaquah</small>
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
              <button type="button" onClick={() => document.getElementById(`result-${selected.id}`)?.scrollIntoView({ behavior: "smooth" })}>
                View plan <span aria-hidden="true">↓</span>
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
            Every option already fits your hard constraints. Experience match, drive-time margin, group fit,
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
          {searchCount > 0 ? `Updated with your latest trip brief · search ${searchCount}` : "Adjust the brief above—the ranking updates as you go."}
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

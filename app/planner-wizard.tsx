"use client";

import { FormEvent, useState } from "react";

import {
  PLANNER_LIMITS,
  type PlannerAction,
  type PlannerState,
} from "@/lib/trips/planner-state";
import type { PreferenceOption } from "@/lib/trips/types";
import type { ResolvedOrigin } from "@/lib/trips/mapbox-search";
import type { SavedOrigin } from "@/lib/trips/repository";
import { OriginAutocomplete } from "./origin-autocomplete";
import { SavedOriginSelector } from "./saved-origin-selector";

type PlannerWizardProps = {
  state: PlannerState;
  preferenceOptions: readonly PreferenceOption[];
  dispatch: (action: PlannerAction) => void;
  onOriginChange: (value: string) => void;
  onOriginSelect: (origin: ResolvedOrigin) => void;
  savedOrigins: readonly SavedOrigin[];
  onSavedOriginSelect: (origin: ResolvedOrigin) => void;
  onComplete: () => void;
};

const steps = [
  {
    label: "Basics",
    title: "Tell us the trip basics",
    description:
      "Start with your city and whether family-friendly fit should shape the ranking.",
  },
  {
    label: "Time",
    title: "How much time do you have?",
    description:
      "Choose the trip length and the longest drive that still feels reasonable.",
  },
  {
    label: "Interests",
    title: "What sounds good?",
    description:
      "Choose any experiences you would be happy to build a short trip around.",
  },
  {
    label: "Boundaries",
    title: "Set your boundaries",
    description:
      "Keep or remove the route logistics and familiar places that affect your shortlist.",
  },
] as const;

const dayOptions = [
  { value: 1, label: "Day trip" },
  { value: 2, label: "2 days" },
  { value: 3, label: "3 days" },
  { value: 4, label: "4 days" },
] as const;

function getPaceOptions(days: number) {
  if (days === 1) {
    return [
      { value: "easy", label: "Take it easy", detail: "One main plan, room to wander" },
      { value: "balanced", label: "Balanced", detail: "A full day with a couple of moments" },
      { value: "see-more", label: "See more", detail: "Fit in a little more before heading home" },
    ] as const;
  }

  return [
    { value: "easy", label: "Take it easy", detail: "Fewer stops, more room to wander" },
    { value: "balanced", label: "Balanced", detail: "A few strong moments, without rushing" },
    { value: "see-more", label: "See more", detail: "Cover more ground while you are away" },
  ] as const;
}

export function PlannerWizard({
  state,
  preferenceOptions,
  dispatch,
  onOriginChange,
  onOriginSelect,
  savedOrigins,
  onSavedOriginSelect,
  onComplete,
}: PlannerWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  function goForward() {
    if (isLastStep) {
      onComplete();
      return;
    }

    setStepIndex((current) => current + 1);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goForward();
  }

  function resetWizard() {
    dispatch({ type: "reset" });
    setStepIndex(0);
  }

  return (
    <section className="wizard-shell" aria-labelledby="wizard-title">
      <div className="wizard-progress" aria-label="Setup progress">
        <a className="brand" href="#top" aria-label="Nearbound home">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>nearbound</span>
        </a>
        <ol>
          {steps.map((item, index) => (
            <li
              key={item.label}
              className={index === stepIndex ? "active" : index < stepIndex ? "complete" : ""}
              aria-current={index === stepIndex ? "step" : undefined}
            >
              <span>{index < stepIndex ? "✓" : index + 1}</span>
              <small>{item.label}</small>
            </li>
          ))}
        </ol>
        <p>
          Step {stepIndex + 1} of {steps.length}
        </p>
      </div>

      <form className="wizard-card" onSubmit={handleSubmit}>
        <div className="wizard-heading">
          <div className="wizard-heading-bar">
            <p className="eyebrow">First-run setup</p>
            {!isLastStep && (
              <button className="wizard-secondary-button" type="button" onClick={onComplete}>
                Skip for now
              </button>
            )}
          </div>
          <h2 id="wizard-title">{step.title}</h2>
          <p>{step.description}</p>
        </div>

        <div className="wizard-content">
          {stepIndex === 0 && (
            <div className="wizard-basics-step">
              <div>
                <label className="field-label" htmlFor="wizard-origin">Starting point</label>
                <SavedOriginSelector origins={savedOrigins} onSelect={onSavedOriginSelect} />
                <OriginAutocomplete
                  id="wizard-origin"
                  value={state.originQuery}
                  onChange={onOriginChange}
                  onSelect={onOriginSelect}
                  fieldClassName="wizard-address-field"
                  showGuidance={false}
                />
                <p className="wizard-field-note">
                  Use a saved point or choose a suggestion. The current route result stays only in this open page.
                </p>
              </div>

              <fieldset className="wizard-fieldset wizard-children-fieldset">
                <legend className="field-label">Family fit</legend>
                <label className="logistics-option family-fit-option">
                  <input
                    type="checkbox"
                    aria-label="Traveling with children"
                    checked={state.travelingWithChildren}
                    onChange={(event) =>
                      dispatch({
                        type: "set-traveling-with-children",
                        value: event.target.checked,
                      })
                    }
                  />
                  <span>
                    <strong>Traveling with children</strong>
                    <small>Use family-friendly fit when ranking destinations</small>
                  </span>
                </label>
              </fieldset>
            </div>
          )}

          {stepIndex === 1 && (
            <div className="wizard-time-step">
              <fieldset className="wizard-fieldset">
                <legend className="field-label">Time away</legend>
                <div className="wizard-day-options">
                  {dayOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={state.days === option.value ? "active" : ""}
                      aria-label={option.label}
                      aria-pressed={state.days === option.value}
                      onClick={() => dispatch({ type: "set-days", value: option.value })}
                    >
                      <strong>{option.value}</strong>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="wizard-fieldset wizard-pace-fieldset">
                <legend className="field-label">Trip pace</legend>
                <div className="wizard-pace-options">
                  {getPaceOptions(state.days).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={state.pace === option.value ? "active" : ""}
                      aria-pressed={state.pace === option.value}
                      onClick={() => dispatch({ type: "set-pace", value: option.value })}
                    >
                      <strong>{option.label}</strong>
                      <span>{option.detail}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="wizard-drive-control">
                <div className="label-line">
                  <label className="field-label" htmlFor="wizard-drive-time">Maximum drive</label>
                  <strong>{state.maxDriveHours.toFixed(1)} hours</strong>
                </div>
                <input
                  id="wizard-drive-time"
                  className="range-input"
                  type="range"
                  min={PLANNER_LIMITS.maxDriveHours.min}
                  max={PLANNER_LIMITS.maxDriveHours.max}
                  step="0.5"
                  value={state.maxDriveHours}
                  onChange={(event) =>
                    dispatch({
                      type: "set-max-drive-hours",
                      value: Number(event.target.value),
                    })
                  }
                />
                <div className="range-labels" aria-hidden="true">
                  <span>1 hour</span>
                  <span>6 hours</span>
                </div>
              </div>
            </div>
          )}

          {stepIndex === 2 && (
            <div className="wizard-interests-step">
              <fieldset className="wizard-fieldset">
                <legend className="field-label">Experiences</legend>
                <div className="wizard-preference-list">
                  {preferenceOptions.map((option) => {
                    const isSelected = state.preferences.includes(option.id);

                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={isSelected ? "active" : ""}
                        aria-pressed={isSelected}
                        onClick={() =>
                          dispatch({
                            type: "toggle-preference",
                            preference: option.id,
                          })
                        }
                      >
                        <span aria-hidden="true">{isSelected ? "✓" : "+"}</span>
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          )}

          {stepIndex === 3 && (
            <div className="wizard-boundaries-step">
              <fieldset className="wizard-fieldset">
                <legend className="field-label">Shortlist boundaries</legend>
                <div className="wizard-logistics-grid">
                  <label>
                    <input
                      type="checkbox"
                      checked={state.allowFerryRoutes}
                      onChange={(event) =>
                        dispatch({
                          type: "set-allow-ferry-routes",
                          value: event.target.checked,
                        })
                      }
                    />
                    <span><strong>Allow ferries</strong><small>Keep ferry routes in the results</small></span>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={state.allowBorderCrossings}
                      onChange={(event) =>
                        dispatch({
                          type: "set-allow-border-crossings",
                          value: event.target.checked,
                        })
                      }
                    />
                    <span><strong>Allow borders</strong><small>Keep international routes</small></span>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={state.hideVisited}
                      onChange={(event) =>
                        dispatch({
                          type: "set-hide-visited",
                          value: event.target.checked,
                        })
                      }
                    />
                    <span><strong>Hide visited places</strong><small>Focus the shortlist on somewhere new</small></span>
                  </label>
                </div>
              </fieldset>
            </div>
          )}
        </div>

        <div className="wizard-footer">
          <button className="wizard-secondary-button" type="button" onClick={resetWizard}>
            Reset answers
          </button>
          <div className="wizard-actions">
            {stepIndex > 0 && (
              <button
                className="wizard-secondary-button"
                type="button"
                onClick={() => setStepIndex((current) => current - 1)}
              >
                Back
              </button>
            )}
            <button className="wizard-primary-button" type="submit">
              {isLastStep ? "Show my trips" : "Continue"}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

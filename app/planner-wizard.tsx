"use client";

import { FormEvent, useState } from "react";

import {
  PLANNER_LIMITS,
  type PlannerAction,
  type PlannerState,
} from "@/lib/trips/planner-state";
import type { PreferenceOption } from "@/lib/trips/types";

type PlannerWizardProps = {
  state: PlannerState;
  preferenceOptions: readonly PreferenceOption[];
  dispatch: (action: PlannerAction) => void;
  onComplete: () => void;
};

const steps = [
  {
    label: "Start",
    title: "Where are you starting?",
    description:
      "A city is enough for now. Exact geocoding comes in a later Nearbound milestone.",
  },
  {
    label: "Time",
    title: "How much time do you have?",
    description:
      "Choose the trip length and the longest drive that still feels reasonable.",
  },
  {
    label: "Travelers",
    title: "Who is coming along?",
    description:
      "Party size helps Nearbound balance ambitious ideas with an easier pace.",
  },
  {
    label: "Priorities",
    title: "What should this trip feel like?",
    description:
      "Pick any experiences that sound good and remove logistics you do not want.",
  },
] as const;

const dayOptions = [
  { value: 1, label: "Day trip" },
  { value: 2, label: "2 days" },
  { value: 3, label: "3 days" },
  { value: 4, label: "4 days" },
] as const;

export function PlannerWizard({
  state,
  preferenceOptions,
  dispatch,
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
          <p className="eyebrow">First-run setup</p>
          <h2 id="wizard-title">{step.title}</h2>
          <p>{step.description}</p>
        </div>

        <div className="wizard-content">
          {stepIndex === 0 && (
            <div>
              <label className="field-label" htmlFor="wizard-origin">Starting point</label>
              <div className="address-field wizard-address-field">
                <span className="pin-mini" aria-hidden="true" />
                <input
                  id="wizard-origin"
                  value={state.originQuery}
                  onChange={(event) =>
                    dispatch({
                      type: "set-origin-query",
                      value: event.target.value,
                    })
                  }
                  placeholder="City or street address"
                />
              </div>
              <p className="wizard-field-note">
                Recommendations still use the Issaquah demo dataset. Your answer is kept only in this open page.
              </p>
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
            <div className="wizard-party-grid">
              <div className="wizard-counter">
                <div>
                  <strong>{state.adults}</strong>
                  <span>Adults</span>
                </div>
                <div>
                  <button
                    type="button"
                    aria-label="Remove one adult"
                    disabled={state.adults === PLANNER_LIMITS.adults.min}
                    onClick={() => dispatch({ type: "set-adults", value: state.adults - 1 })}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    aria-label="Add one adult"
                    disabled={state.adults === PLANNER_LIMITS.adults.max}
                    onClick={() => dispatch({ type: "set-adults", value: state.adults + 1 })}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="wizard-counter">
                <div>
                  <strong>{state.children}</strong>
                  <span>Children</span>
                </div>
                <div>
                  <button
                    type="button"
                    aria-label="Remove one child"
                    disabled={state.children === PLANNER_LIMITS.children.min}
                    onClick={() => dispatch({ type: "set-children", value: state.children - 1 })}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    aria-label="Add one child"
                    disabled={state.children === PLANNER_LIMITS.children.max}
                    onClick={() => dispatch({ type: "set-children", value: state.children + 1 })}
                  >
                    +
                  </button>
                </div>
              </div>
              <p>
                Age-specific planning is intentionally deferred. For now, children affect family-fit ranking as one group.
              </p>
            </div>
          )}

          {stepIndex === 3 && (
            <div className="wizard-priorities-step">
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

              <fieldset className="wizard-fieldset">
                <legend className="field-label">Route logistics</legend>
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
          <button className="wizard-reset" type="button" onClick={resetWizard}>
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
            {!isLastStep && (
              <button className="wizard-secondary-button" type="button" onClick={goForward}>
                Skip for now
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

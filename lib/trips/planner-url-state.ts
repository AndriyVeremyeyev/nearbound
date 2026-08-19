import {
  createInitialPlannerState,
  PLANNER_LIMITS,
  type PlannerState,
} from "./planner-state";
import type { Preference } from "./types";

const plannerParameterNames = [
  "days",
  "drive",
  "interests",
  "children",
  "ferry",
  "border",
  "visited",
] as const;

const supportedPreferences: readonly Preference[] = [
  "ocean",
  "animals",
  "city",
  "resort",
  "mountains",
  "forest",
];

function readBoolean(value: string | null) {
  if (value === "1") return true;
  if (value === "0") return false;
  return undefined;
}

function readNumber(value: string | null, min: number, max: number) {
  if (value === null || value.trim() === "") return undefined;

  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) return undefined;

  return number;
}

function readPreferences(value: string | null) {
  if (value === null) return undefined;
  if (value === "") return [];

  const preferences = value.split(",");
  if (!preferences.every((preference): preference is Preference => supportedPreferences.includes(preference as Preference))) {
    return undefined;
  }

  return [...new Set(preferences)];
}

export function readPlannerStateFromSearch(search: string): PlannerState | null {
  const parameters = new URLSearchParams(search);
  const state = createInitialPlannerState();
  let hasValidPlannerParameter = false;

  const days = readNumber(
    parameters.get("days"),
    PLANNER_LIMITS.days.min,
    PLANNER_LIMITS.days.max,
  );
  if (days !== undefined && Number.isInteger(days)) {
    state.days = days;
    hasValidPlannerParameter = true;
  }

  const drive = readNumber(
    parameters.get("drive"),
    PLANNER_LIMITS.maxDriveHours.min,
    PLANNER_LIMITS.maxDriveHours.max,
  );
  if (drive !== undefined && Number.isInteger(drive * 2)) {
    state.maxDriveHours = drive;
    hasValidPlannerParameter = true;
  }

  const preferences = readPreferences(parameters.get("interests"));
  if (preferences !== undefined) {
    state.preferences = preferences;
    hasValidPlannerParameter = true;
  }

  const booleanParameters = [
    ["children", "travelingWithChildren"],
    ["ferry", "allowFerryRoutes"],
    ["border", "allowBorderCrossings"],
    ["visited", "hideVisited"],
  ] as const;

  for (const [parameterName, stateKey] of booleanParameters) {
    const value = readBoolean(parameters.get(parameterName));
    if (value !== undefined) {
      state[stateKey] = value;
      hasValidPlannerParameter = true;
    }
  }

  return hasValidPlannerParameter ? state : null;
}

export function writePlannerSearch(
  state: PlannerState,
  currentSearch = "",
) {
  const parameters = new URLSearchParams(currentSearch);

  for (const parameterName of plannerParameterNames) {
    parameters.delete(parameterName);
  }

  parameters.set("days", String(state.days));
  parameters.set("drive", String(state.maxDriveHours));
  parameters.set("interests", state.preferences.join(","));
  parameters.set("children", state.travelingWithChildren ? "1" : "0");
  parameters.set("ferry", state.allowFerryRoutes ? "1" : "0");
  parameters.set("border", state.allowBorderCrossings ? "1" : "0");
  parameters.set("visited", state.hideVisited ? "1" : "0");

  return parameters.toString();
}

export function clearPlannerSearch(currentSearch = "") {
  const parameters = new URLSearchParams(currentSearch);

  for (const parameterName of plannerParameterNames) {
    parameters.delete(parameterName);
  }

  return parameters.toString();
}

import type { Preference, TripCriteria } from "./types";
import type { TripPace } from "@/lib/catalog/compose-trip";

export type PlannerState = {
  originQuery: string;
  maxDriveHours: number;
  travelingWithChildren: boolean;
  days: number;
  pace: TripPace;
  preferences: Preference[];
  allowFerryRoutes: boolean;
  allowBorderCrossings: boolean;
  hideVisited: boolean;
};

export type PlannerAction =
  | { type: "set-origin-query"; value: string }
  | { type: "set-max-drive-hours"; value: number }
  | { type: "set-traveling-with-children"; value: boolean }
  | { type: "set-days"; value: number }
  | { type: "set-pace"; value: TripPace }
  | { type: "toggle-preference"; preference: Preference }
  | { type: "set-allow-ferry-routes"; value: boolean }
  | { type: "set-allow-border-crossings"; value: boolean }
  | { type: "set-hide-visited"; value: boolean }
  | { type: "reset" };

export const PLANNER_LIMITS = {
  maxDriveHours: { min: 1, max: 6 },
  days: { min: 1, max: 4 },
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function createInitialPlannerState(): PlannerState {
  return {
    originQuery: "Issaquah, WA",
    maxDriveHours: 3,
    travelingWithChildren: true,
    days: 2,
    pace: "balanced",
    preferences: ["animals", "ocean"],
    allowFerryRoutes: true,
    allowBorderCrossings: true,
    hideVisited: true,
  };
}

export function plannerReducer(
  state: PlannerState,
  action: PlannerAction,
): PlannerState {
  switch (action.type) {
    case "set-origin-query":
      return { ...state, originQuery: action.value };
    case "set-max-drive-hours":
      return {
        ...state,
        maxDriveHours: clamp(
          action.value,
          PLANNER_LIMITS.maxDriveHours.min,
          PLANNER_LIMITS.maxDriveHours.max,
        ),
      };
    case "set-traveling-with-children":
      return { ...state, travelingWithChildren: action.value };
    case "set-days":
      return {
        ...state,
        days: clamp(
          action.value,
          PLANNER_LIMITS.days.min,
          PLANNER_LIMITS.days.max,
        ),
      };
    case "set-pace":
      return { ...state, pace: action.value };
    case "toggle-preference":
      return {
        ...state,
        preferences: state.preferences.includes(action.preference)
          ? state.preferences.filter(
              (preference) => preference !== action.preference,
            )
          : [...state.preferences, action.preference],
      };
    case "set-allow-ferry-routes":
      return { ...state, allowFerryRoutes: action.value };
    case "set-allow-border-crossings":
      return { ...state, allowBorderCrossings: action.value };
    case "set-hide-visited":
      return { ...state, hideVisited: action.value };
    case "reset":
      return createInitialPlannerState();
  }
}

export function toTripCriteria(
  state: PlannerState,
  visitedDestinationIds: readonly string[],
): TripCriteria {
  return {
    maxDriveHours: state.maxDriveHours,
    days: state.days,
    travelingWithChildren: state.travelingWithChildren,
    preferences: state.preferences,
    allowFerryRoutes: state.allowFerryRoutes,
    allowBorderCrossings: state.allowBorderCrossings,
    hideVisited: state.hideVisited,
    visitedDestinationIds,
  };
}

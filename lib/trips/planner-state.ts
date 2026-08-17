import type { Preference, TripCriteria } from "./types";

export type PlannerState = {
  originQuery: string;
  maxDriveHours: number;
  adults: number;
  children: number;
  days: number;
  preferences: Preference[];
  allowFerryRoutes: boolean;
  allowBorderCrossings: boolean;
  hideVisited: boolean;
};

export type PlannerAction =
  | { type: "set-origin-query"; value: string }
  | { type: "set-max-drive-hours"; value: number }
  | { type: "set-adults"; value: number }
  | { type: "set-children"; value: number }
  | { type: "set-days"; value: number }
  | { type: "toggle-preference"; preference: Preference }
  | { type: "set-allow-ferry-routes"; value: boolean }
  | { type: "set-allow-border-crossings"; value: boolean }
  | { type: "set-hide-visited"; value: boolean }
  | { type: "reset" };

export const PLANNER_LIMITS = {
  maxDriveHours: { min: 1, max: 6 },
  adults: { min: 1, max: 6 },
  children: { min: 0, max: 6 },
  days: { min: 1, max: 4 },
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function createInitialPlannerState(): PlannerState {
  return {
    originQuery: "Issaquah, WA",
    maxDriveHours: 3,
    adults: 2,
    children: 2,
    days: 2,
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
    case "set-adults":
      return {
        ...state,
        adults: clamp(
          action.value,
          PLANNER_LIMITS.adults.min,
          PLANNER_LIMITS.adults.max,
        ),
      };
    case "set-children":
      return {
        ...state,
        children: clamp(
          action.value,
          PLANNER_LIMITS.children.min,
          PLANNER_LIMITS.children.max,
        ),
      };
    case "set-days":
      return {
        ...state,
        days: clamp(
          action.value,
          PLANNER_LIMITS.days.min,
          PLANNER_LIMITS.days.max,
        ),
      };
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
    children: state.children,
    preferences: state.preferences,
    allowFerryRoutes: state.allowFerryRoutes,
    allowBorderCrossings: state.allowBorderCrossings,
    hideVisited: state.hideVisited,
    visitedDestinationIds,
  };
}

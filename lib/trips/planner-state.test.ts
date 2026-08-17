import {
  createInitialPlannerState,
  plannerReducer,
  PLANNER_LIMITS,
  toTripCriteria,
} from "./planner-state";

describe("plannerReducer", () => {
  it("creates the current prototype brief as a fresh state", () => {
    const first = createInitialPlannerState();
    const second = createInitialPlannerState();

    expect(first).toEqual({
      originQuery: "Issaquah, WA",
      maxDriveHours: 3,
      adults: 2,
      children: 2,
      days: 2,
      preferences: ["animals", "ocean"],
      allowFerryRoutes: true,
      allowBorderCrossings: true,
      hideVisited: true,
    });
    expect(first).not.toBe(second);
    expect(first.preferences).not.toBe(second.preferences);
  });

  it("toggles preferences without duplicates", () => {
    const initial = createInitialPlannerState();
    const withoutOcean = plannerReducer(initial, {
      type: "toggle-preference",
      preference: "ocean",
    });
    const restored = plannerReducer(withoutOcean, {
      type: "toggle-preference",
      preference: "ocean",
    });

    expect(withoutOcean.preferences).toEqual(["animals"]);
    expect(restored.preferences).toEqual(["animals", "ocean"]);
  });

  it("keeps numeric answers inside the supported MVP limits", () => {
    const initial = createInitialPlannerState();
    const tooSmall = [
      { type: "set-max-drive-hours" as const, value: 0 },
      { type: "set-adults" as const, value: 0 },
      { type: "set-children" as const, value: -1 },
      { type: "set-days" as const, value: 0 },
    ].reduce(plannerReducer, initial);
    const tooLarge = [
      { type: "set-max-drive-hours" as const, value: 99 },
      { type: "set-adults" as const, value: 99 },
      { type: "set-children" as const, value: 99 },
      { type: "set-days" as const, value: 99 },
    ].reduce(plannerReducer, initial);

    expect(tooSmall).toMatchObject({
      maxDriveHours: PLANNER_LIMITS.maxDriveHours.min,
      adults: PLANNER_LIMITS.adults.min,
      children: PLANNER_LIMITS.children.min,
      days: PLANNER_LIMITS.days.min,
    });
    expect(tooLarge).toMatchObject({
      maxDriveHours: PLANNER_LIMITS.maxDriveHours.max,
      adults: PLANNER_LIMITS.adults.max,
      children: PLANNER_LIMITS.children.max,
      days: PLANNER_LIMITS.days.max,
    });
  });

  it("resets every answer to a new default state", () => {
    const changed = plannerReducer(createInitialPlannerState(), {
      type: "set-origin-query",
      value: "Portland, OR",
    });

    const reset = plannerReducer(changed, { type: "reset" });

    expect(reset).toEqual(createInitialPlannerState());
    expect(reset).not.toBe(changed);
  });

  it("converts shared state into recommendation criteria without UI fields", () => {
    const criteria = toTripCriteria(createInitialPlannerState(), ["sequim"]);

    expect(criteria).toEqual({
      maxDriveHours: 3,
      days: 2,
      children: 2,
      preferences: ["animals", "ocean"],
      allowFerryRoutes: true,
      allowBorderCrossings: true,
      hideVisited: true,
      visitedDestinationIds: ["sequim"],
    });
    expect(criteria).not.toHaveProperty("originQuery");
    expect(criteria).not.toHaveProperty("adults");
  });
});

import {
  clearPlannerSearch,
  readPlannerStateFromSearch,
  writePlannerSearch,
} from "./planner-url-state";

describe("planner URL state", () => {
  it("serializes only shareable planning filters", () => {
    const search = writePlannerSearch({
      originQuery: "Private home address",
      maxDriveHours: 2.5,
      travelingWithChildren: false,
      days: 3,
      pace: "see-more",
      preferences: ["city", "ocean"],
      allowFerryRoutes: false,
      allowBorderCrossings: true,
      hideVisited: false,
    });

    expect(search).toBe(
      "days=3&pace=see-more&drive=2.5&interests=city%2Cocean&children=0&ferry=0&border=1&visited=0",
    );
    expect(search).not.toContain("Private");
    expect(search).not.toContain("origin");
  });

  it("restores valid filters while retaining the non-shareable default origin", () => {
    expect(
      readPlannerStateFromSearch(
        "?days=1&pace=easy&drive=1.5&interests=city%2Cocean&children=0&ferry=0&border=1&visited=0",
      ),
    ).toEqual({
      originQuery: "Issaquah, WA",
      maxDriveHours: 1.5,
      travelingWithChildren: false,
      days: 1,
      pace: "easy",
      preferences: ["city", "ocean"],
      allowFerryRoutes: false,
      allowBorderCrossings: true,
      hideVisited: false,
    });
  });

  it("ignores invalid parameters and refuses an otherwise unrelated URL", () => {
    expect(readPlannerStateFromSearch("?days=99&drive=cat&children=yes")).toBeNull();
    expect(readPlannerStateFromSearch("?campaign=summer")).toBeNull();
  });

  it("preserves unrelated URL parameters when updating or clearing filters", () => {
    const search = writePlannerSearch(
      readPlannerStateFromSearch("?days=1")!,
      "?campaign=summer&days=4",
    );

    expect(search).toContain("campaign=summer");
    expect(clearPlannerSearch(`?${search}`)).toBe("campaign=summer");
  });
});

import { recommendDestinations } from "./recommend";
import type { Destination, TripCriteria } from "./types";

const defaultCriteria: TripCriteria = {
  maxDriveHours: 3,
  days: 2,
  children: 0,
  preferences: [],
  hideVisited: false,
  visitedDestinationIds: [],
};

function createDestination(
  overrides: Partial<Destination> & Pick<Destination, "id">,
): Destination {
  return {
    name: overrides.id,
    region: "Test region",
    hours: 2,
    minDays: 1,
    maxDays: 4,
    preferences: [],
    familyFit: 5,
    weatherBackup: 5,
    summary: "Test summary",
    anchor: "Test anchor",
    stay: "Test stay",
    caution: "Test caution",
    ...overrides,
  };
}

describe("recommendDestinations", () => {
  it("excludes destinations outside the maximum drive estimate", () => {
    const destinations = [
      createDestination({ id: "inside", hours: 1.1 }),
      createDestination({ id: "outside", hours: 1.2 }),
    ];

    const result = recommendDestinations(destinations, {
      ...defaultCriteria,
      maxDriveHours: 1,
    });

    expect(result.map((destination) => destination.id)).toEqual(["inside"]);
  });

  it("hides visited destinations only when requested", () => {
    const destinations = [
      createDestination({ id: "new" }),
      createDestination({ id: "visited" }),
    ];

    const hidden = recommendDestinations(destinations, {
      ...defaultCriteria,
      hideVisited: true,
      visitedDestinationIds: ["visited"],
    });
    const allowed = recommendDestinations(destinations, defaultCriteria);

    expect(hidden.map((destination) => destination.id)).toEqual(["new"]);
    expect(allowed.map((destination) => destination.id)).toEqual([
      "new",
      "visited",
    ]);
  });

  it("ranks a destination suited to the trip length above an otherwise equal option", () => {
    const destinations = [
      createDestination({ id: "wrong-length", minDays: 3, maxDays: 4 }),
      createDestination({ id: "right-length", minDays: 1, maxDays: 2 }),
    ];

    const result = recommendDestinations(destinations, defaultCriteria);

    expect(result.map((destination) => destination.id)).toEqual([
      "right-length",
      "wrong-length",
    ]);
  });

  it("uses preference matches before drive time to order strong fits", () => {
    const destinations = [
      createDestination({
        id: "nearby-city",
        hours: 1,
        preferences: ["city"],
      }),
      createDestination({
        id: "ocean-match",
        hours: 2,
        preferences: ["ocean"],
      }),
    ];

    const result = recommendDestinations(destinations, {
      ...defaultCriteria,
      preferences: ["ocean"],
    });

    expect(result[0]).toMatchObject({
      id: "ocean-match",
      preferenceMatches: 1,
    });
  });
});

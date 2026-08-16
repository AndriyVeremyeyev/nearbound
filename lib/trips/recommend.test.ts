import { recommendDestinations } from "./recommend";
import type { Destination, TripCriteria } from "./types";

const defaultCriteria: TripCriteria = {
  maxDriveHours: 3,
  days: 2,
  children: 0,
  preferences: [],
  allowFerryRoutes: true,
  allowBorderCrossings: true,
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
    usesFerry: false,
    crossesBorder: false,
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

    expect(
      result.recommendations.map((destination) => destination.id),
    ).toEqual(["inside"]);
    expect(result.exclusions).toEqual([
      expect.objectContaining({
        destination: expect.objectContaining({ id: "outside" }),
        reasons: ["drive-time"],
      }),
    ]);
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

    expect(
      hidden.recommendations.map((destination) => destination.id),
    ).toEqual(["new"]);
    expect(allowed.recommendations.map((destination) => destination.id)).toEqual([
      "new",
      "visited",
    ]);
    expect(hidden.exclusions[0]).toMatchObject({ reasons: ["visited"] });
  });

  it("excludes a destination that does not fit the trip length", () => {
    const destinations = [
      createDestination({ id: "wrong-length", minDays: 3, maxDays: 4 }),
      createDestination({ id: "right-length", minDays: 1, maxDays: 2 }),
    ];

    const result = recommendDestinations(destinations, defaultCriteria);

    expect(
      result.recommendations.map((destination) => destination.id),
    ).toEqual(["right-length"]);
    expect(result.exclusions[0]).toMatchObject({
      destination: { id: "wrong-length" },
      reasons: ["trip-length"],
    });
  });

  it("applies ferry and border preferences as route constraints", () => {
    const destinations = [
      createDestination({ id: "local" }),
      createDestination({ id: "ferry", usesFerry: true }),
      createDestination({ id: "border", crossesBorder: true }),
    ];

    const result = recommendDestinations(destinations, {
      ...defaultCriteria,
      allowFerryRoutes: false,
      allowBorderCrossings: false,
    });

    expect(
      result.recommendations.map((destination) => destination.id),
    ).toEqual(["local"]);
    expect(
      result.exclusions.map(({ destination, reasons }) => ({
        id: destination.id,
        reasons,
      })),
    ).toEqual([
      { id: "ferry", reasons: ["ferry"] },
      { id: "border", reasons: ["border"] },
    ]);
  });

  it("keeps every applicable exclusion reason for explanation", () => {
    const result = recommendDestinations(
      [createDestination({ id: "difficult", hours: 4, usesFerry: true })],
      {
        ...defaultCriteria,
        allowFerryRoutes: false,
      },
    );

    expect(result.exclusions[0].reasons).toEqual(["drive-time", "ferry"]);
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

    expect(result.recommendations[0]).toMatchObject({
      id: "ocean-match",
      preferenceMatches: 1,
    });
  });
});

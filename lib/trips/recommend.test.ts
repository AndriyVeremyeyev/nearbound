import { recommendDestinations, SCORE_WEIGHTS } from "./recommend";
import type { Destination, TripCriteria } from "./types";

const defaultCriteria: TripCriteria = {
  maxDriveHours: 3,
  days: 2,
  travelingWithChildren: false,
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
    sourceReferences: [],
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

  it("uses experience fit before drive time to order strong matches", () => {
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

    expect(result.recommendations[0].id).toBe("ocean-match");
    expect(
      result.recommendations[0].scoreBreakdown.find(
        (factor) => factor.id === "experience",
      ),
    ).toMatchObject({
      score: SCORE_WEIGHTS.experience,
      maxScore: SCORE_WEIGHTS.experience,
      sentiment: "strength",
    });
    expect(result.recommendations[0].matchReasons).toContain(
      "Matches all selected experiences: Ocean.",
    );
  });

  it("builds the total from five explicit weighted factors", () => {
    expect(SCORE_WEIGHTS).toEqual({
      experience: 30,
      driveTime: 25,
      familyFit: 20,
      weatherBackup: 15,
      logistics: 10,
    });

    const [recommendation] = recommendDestinations(
      [createDestination({ id: "balanced" })],
      defaultCriteria,
    ).recommendations;

    expect(recommendation.scoreBreakdown).toHaveLength(5);
    expect(recommendation.score).toBe(
      recommendation.scoreBreakdown.reduce(
        (total, factor) => total + factor.score,
        0,
      ),
    );
    expect(recommendation.score).toBeLessThanOrEqual(100);
  });

  it("keeps unspecified experience and family criteria neutral", () => {
    const [recommendation] = recommendDestinations(
      [createDestination({ id: "neutral" })],
      defaultCriteria,
    ).recommendations;

    expect(recommendation.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "experience",
          score: 18,
          sentiment: "neutral",
        }),
        expect.objectContaining({
          id: "family-fit",
          score: 12,
          sentiment: "neutral",
        }),
      ]),
    );
  });

  it("uses family fit only when the trip includes children", () => {
    const destinations = [
      createDestination({
        id: "closer-general-option",
        hours: 1,
        familyFit: 3,
      }),
      createDestination({
        id: "family-option",
        hours: 2,
        familyFit: 10,
      }),
    ];

    const withoutChildren = recommendDestinations(
      destinations,
      defaultCriteria,
    );
    const withChildren = recommendDestinations(destinations, {
      ...defaultCriteria,
      travelingWithChildren: true,
    });

    expect(withoutChildren.recommendations.map(({ id }) => id)).toEqual([
      "closer-general-option",
      "family-option",
    ]);
    expect(withChildren.recommendations.map(({ id }) => id)).toEqual([
      "family-option",
      "closer-general-option",
    ]);
  });

  it("keeps route friction visible even when the route is allowed", () => {
    const result = recommendDestinations(
      [
        createDestination({ id: "simple" }),
        createDestination({ id: "ferry", usesFerry: true }),
        createDestination({ id: "border", crossesBorder: true }),
      ],
      defaultCriteria,
    );

    expect(
      result.recommendations.map((destination) => ({
        id: destination.id,
        logistics: destination.scoreBreakdown.find(
          (factor) => factor.id === "logistics",
        )?.score,
      })),
    ).toEqual([
      { id: "simple", logistics: 10 },
      { id: "ferry", logistics: 7 },
      { id: "border", logistics: 6 },
    ]);
    expect(result.recommendations[1].tradeoffs).toContain(
      "Requires a ferry crossing even when ferries are allowed.",
    );
  });

  it("explains when an allowed destination uses most of the drive limit", () => {
    const [recommendation] = recommendDestinations(
      [createDestination({ id: "edge", hours: 2.9 })],
      defaultCriteria,
    ).recommendations;

    expect(recommendation.tradeoffs).toContain(
      "Uses most of your drive-time limit.",
    );
  });
});

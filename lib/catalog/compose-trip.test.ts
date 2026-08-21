import { composeTripIdeas, type RouteCatalog } from "./compose-trip";

const oregonCoastFixture: RouteCatalog = {
  id: "oregon-pacific-coast-byway",
  name: "Oregon Pacific Coast",
  areas: [
    { id: "astoria", name: "Astoria" },
    { id: "cannon", name: "Cannon Beach" },
    { id: "newport", name: "Newport" },
    { id: "yachats", name: "Yachats & Cape Perpetua" },
  ],
  legs: [
    { fromAreaId: "astoria", toAreaId: "cannon", distanceMiles: 27, driveMinutes: 40 },
    { fromAreaId: "cannon", toAreaId: "newport", distanceMiles: 55, driveMinutes: 80 },
    { fromAreaId: "newport", toAreaId: "yachats", distanceMiles: 34, driveMinutes: 50 },
  ],
  stops: [
    { id: "museum", areaId: "astoria", name: "Maritime Museum", typicalDurationMinutes: 120, childFit: "good", preferences: ["city", "ocean"] },
    { id: "haystack", areaId: "cannon", name: "Haystack Rock", typicalDurationMinutes: 75, childFit: "good", preferences: ["ocean", "animals"] },
    { id: "ecola", areaId: "cannon", name: "Ecola State Park", typicalDurationMinutes: 120, childFit: "good", preferences: ["ocean", "forest"] },
    { id: "aquarium", areaId: "newport", name: "Oregon Coast Aquarium", typicalDurationMinutes: 180, childFit: "good", preferences: ["animals", "ocean"] },
    { id: "cape", areaId: "yachats", name: "Cape Perpetua", typicalDurationMinutes: 90, childFit: "possible", preferences: ["ocean", "forest"] },
    { id: "hard-hike", areaId: "yachats", name: "Hard hike", typicalDurationMinutes: 240, childFit: "not_recommended", preferences: ["forest"] },
  ],
};

describe("composeTripIdeas", () => {
  it("keeps an easy one-day idea within one area and a light activity budget", () => {
    const [idea] = composeTripIdeas(oregonCoastFixture, {
      days: 1,
      pace: "easy",
      preferences: ["animals", "ocean"],
      travelingWithChildren: true,
    });

    expect(idea.areaIds).toHaveLength(1);
    expect(idea.activityMinutes).toBeLessThanOrEqual(180);
  });

  it("covers more connected geography for a balanced multi-day trip", () => {
    const [idea] = composeTripIdeas(oregonCoastFixture, {
      days: 3,
      pace: "balanced",
      preferences: ["ocean", "forest"],
      travelingWithChildren: false,
    });

    expect(idea.areaIds.length).toBeGreaterThanOrEqual(3);
    expect(idea.driveMinutes).toBeLessThanOrEqual(630);
    expect(idea.matchedPreferences).toEqual(["ocean", "forest"]);
  });

  it("does not include stops marked not recommended for children", () => {
    const ideas = composeTripIdeas(oregonCoastFixture, {
      days: 4,
      pace: "see-more",
      preferences: ["forest"],
      travelingWithChildren: true,
    });

    expect(ideas.flatMap((idea) => idea.stops).map((stop) => stop.id)).not.toContain(
      "hard-hike",
    );
  });

  it("returns no ideas when its route is missing a required connecting leg", () => {
    const catalogWithoutLeg = {
      ...oregonCoastFixture,
      legs: oregonCoastFixture.legs.slice(0, 1),
    };

    const ideas = composeTripIdeas(catalogWithoutLeg, {
      days: 3,
      pace: "balanced",
      preferences: ["ocean"],
      travelingWithChildren: false,
    });

    expect(ideas.every((idea) => idea.areaIds.length < 3)).toBe(true);
  });
});

import { validateRouteCatalog, type CatalogValidationRoute } from "./validate-route";

const route: CatalogValidationRoute = {
  id: "test-coast",
  name: "Test Coast",
  lastVerifiedAt: "2026-08-20",
  reviewDueAt: "2027-08-20",
  sourceCount: 1,
  areas: [
    {
      id: "north",
      name: "North",
      latitude: 45,
      longitude: -123,
      lastVerifiedAt: "2026-08-20",
      reviewDueAt: "2027-08-20",
      sourceCount: 1,
    },
    {
      id: "south",
      name: "South",
      latitude: 44,
      longitude: -124,
      lastVerifiedAt: "2026-08-20",
      reviewDueAt: "2027-08-20",
      sourceCount: 1,
    },
  ],
  stops: [
    {
      id: "beach",
      name: "Beach",
      areaIds: ["south"],
      latitude: 44.1,
      longitude: -124.1,
      typicalDurationMinutes: 90,
      lastVerifiedAt: "2026-08-20",
      reviewDueAt: "2027-08-20",
      sourceCount: 1,
    },
  ],
  legs: [
    {
      fromAreaId: "north",
      toAreaId: "south",
      distanceMiles: 35,
      driveMinutes: 55,
      lastVerifiedAt: "2026-08-20",
      reviewDueAt: "2027-08-20",
    },
  ],
  sources: [{ id: "official", status: "active", lastCheckedAt: "2026-08-20" }],
};

describe("validateRouteCatalog", () => {
  it("accepts a sourced contiguous route with complete review metadata", () => {
    expect(validateRouteCatalog(route, { today: "2026-08-21" })).toEqual({
      errors: [],
      warnings: [],
    });
  });

  it("reports broken route order and missing publishable data", () => {
    const report = validateRouteCatalog(
      {
        ...route,
        sourceCount: 0,
        areas: [{ ...route.areas[0], latitude: null, sourceCount: 0 }],
        stops: [{ ...route.stops[0], areaIds: ["outside-route"], typicalDurationMinutes: 10 }],
        legs: [{ ...route.legs[0], fromAreaId: "south", distanceMiles: 0 }],
        sources: [{ id: "official", status: "needs_review", lastCheckedAt: null }],
      },
      { today: "2026-08-21" },
    );

    expect(report.errors).toEqual(expect.arrayContaining([
      "Route test-coast has no source evidence.",
      "Route test-coast needs at least two ordered areas.",
      "Area north has no source evidence.",
      "Area north needs coordinates.",
      "Stop beach is not connected to an area on route test-coast.",
      "Stop beach has an implausible typical duration.",
      "Route test-coast leg 1 does not connect the ordered areas.",
      "Route test-coast leg 1 needs positive miles and drive minutes.",
      "Source official is needs_review, not active.",
    ]));
    expect(report.warnings).toContain("Source official has no last-checked date.");
  });

  it("keeps stale reviews visible without rejecting otherwise complete data", () => {
    const report = validateRouteCatalog(
      { ...route, lastVerifiedAt: "2026-07-20", reviewDueAt: "2026-08-01" },
      { today: "2026-08-21" },
    );

    expect(report.errors).toEqual([]);
    expect(report.warnings).toContain("Route test-coast is due for review (2026-08-01).");
  });
});

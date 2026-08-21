import { validateRouteCatalog } from "@/lib/catalog/validate-route";

import {
  CATALOG_REVIEW_DUE_ON,
  CATALOG_VERIFIED_ON,
  oregonCoastAreas,
  oregonCoastRoute,
  oregonCoastRouteLegs,
  oregonCoastTripPlans,
  oregonCoastSources,
  oregonCoastStops,
  sourceForOregonCoastStop,
} from "./oregon-coast";

describe("Oregon Coast catalog definition", () => {
  it("is a sourced, contiguous route before it is written to Neon", () => {
    const report = validateRouteCatalog(
      {
        ...oregonCoastRoute,
        lastVerifiedAt: CATALOG_VERIFIED_ON,
        reviewDueAt: CATALOG_REVIEW_DUE_ON,
        sourceCount: 1,
        areas: oregonCoastAreas.map((area) => ({
          ...area,
          lastVerifiedAt: CATALOG_VERIFIED_ON,
          reviewDueAt: CATALOG_REVIEW_DUE_ON,
          sourceCount: 1,
        })),
        stops: oregonCoastStops.map((stop) => ({
          ...stop,
          areaIds: [stop.areaId],
          lastVerifiedAt: CATALOG_VERIFIED_ON,
          reviewDueAt: CATALOG_REVIEW_DUE_ON,
          sourceCount: oregonCoastSources.some((source) => source.id === sourceForOregonCoastStop(stop.id)) ? 1 : 0,
        })),
        legs: oregonCoastRouteLegs.map((leg) => ({
          ...leg,
          lastVerifiedAt: CATALOG_VERIFIED_ON,
          reviewDueAt: CATALOG_REVIEW_DUE_ON,
        })),
        sources: oregonCoastSources.map((source) => ({
          id: source.id,
          status: "active",
          lastCheckedAt: CATALOG_VERIFIED_ON,
        })),
      },
      { today: "2026-08-21" },
    );

    expect(report).toEqual({ errors: [], warnings: [] });
  });

  it("defines only realistic one-to-four-day plans inside the longer corridor", () => {
    expect(oregonCoastTripPlans).toEqual([
      expect.objectContaining({ id: "north-coast-escape", minDays: 2, minDaysWithChildren: null, maxDays: 2 }),
      expect.objectContaining({ id: "north-oregon-coast", minDays: 3, minDaysWithChildren: 4, maxDays: 4 }),
    ]);
  });
});

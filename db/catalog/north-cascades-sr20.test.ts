import { validateRouteCatalog } from "@/lib/catalog/validate-route";

import {
  NORTH_CASCADES_REVIEW_DUE_ON,
  NORTH_CASCADES_VERIFIED_ON,
  northCascadesSr20Areas,
  northCascadesSr20Route,
  northCascadesSr20RouteLegs,
  northCascadesSr20TripPlans,
  northCascadesSr20Sources,
  northCascadesSr20Stops,
  sourceForNorthCascadesSr20Stop,
} from "./north-cascades-sr20";

describe("North Cascades SR-20 catalog definition", () => {
  it("is a sourced, contiguous route before it is written to Neon", () => {
    const report = validateRouteCatalog(
      {
        ...northCascadesSr20Route,
        lastVerifiedAt: NORTH_CASCADES_VERIFIED_ON,
        reviewDueAt: NORTH_CASCADES_REVIEW_DUE_ON,
        sourceCount: 2,
        areas: northCascadesSr20Areas.map((area) => ({
          ...area,
          lastVerifiedAt: NORTH_CASCADES_VERIFIED_ON,
          reviewDueAt: NORTH_CASCADES_REVIEW_DUE_ON,
          sourceCount: 1,
        })),
        stops: northCascadesSr20Stops.map((stop) => ({
          ...stop,
          areaIds: [stop.areaId],
          lastVerifiedAt: NORTH_CASCADES_VERIFIED_ON,
          reviewDueAt: NORTH_CASCADES_REVIEW_DUE_ON,
          sourceCount: northCascadesSr20Sources.some(
            (source) => source.id === sourceForNorthCascadesSr20Stop(stop.id),
          ) ? 1 : 0,
        })),
        legs: northCascadesSr20RouteLegs.map((leg) => ({
          ...leg,
          lastVerifiedAt: NORTH_CASCADES_VERIFIED_ON,
          reviewDueAt: NORTH_CASCADES_REVIEW_DUE_ON,
        })),
        sources: northCascadesSr20Sources.map((source) => ({
          id: source.id,
          status: "active",
          lastCheckedAt: NORTH_CASCADES_VERIFIED_ON,
        })),
      },
      { today: "2026-08-21" },
    );

    expect(report).toEqual({ errors: [], warnings: [] });
  });

  it("keeps the one-day sampler out of family results while retaining a fuller family loop", () => {
    expect(northCascadesSr20TripPlans).toEqual([
      expect.objectContaining({ id: "north-cascades-sampler", minDays: 1, minDaysWithChildren: null, maxDays: 1 }),
      expect.objectContaining({ id: "north-cascades-loop", minDays: 2, minDaysWithChildren: 3, maxDays: 4 }),
    ]);
  });
});

import { validateRouteCatalog } from "@/lib/catalog/validate-route";

import {
  MOUNT_RAINIER_REVIEW_DUE_ON,
  MOUNT_RAINIER_VERIFIED_ON,
  mountRainierSouthAreas,
  mountRainierSouthRoute,
  mountRainierSouthRouteLegs,
  mountRainierSouthSources,
  mountRainierSouthStops,
  mountRainierSouthTripPlans,
  sourceForMountRainierSouthStop,
} from "./mount-rainier-south";

describe("Mount Rainier south catalog definition", () => {
  it("is a sourced, contiguous route before it is written to Neon", () => {
    const report = validateRouteCatalog({
      ...mountRainierSouthRoute,
      lastVerifiedAt: MOUNT_RAINIER_VERIFIED_ON,
      reviewDueAt: MOUNT_RAINIER_REVIEW_DUE_ON,
      sourceCount: 2,
      areas: mountRainierSouthAreas.map((area) => ({ ...area, lastVerifiedAt: MOUNT_RAINIER_VERIFIED_ON, reviewDueAt: MOUNT_RAINIER_REVIEW_DUE_ON, sourceCount: 1 })),
      stops: mountRainierSouthStops.map((stop) => ({
        ...stop,
        areaIds: [stop.areaId],
        lastVerifiedAt: MOUNT_RAINIER_VERIFIED_ON,
        reviewDueAt: MOUNT_RAINIER_REVIEW_DUE_ON,
        sourceCount: mountRainierSouthSources.some((source) => source.id === sourceForMountRainierSouthStop(stop.id)) ? 1 : 0,
      })),
      legs: mountRainierSouthRouteLegs.map((leg) => ({ ...leg, lastVerifiedAt: MOUNT_RAINIER_VERIFIED_ON, reviewDueAt: MOUNT_RAINIER_REVIEW_DUE_ON })),
      sources: mountRainierSouthSources.map((source) => ({ id: source.id, status: "active", lastCheckedAt: MOUNT_RAINIER_VERIFIED_ON })),
    }, { today: "2026-08-21" });

    expect(report).toEqual({ errors: [], warnings: [] });
  });

  it("keeps the one-day mountain idea out of family results", () => {
    expect(mountRainierSouthTripPlans).toEqual([
      expect.objectContaining({ id: "rainier-mountain-day", minDays: 1, minDaysWithChildren: null, maxDays: 1 }),
      expect.objectContaining({ id: "rainier-slow-stay", minDays: 2, minDaysWithChildren: 2, maxDays: 3 }),
    ]);
  });
});

import { validateRouteCatalog } from "@/lib/catalog/validate-route";

import {
  COLUMBIA_GORGE_REVIEW_DUE_ON,
  COLUMBIA_GORGE_VERIFIED_ON,
  columbiaRiverGorgeAreas,
  columbiaRiverGorgeRoute,
  columbiaRiverGorgeRouteLegs,
  columbiaRiverGorgeSources,
  columbiaRiverGorgeStops,
  columbiaRiverGorgeTripPlans,
  sourceForColumbiaRiverGorgeStop,
} from "./columbia-river-gorge";

describe("Columbia River Gorge catalog definition", () => {
  it("is a sourced, contiguous route before it is written to Neon", () => {
    const report = validateRouteCatalog({
      ...columbiaRiverGorgeRoute,
      lastVerifiedAt: COLUMBIA_GORGE_VERIFIED_ON,
      reviewDueAt: COLUMBIA_GORGE_REVIEW_DUE_ON,
      sourceCount: 2,
      areas: columbiaRiverGorgeAreas.map((area) => ({ ...area, lastVerifiedAt: COLUMBIA_GORGE_VERIFIED_ON, reviewDueAt: COLUMBIA_GORGE_REVIEW_DUE_ON, sourceCount: 1 })),
      stops: columbiaRiverGorgeStops.map((stop) => ({
        ...stop,
        areaIds: [stop.areaId],
        lastVerifiedAt: COLUMBIA_GORGE_VERIFIED_ON,
        reviewDueAt: COLUMBIA_GORGE_REVIEW_DUE_ON,
        sourceCount: columbiaRiverGorgeSources.some((source) => source.id === sourceForColumbiaRiverGorgeStop(stop.id)) ? 1 : 0,
      })),
      legs: columbiaRiverGorgeRouteLegs.map((leg) => ({ ...leg, lastVerifiedAt: COLUMBIA_GORGE_VERIFIED_ON, reviewDueAt: COLUMBIA_GORGE_REVIEW_DUE_ON })),
      sources: columbiaRiverGorgeSources.map((source) => ({ id: source.id, status: "active", lastCheckedAt: COLUMBIA_GORGE_VERIFIED_ON })),
    }, { today: "2026-08-21" });

    expect(report).toEqual({ errors: [], warnings: [] });
  });

  it("keeps the full cross-river loop for a realistic three- or four-day trip", () => {
    expect(columbiaRiverGorgeTripPlans).toEqual([
      expect.objectContaining({ id: "gorge-river-towns", minDays: 2, minDaysWithChildren: 3, maxDays: 3 }),
      expect.objectContaining({ id: "gorge-cross-river-loop", minDays: 3, minDaysWithChildren: 4, maxDays: 4 }),
    ]);
  });
});

import { validateRouteCatalog } from "@/lib/catalog/validate-route";

import {
  sourceForWhidbeyIslandStop,
  WHIDBEY_ISLAND_REVIEW_DUE_ON,
  WHIDBEY_ISLAND_VERIFIED_ON,
  whidbeyIslandAreas,
  whidbeyIslandRoute,
  whidbeyIslandRouteLegs,
  whidbeyIslandSources,
  whidbeyIslandStops,
  whidbeyIslandTripPlans,
} from "./whidbey-island";

describe("Whidbey Island catalog definition", () => {
  it("is a sourced, contiguous ferry-aware route before it is written to Neon", () => {
    const report = validateRouteCatalog({
      ...whidbeyIslandRoute,
      lastVerifiedAt: WHIDBEY_ISLAND_VERIFIED_ON,
      reviewDueAt: WHIDBEY_ISLAND_REVIEW_DUE_ON,
      sourceCount: 3,
      areas: whidbeyIslandAreas.map((area) => ({
        ...area,
        lastVerifiedAt: WHIDBEY_ISLAND_VERIFIED_ON,
        reviewDueAt: WHIDBEY_ISLAND_REVIEW_DUE_ON,
        sourceCount: 1,
      })),
      stops: whidbeyIslandStops.map((stop) => ({
        ...stop,
        areaIds: [stop.areaId],
        lastVerifiedAt: WHIDBEY_ISLAND_VERIFIED_ON,
        reviewDueAt: WHIDBEY_ISLAND_REVIEW_DUE_ON,
        sourceCount: whidbeyIslandSources.some((source) => source.id === sourceForWhidbeyIslandStop(stop.id)) ? 1 : 0,
      })),
      legs: whidbeyIslandRouteLegs.map((leg) => ({
        ...leg,
        lastVerifiedAt: WHIDBEY_ISLAND_VERIFIED_ON,
        reviewDueAt: WHIDBEY_ISLAND_REVIEW_DUE_ON,
      })),
      sources: whidbeyIslandSources.map((source) => ({
        id: source.id,
        status: "active",
        lastCheckedAt: WHIDBEY_ISLAND_VERIFIED_ON,
      })),
    }, { today: "2026-08-21" });

    expect(report).toEqual({ errors: [], warnings: [] });
  });

  it("keeps its ferry leg explicit and protects the rushed family boundary", () => {
    expect(whidbeyIslandRouteLegs[0].usesFerry).toBe(true);
    expect(whidbeyIslandTripPlans).toEqual([
      expect.objectContaining({ id: "south-whidbey-ferry-day", minDays: 1, minDaysWithChildren: 2, maxDays: 2 }),
      expect.objectContaining({ id: "whidbey-ferry-loop", minDays: 2, minDaysWithChildren: 3, maxDays: 3 }),
    ]);
  });
});

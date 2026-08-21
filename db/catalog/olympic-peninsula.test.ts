import { validateRouteCatalog } from "@/lib/catalog/validate-route";

import {
  olympicPeninsulaAreas,
  olympicPeninsulaRoute,
  olympicPeninsulaRouteLegs,
  olympicPeninsulaSources,
  olympicPeninsulaStops,
  olympicPeninsulaTripPlans,
  OLYMPIC_PENINSULA_REVIEW_DUE_ON,
  OLYMPIC_PENINSULA_VERIFIED_ON,
  sourceForOlympicPeninsulaStop,
} from "./olympic-peninsula";

describe("Olympic Peninsula catalog definition", () => {
  it("is a sourced, contiguous route before it is written to Neon", () => {
    const report = validateRouteCatalog(
      {
        ...olympicPeninsulaRoute,
        lastVerifiedAt: OLYMPIC_PENINSULA_VERIFIED_ON,
        reviewDueAt: OLYMPIC_PENINSULA_REVIEW_DUE_ON,
        sourceCount: 2,
        areas: olympicPeninsulaAreas.map((area) => ({
          ...area,
          lastVerifiedAt: OLYMPIC_PENINSULA_VERIFIED_ON,
          reviewDueAt: OLYMPIC_PENINSULA_REVIEW_DUE_ON,
          sourceCount: 1,
        })),
        stops: olympicPeninsulaStops.map((stop) => ({
          ...stop,
          areaIds: [stop.areaId],
          lastVerifiedAt: OLYMPIC_PENINSULA_VERIFIED_ON,
          reviewDueAt: OLYMPIC_PENINSULA_REVIEW_DUE_ON,
          sourceCount: olympicPeninsulaSources.some(
            (source) => source.id === sourceForOlympicPeninsulaStop(stop.id),
          ) ? 1 : 0,
        })),
        legs: olympicPeninsulaRouteLegs.map((leg) => ({
          ...leg,
          lastVerifiedAt: OLYMPIC_PENINSULA_VERIFIED_ON,
          reviewDueAt: OLYMPIC_PENINSULA_REVIEW_DUE_ON,
        })),
        sources: olympicPeninsulaSources.map((source) => ({
          id: source.id,
          status: "active",
          lastCheckedAt: OLYMPIC_PENINSULA_VERIFIED_ON,
        })),
      },
      { today: "2026-08-21" },
    );

    expect(report).toEqual({ errors: [], warnings: [] });
  });

  it("keeps the fuller loop out of rushed family results", () => {
    expect(olympicPeninsulaTripPlans).toEqual([
      expect.objectContaining({ id: "olympic-north-shore", minDays: 2, minDaysWithChildren: 3, maxDays: 3 }),
      expect.objectContaining({ id: "olympic-ecosystems-loop", minDays: 3, minDaysWithChildren: 4, maxDays: 4 }),
    ]);
  });
});

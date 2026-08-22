import {
  planningRegionBritishColumbiaDistricts,
  planningRegionDrafts,
  planningRegionUnitedStatesCounties,
} from "./planning-region-drafts";

describe("planning region draft boundaries", () => {
  it("has eleven reachable top-level regions, including two geographically distinct Canadian regions", () => {
    expect(planningRegionDrafts).toHaveLength(11);
    expect(planningRegionDrafts.map((region) => region.id)).toContain("mainland-british-columbia");
    expect(planningRegionDrafts.map((region) => region.id)).toContain("vancouver-island-gulf-islands");
    expect(planningRegionDrafts.map((region) => region.id)).toContain("eastern-washington");
    expect(planningRegionDrafts.map((region) => region.id)).toContain("oregon-cascades-high-desert");
    expect(planningRegionDrafts.map((region) => region.id)).not.toContain("central-oregon");
    expect(planningRegionDrafts.map((region) => region.id)).not.toContain("oregon-outdoors");
    expect(planningRegionDrafts.map((region) => region.id)).not.toContain("southwest-british-columbia");
    expect(planningRegionDrafts.map((region) => region.id)).not.toContain("okanagan");
  });

  it("builds US region boundaries from non-overlapping official county memberships", () => {
    const countyIds = Object.values(planningRegionUnitedStatesCounties).flat();
    expect(new Set(countyIds).size).toBe(countyIds.length);
    expect(countyIds).toContain("53063"); // Spokane
    expect(countyIds).toContain("53071"); // Walla Walla
  });

  it("keeps Metro Vancouver on the mainland side of the British Columbia split", () => {
    expect(planningRegionBritishColumbiaDistricts["mainland-british-columbia"])
      .toContain("Metro Vancouver Regional District");
  });
});

import { getTripIdeaMedia } from "./trip-idea-media";

describe("getTripIdeaMedia", () => {
  it("returns a credited visual for a catalog destination", () => {
    expect(getTripIdeaMedia({ destinationId: "point-defiance" })).toEqual(
      expect.objectContaining({
        imageUrl: expect.stringContaining("images.unsplash.com"),
        alt: expect.any(String),
        attribution: expect.objectContaining({
          label: "Photo via Unsplash",
          url: "https://unsplash.com/license",
        }),
      }),
    );
  });

  it("keeps route visuals separate from destination visuals", () => {
    expect(getTripIdeaMedia({ routeId: "oregon-pacific-coast-byway" })).toEqual(
      expect.objectContaining({
        alt: expect.stringContaining("Pacific"),
      }),
    );
    expect(getTripIdeaMedia({ routeId: "unknown-route" })).toBeUndefined();
  });
});

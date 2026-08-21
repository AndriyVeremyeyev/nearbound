import {
  calculateCatalogRouteGeometry,
  createCatalogRouteDirectionsUrl,
} from "./mapbox-catalog-route";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

const linearCatalog = {
  id: "coast",
  shape: "linear" as const,
  areas: [
    { id: "astoria", name: "Astoria", latitude: 46.1879, longitude: -123.8313 },
    { id: "cannon-beach", name: "Cannon Beach", latitude: 45.8918, longitude: -123.9615 },
  ],
};

describe("catalog route geometry", () => {
  it("requests a road geometry through the catalog areas in order", async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse({
      code: "Ok",
      routes: [{ geometry: { type: "LineString", coordinates: [[-123.8313, 46.1879], [-123.9, 46.0], [-123.9615, 45.8918]] } }],
    })) as jest.MockedFunction<typeof fetch>;

    const geometry = await calculateCatalogRouteGeometry({
      accessToken: "pk.test-token",
      catalog: linearCatalog,
      fetcher,
    });

    expect(String(fetcher.mock.calls[0][0])).toContain("geometries=geojson");
    expect(String(fetcher.mock.calls[0][0])).toContain("overview=full");
    expect(geometry).toEqual({
      routeId: "coast",
      coordinates: [[-123.8313, 46.1879], [-123.9, 46.0], [-123.9615, 45.8918]],
      includesTemporaryOrigin: false,
    });
  });

  it("closes a loop through the temporary origin without putting it in a URL", () => {
    const url = createCatalogRouteDirectionsUrl({
      accessToken: "pk.test-token",
      catalog: { ...linearCatalog, shape: "loop" as const },
      origin: { label: "Issaquah, WA", latitude: 47.5301, longitude: -122.0326 },
    });

    expect(url.pathname).toContain("-122.0326,47.5301");
    expect(url.pathname.match(/-122\.0326,47\.5301/g)).toHaveLength(2);
    expect(url.searchParams.get("geometries")).toBe("geojson");
  });
});

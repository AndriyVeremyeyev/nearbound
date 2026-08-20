import {
  calculateLiveRouteEstimates,
  MapboxRouteError,
} from "./mapbox-routes";

const destinations = [
  { id: "point-defiance", latitude: 47.3041, longitude: -122.5275 },
  { id: "bellingham", latitude: 48.7519, longitude: -122.4787 },
];

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body,
  } as Response;
}

describe("calculateLiveRouteEstimates", () => {
  it("maps one Matrix row to destinations from a confirmed origin", async () => {
    const fetcher = (jest
      .fn()
      .mockResolvedValue(
        jsonResponse({
          code: "Ok",
          durations: [[5400, null]],
          distances: [[69420, null]],
        }),
      ) as jest.MockedFunction<typeof fetch>);

    const result = await calculateLiveRouteEstimates({
      accessToken: "pk.test-token",
      origin: {
        label: "Issaquah, Washington, United States",
        latitude: 47.5301,
        longitude: -122.0326,
      },
      destinations,
      fetcher,
      now: () => new Date("2026-08-20T16:00:00.000Z"),
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(String(fetcher.mock.calls[0][0])).toContain("sources=0");
    expect(result).toEqual({
      originLabel: "Issaquah, Washington, United States",
      calculatedAt: "2026-08-20T16:00:00.000Z",
      routes: [
        {
          destinationId: "point-defiance",
          durationMinutes: 90,
          distanceMeters: 69420,
        },
      ],
    });
  });

  it("rejects a catalog that exceeds one Matrix request", async () => {
    const fetcher = jest.fn() as jest.MockedFunction<typeof fetch>;
    const tooManyDestinations = Array.from({ length: 25 }, (_, index) => ({
      id: `destination-${index}`,
      latitude: 47,
      longitude: -122,
    }));

    await expect(
      calculateLiveRouteEstimates({
        accessToken: "pk.test-token",
        origin: { label: "Seattle", latitude: 47.6062, longitude: -122.3321 },
        destinations: tooManyDestinations,
        fetcher,
      }),
    ).rejects.toEqual(
      new MapboxRouteError("The destination catalog cannot be routed right now.", 500),
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
});

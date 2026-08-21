import {
  calculateLiveRouteAccessEstimates,
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
      .mockResolvedValueOnce(
        jsonResponse({
          code: "Ok",
          durations: [[5400, 7200]],
          distances: [[69420, 81234]],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          code: "Ok",
          durations: [[5100], [6900]],
          distances: [[68000], [80000]],
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

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(String(fetcher.mock.calls[0][0])).toContain("sources=0");
    expect(result).toEqual({
      originLabel: "Issaquah, Washington, United States",
      calculatedAt: "2026-08-20T16:00:00.000Z",
      routes: [
        {
          destinationId: "point-defiance",
          durationMinutes: 90,
          distanceMeters: 69420,
          returnDurationMinutes: 85,
          returnDistanceMeters: 68000,
        },
        {
          destinationId: "bellingham",
          durationMinutes: 120,
          distanceMeters: 81234,
          returnDurationMinutes: 115,
          returnDistanceMeters: 80000,
        },
      ],
    });
  });

  it("calculates the route entry and route-home legs separately", async () => {
    const fetcher = (jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          code: "Ok",
          durations: [[7200, 9600]],
          distances: [[115000, 150000]],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          code: "Ok",
          durations: [[7500], [9900]],
          distances: [[120000], [155000]],
        }),
      ) as jest.MockedFunction<typeof fetch>);

    const result = await calculateLiveRouteAccessEstimates({
      accessToken: "pk.test-token",
      origin: { label: "Issaquah", latitude: 47.5301, longitude: -122.0326 },
      areas: [
        { id: "astoria", latitude: 46.1879, longitude: -123.8313 },
        { id: "cannon-beach", latitude: 45.8918, longitude: -123.9615 },
      ],
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(String(fetcher.mock.calls[0][0])).toContain("sources=0");
    expect(String(fetcher.mock.calls[0][0])).toContain("destinations=1%3B2");
    expect(String(fetcher.mock.calls[1][0])).toContain("sources=1%3B2");
    expect(String(fetcher.mock.calls[1][0])).toContain("destinations=0");
    expect(result).toEqual([
      {
        areaId: "astoria",
        outboundMinutes: 120,
        outboundDistanceMeters: 115000,
        returnMinutes: 125,
        returnDistanceMeters: 120000,
      },
      {
        areaId: "cannon-beach",
        outboundMinutes: 160,
        outboundDistanceMeters: 150000,
        returnMinutes: 165,
        returnDistanceMeters: 155000,
      },
    ]);
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

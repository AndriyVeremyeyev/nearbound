import {
  findOriginSuggestions,
  isResolvedOrigin,
  retrieveOriginSuggestion,
} from "./mapbox-search";

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body,
  } as Response;
}

const sessionToken = "0d0c3559-f1d2-4d1f-9a8a-0d0000000001";

describe("Mapbox starting-point search", () => {
  it("returns concise suggestions biased toward the Cascadia catalog", async () => {
    const fetcher = jest.fn().mockResolvedValue(
      jsonResponse({
        suggestions: [
          {
            mapbox_id: "dXJuOm1ieHBsYzpwbGFjZTphYmMxMjM",
            name: "Seattle",
            place_formatted: "Washington, United States",
          },
        ],
      }),
    ) as jest.MockedFunction<typeof fetch>;

    await expect(
      findOriginSuggestions({
        accessToken: "pk.test-token",
        query: "Sea",
        sessionToken,
        fetcher,
      }),
    ).resolves.toEqual([
      {
        id: "dXJuOm1ieHBsYzpwbGFjZTphYmMxMjM",
        label: "Seattle, Washington, United States",
        context: "Washington, United States",
      },
    ]);

    const requestUrl = String(fetcher.mock.calls[0][0]);
    expect(requestUrl).toContain("searchbox/v1/suggest");
    expect(requestUrl).toContain("q=Sea");
    expect(requestUrl).toContain("country=US%2CCA");
    expect(requestUrl).toContain(`session_token=${sessionToken}`);
  });

  it("retrieves the selected place before it can be used for routing", async () => {
    const fetcher = jest.fn().mockResolvedValue(
      jsonResponse({
        features: [
          {
            properties: {
              full_address: "Seattle, Washington, United States",
              coordinates: { latitude: 47.6062, longitude: -122.3321 },
            },
          },
        ],
      }),
    ) as jest.MockedFunction<typeof fetch>;

    await expect(
      retrieveOriginSuggestion({
        accessToken: "pk.test-token",
        suggestionId: "dXJuOm1ieHBsYzpwbGFjZTphYmMxMjM",
        sessionToken,
        fetcher,
      }),
    ).resolves.toEqual({
      label: "Seattle, Washington, United States",
      latitude: 47.6062,
      longitude: -122.3321,
    });

    expect(String(fetcher.mock.calls[0][0])).toContain("searchbox/v1/retrieve/");
  });

  it("only accepts valid resolved origins from the client", () => {
    expect(
      isResolvedOrigin({
        label: "Seattle, Washington, United States",
        latitude: 47.6062,
        longitude: -122.3321,
      }),
    ).toBe(true);
    expect(isResolvedOrigin({ label: "Seattle", latitude: 200, longitude: 0 })).toBe(false);
  });
});

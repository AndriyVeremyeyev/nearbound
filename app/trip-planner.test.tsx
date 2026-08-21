import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { DestinationCatalog } from "@/lib/trips/types";
import type { RouteCatalog } from "@/lib/catalog/compose-trip";
import { TripPlanner } from "./trip-planner";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock("../lib/auth-client", () => ({
  authClient: {
    signOut: jest.fn(),
  },
}));

const originalFetch = global.fetch;

const catalog: DestinationCatalog = {
  destinations: [
    {
      id: "point-defiance",
      name: "Point Defiance",
      region: "Tacoma, WA",
      hours: 1.2,
      usesFerry: false,
      crossesBorder: false,
      minDays: 1,
      maxDays: 2,
      preferences: ["animals", "ocean", "city"],
      familyFit: 10,
      weatherBackup: 9,
      summary: "A compact family day trip.",
      anchor: "Visit the aquarium.",
      stay: "Make it a day trip.",
      caution: "Arrive early.",
      sourceReferences: [
        {
          title: "Point Defiance Zoo & Aquarium",
          url: "https://www.pdza.org/",
          sourceType: "official",
          lastVerifiedAt: "2026-08-19",
          confidence: "high",
        },
      ],
    },
  ],
  preferenceOptions: [
    { id: "animals", label: "Animals" },
    { id: "ocean", label: "Ocean" },
    { id: "city", label: "City" },
  ],
};

const oregonCoastCatalog: RouteCatalog = {
  id: "oregon-pacific-coast-byway",
  name: "Oregon Pacific Coast",
  areas: [
    { id: "astoria", name: "Astoria", latitude: 46.1879, longitude: -123.8313 },
    { id: "cannon-beach", name: "Cannon Beach", latitude: 45.8918, longitude: -123.9615 },
  ],
  legs: [
    { fromAreaId: "astoria", toAreaId: "cannon-beach", distanceMiles: 27, driveMinutes: 40 },
  ],
  stops: [
    { id: "museum", areaId: "astoria", name: "Maritime Museum", typicalDurationMinutes: 120, childFit: "good", preferences: ["city", "ocean"] },
    { id: "haystack", areaId: "cannon-beach", name: "Haystack Rock", typicalDurationMinutes: 75, childFit: "good", preferences: ["ocean", "animals"] },
  ],
};

function completeWizard() {
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Show my trips" }));
}

beforeEach(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
  window.history.replaceState(null, "", "/");
  jest.restoreAllMocks();
  if (originalFetch) {
    global.fetch = originalFetch;
  } else {
    Reflect.deleteProperty(global, "fetch");
  }
});

describe("Nearbound concept prototype", () => {
  it("renders the planner with a server-provided destination catalog", () => {
    render(<TripPlanner catalog={catalog} initialSearch={window.location.search} />);

    expect(
      screen.getByRole("heading", { name: "Tell us the trip basics" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/account",
    );
    expect(screen.getByLabelText("Starting point")).toHaveValue("Issaquah, WA");
    expect(screen.getByRole("heading", { name: /where should you go this weekend/i })).toBeInTheDocument();

    completeWizard();

    expect(
      screen.getByRole("heading", { name: "Your trip ideas" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/allow ferries/i)).toBeChecked();
    expect(screen.getByLabelText(/allow borders/i)).toBeChecked();
    expect(screen.getByText("Why this fits")).toBeInTheDocument();
    expect(
      screen.getByText(/matches all selected experiences: animals and ocean/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open details for Point Defiance" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /point defiance zoo & aquarium/i }),
    ).toHaveAttribute("href", "https://www.pdza.org/");
    expect(screen.getByText(/set the brief above, then select find my trips/i)).toBeInTheDocument();
  });

  it("shows connected Oregon Coast ideas after live route access is calculated", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        originLabel: "Issaquah, Washington, United States",
        calculatedAt: "2026-08-21T16:00:00.000Z",
        routes: [
          {
            destinationId: "point-defiance",
            durationMinutes: 90,
            distanceMeters: 69420,
            returnDurationMinutes: 95,
            returnDistanceMeters: 70000,
          },
        ],
        routeAccess: [
          {
            areaId: "astoria",
            outboundMinutes: 120,
            outboundDistanceMeters: 160000,
            returnMinutes: 125,
            returnDistanceMeters: 165000,
          },
          {
            areaId: "cannon-beach",
            outboundMinutes: 140,
            outboundDistanceMeters: 180000,
            returnMinutes: 160,
            returnDistanceMeters: 190000,
          },
        ],
      }),
    } as Response);
    global.fetch = fetchMock as typeof fetch;

    render(
      <TripPlanner
        catalog={catalog}
        oregonCoastCatalog={oregonCoastCatalog}
        initialSearch={window.location.search}
      />,
    );

    completeWizard();
    fireEvent.click(screen.getByRole("button", { name: "Find my trips" }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Astoria to Cannon Beach" })).toBeInTheDocument(),
    );
    expect(screen.getByText("2h to Astoria")).toBeInTheDocument();
    expect(screen.getByText("2h 40m home from Cannon Beach")).toBeInTheDocument();
    expect(screen.getAllByText("Possible anchors")).not.toHaveLength(0);
  });

  it("does not show a route idea when the drive home exceeds the selected limit", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        originLabel: "Issaquah, Washington, United States",
        calculatedAt: "2026-08-21T16:00:00.000Z",
        routes: [
          {
            destinationId: "point-defiance",
            durationMinutes: 90,
            distanceMeters: 69420,
            returnDurationMinutes: 95,
            returnDistanceMeters: 70000,
          },
        ],
        routeAccess: [
          {
            areaId: "astoria",
            outboundMinutes: 120,
            outboundDistanceMeters: 160000,
            returnMinutes: 125,
            returnDistanceMeters: 165000,
          },
          {
            areaId: "cannon-beach",
            outboundMinutes: 140,
            outboundDistanceMeters: 180000,
            returnMinutes: 220,
            returnDistanceMeters: 250000,
          },
        ],
      }),
    } as Response);
    global.fetch = fetchMock as typeof fetch;

    render(<TripPlanner catalog={catalog} oregonCoastCatalog={oregonCoastCatalog} />);
    completeWizard();
    fireEvent.click(screen.getByRole("button", { name: "Find my trips" }));

    await waitFor(() =>
      expect(
        screen.getByText(/live drive times from Issaquah, Washington/i),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByRole("heading", { name: "Astoria to Cannon Beach" })).not.toBeInTheDocument();
  });

  it("applies route-logistics changes only after the trip brief is submitted", async () => {
    const ferryCatalog: DestinationCatalog = {
      ...catalog,
      destinations: [
        {
          ...catalog.destinations[0],
          id: "ferry-only",
          name: "Ferry-only destination",
          usesFerry: true,
        },
      ],
    };

    render(<TripPlanner catalog={ferryCatalog} />);
    completeWizard();
    fireEvent.click(screen.getByLabelText(/allow ferries/i));

    expect(screen.getByRole("link", { name: "Open details for Ferry-only destination" })).toBeInTheDocument();
    expect(screen.getByText("Changes are waiting to be applied.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Find my trips" }));

    await waitFor(() => expect(
      screen.getByRole("heading", {
        name: "No trip idea fits every active constraint.",
      }),
    ).toBeInTheDocument());
    expect(screen.getByText(/filtered: 1 ferry route/i)).toBeInTheDocument();
  });

  it("carries wizard answers into the editable workspace", () => {
    render(<TripPlanner catalog={catalog} />);

    fireEvent.change(screen.getByLabelText("Starting point"), {
      target: { value: "Portland, OR" },
    });
    fireEvent.click(screen.getByLabelText("Traveling with children"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Day trip" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "City" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByLabelText(/allow borders/i));
    fireEvent.click(screen.getByRole("button", { name: "Show my trips" }));

    expect(
      screen.getByText(/choose a suggestion to confirm the starting point/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Day trip" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText(/allow borders/i)).not.toBeChecked();
    expect(screen.getByLabelText("Traveling with children")).not.toBeChecked();
    expect(screen.getByRole("button", { name: "City" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit setup" }));
    expect(screen.getByLabelText("Starting point")).toHaveValue("Portland, OR");
  });

  it("supports back, skip, and a full restart", () => {
    render(<TripPlanner catalog={catalog} />);

    fireEvent.change(screen.getByLabelText("Starting point"), {
      target: { value: "Bellingham, WA" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      screen.getByRole("heading", { name: "How much time do you have?" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(
      screen.getByRole("heading", { name: "How much time do you have?" }),
    ).toBeInTheDocument();

    const skipButton = screen.getByRole("button", { name: "Skip for now" });
    expect(skipButton.parentElement).toHaveClass("wizard-heading-bar");
    fireEvent.click(skipButton);
    expect(
      screen.getByRole("heading", { name: "Your trip ideas" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Starting point")).toHaveValue(
      "Bellingham, WA",
    );

    fireEvent.click(screen.getByRole("button", { name: "Start over" }));

    expect(
      screen.getByRole("heading", { name: "Tell us the trip basics" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Starting point")).toHaveValue("Issaquah, WA");
  });

  it("restores a safe shared trip brief without putting the origin in the URL", async () => {
    window.history.replaceState(
      null,
      "",
      "/?days=1&drive=1.5&interests=city&children=0&ferry=0&border=0&visited=0",
    );
    render(<TripPlanner catalog={catalog} initialSearch={window.location.search} />);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Your trip ideas" })).toBeInTheDocument(),
    );

    expect(screen.getByLabelText("Starting point")).toHaveValue("Issaquah, WA");
    expect(screen.getByLabelText("Maximum one-way drive time in hours")).toHaveValue("1.5");
    expect(screen.getByRole("button", { name: "Day trip" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "City" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Traveling with children")).not.toBeChecked();
    expect(screen.getByLabelText(/allow ferries/i)).not.toBeChecked();
    expect(screen.getByLabelText(/allow borders/i)).not.toBeChecked();
    expect(window.location.search).not.toContain("origin");
  });

  it("writes a shareable brief after setup and clears it on restart", async () => {
    render(<TripPlanner catalog={catalog} />);

    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));

    await waitFor(() =>
      expect(new URLSearchParams(window.location.search).get("days")).toBe("2"),
    );
    expect(new URLSearchParams(window.location.search).get("interests")).toBe("animals,ocean");
    expect(window.location.search).not.toContain("Issaquah");

    fireEvent.click(screen.getByRole("button", { name: "Start over" }));

    expect(window.location.search).toBe("");
    expect(screen.getByRole("heading", { name: "Tell us the trip basics" })).toBeInTheDocument();
  });

  it("updates a signed-in user’s visited history without putting it in the shared URL", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true } as Response);
    global.fetch = fetchMock as typeof fetch;
    window.history.replaceState(
      null,
      "",
      "/?days=2&drive=3&interests=animals%2Cocean&children=1&ferry=1&border=1&visited=0",
    );

    render(
      <TripPlanner
        catalog={catalog}
        currentUser={{ id: "user-1", name: "Andriy", email: "andriy@example.com" }}
        initialSearch={window.location.search}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Mark as visited" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/visited-destinations/point-defiance",
        { method: "POST" },
      ),
    );
    expect(screen.getByRole("button", { name: "Visited" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Visited" })).toBeDisabled();
    expect(window.location.search).not.toContain("destination");
  });

  it("uses the live route response after the user submits a trip brief", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        originLabel: "Issaquah, Washington, United States",
        calculatedAt: "2026-08-20T16:00:00.000Z",
        routes: [
          {
            destinationId: "point-defiance",
            durationMinutes: 90,
            distanceMeters: 69420,
            returnDurationMinutes: 95,
            returnDistanceMeters: 70000,
          },
        ],
      }),
    } as Response);
    global.fetch = fetchMock as typeof fetch;

    render(<TripPlanner catalog={catalog} />);
    completeWizard();
    fireEvent.click(screen.getByRole("button", { name: "Find my trips" }));

    await waitFor(() =>
      expect(
        screen.getByText(/live drive times from Issaquah, Washington/i),
      ).toBeInTheDocument(),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/route-estimates",
      expect.objectContaining({ method: "POST" }),
    );
    expect(screen.getByText("1h 30m from your start")).toBeInTheDocument();
  });

  it("does not route an edited starting point until a suggestion is confirmed", () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as typeof fetch;

    render(<TripPlanner catalog={catalog} />);
    completeWizard();
    fireEvent.change(screen.getByLabelText("Starting point"), {
      target: { value: "Seattle" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Find my trips" }));

    expect(
      screen.getByText(/choose a starting point from the suggestions to calculate live routes/i),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("confirms a suggested starting point before it requests live routes", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          suggestions: [
            {
              id: "dXJuOm1ieHBsYzpwbGFjZTphYmMxMjM",
              label: "Seattle, Washington, United States",
              context: "Washington, United States",
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          origin: {
            label: "Seattle, Washington, United States",
            latitude: 47.6062,
            longitude: -122.3321,
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          originLabel: "Seattle, Washington, United States",
          calculatedAt: "2026-08-20T16:00:00.000Z",
          routes: [
            {
              destinationId: "point-defiance",
              durationMinutes: 56,
              distanceMeters: 56100,
              returnDurationMinutes: 60,
              returnDistanceMeters: 60000,
            },
          ],
        }),
      } as Response);
    global.fetch = fetchMock as typeof fetch;

    render(<TripPlanner catalog={catalog} />);
    completeWizard();

    fireEvent.change(screen.getByLabelText("Starting point"), {
      target: { value: "Sea" },
    });
    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: /Seattle, Washington/i }),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("option", { name: /Seattle, Washington/i }));
    await waitFor(() =>
      expect(screen.getByLabelText("Starting point")).toHaveValue(
        "Seattle, Washington, United States",
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Find my trips" }));
    await waitFor(() =>
      expect(screen.getByText(/live drive times from Seattle/i)).toBeInTheDocument(),
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/route-estimates",
      expect.objectContaining({
        body: JSON.stringify({
          origin: {
            label: "Seattle, Washington, United States",
            latitude: 47.6062,
            longitude: -122.3321,
          },
        }),
        method: "POST",
      }),
    );
  });
});

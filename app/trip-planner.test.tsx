import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { DestinationCatalog } from "@/lib/trips/types";
import { TripPlanner } from "./trip-planner";

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
    expect(screen.getByLabelText("Starting point")).toHaveValue("Issaquah, WA");

    completeWizard();

    expect(
      screen.getByRole("heading", { name: "Your best fits" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/allow ferries/i)).toBeChecked();
    expect(screen.getByLabelText(/allow borders/i)).toBeChecked();
    expect(screen.getByText("Why this ranks here")).toBeInTheDocument();
    expect(
      screen.getByText(/matches all selected experiences: animals and ocean/i),
    ).toBeInTheDocument();
    expect(screen.getByText("trip match")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open details for Point Defiance" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /point defiance zoo & aquarium/i }),
    ).toHaveAttribute("href", "https://www.pdza.org/");
    expect(screen.getByText(/ranking updates as you go/i)).toBeInTheDocument();
  });

  it("explains when route logistics remove the available destination", () => {
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

    expect(
      screen.getByRole("heading", {
        name: "No destination fits every active constraint.",
      }),
    ).toBeInTheDocument();
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
      screen.getByRole("heading", { name: "Your best fits" }),
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
      expect(screen.getByRole("heading", { name: "Your best fits" })).toBeInTheDocument(),
    );

    expect(screen.getByLabelText("Starting point")).toHaveValue("Issaquah, WA");
    expect(screen.getByLabelText("Maximum drive time in hours")).toHaveValue("1.5");
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
    expect(screen.getByText("1h 30m drive")).toBeInTheDocument();
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

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { DestinationCatalog } from "@/lib/trips/types";
import { TripPlanner } from "./trip-planner";

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

afterEach(() => {
  window.history.replaceState(null, "", "/");
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
      screen.getByText(/recommendations still use the Issaquah demo dataset/i),
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
});

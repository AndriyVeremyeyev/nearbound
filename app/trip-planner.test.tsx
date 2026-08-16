import { fireEvent, render, screen } from "@testing-library/react";

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
    },
  ],
  preferenceOptions: [
    { id: "animals", label: "Animals" },
    { id: "ocean", label: "Ocean" },
    { id: "city", label: "City" },
  ],
};

describe("Nearbound concept prototype", () => {
  it("renders the planner with a server-provided destination catalog", () => {
    render(<TripPlanner catalog={catalog} />);

    expect(screen.getByLabelText("Starting point")).toHaveValue("Issaquah, WA");
    expect(
      screen.getByRole("heading", { name: "Your best fits" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/allow ferries/i)).toBeChecked();
    expect(screen.getByLabelText(/allow borders/i)).toBeChecked();
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
    fireEvent.click(screen.getByLabelText(/allow ferries/i));

    expect(
      screen.getByRole("heading", {
        name: "No destination fits every active constraint.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/filtered: 1 ferry route/i)).toBeInTheDocument();
  });
});

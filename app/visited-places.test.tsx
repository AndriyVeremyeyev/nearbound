import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { VisitedPlaces } from "./visited-places";

const place = {
  destinationId: "bellingham",
  name: "Bellingham",
  region: "Bellingham, WA",
  summary: "Waterfront, food, and an easy second stop.",
  visitedAt: "2026-08-20T10:00:00.000Z",
  rating: null,
  note: null,
};

describe("Visited places", () => {
  afterEach(() => {
    delete (global as { fetch?: typeof fetch }).fetch;
  });

  it("saves an optional rating and note for a visited place", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rating: 4, note: "Great waterfront." }),
    } as Response);
    Object.assign(global, { fetch: fetchMock });

    render(<VisitedPlaces initialPlaces={[place]} />);

    fireEvent.click(screen.getByRole("radio", { name: "4" }));
    fireEvent.change(screen.getByLabelText("A short note"), { target: { value: "Great waterfront." } });
    fireEvent.click(screen.getByRole("button", { name: "Save reflection" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith("/api/visited-destinations/bellingham", expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ rating: 4, note: "Great waterfront." }),
    }));
    await waitFor(() => expect(screen.getByText("Your reflection")).toBeInTheDocument());
    expect(screen.getByText("4 / 5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit reflection" })).toBeInTheDocument();
  });

  it("removes a place when it was added by mistake", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true } as Response);
    Object.assign(global, { fetch: fetchMock });

    render(<VisitedPlaces initialPlaces={[place]} />);

    fireEvent.click(screen.getByRole("button", { name: "Remove from visited" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/visited-destinations/bellingham", { method: "DELETE" }));
    expect(screen.getByText(/No visited places yet/i)).toBeInTheDocument();
  });
});

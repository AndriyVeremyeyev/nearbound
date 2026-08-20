import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SavedOriginSelector } from "./saved-origin-selector";

describe("Saved origin selector", () => {
  afterEach(() => {
    delete (global as { fetch?: typeof fetch }).fetch;
  });

  it("resolves the selected saved starting point for the active trip", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        origin: { label: "Seattle, Washington, United States", latitude: 47.6062, longitude: -122.3321 },
      }),
    } as Response);
    Object.assign(global, { fetch: fetchMock });
    const onSelect = jest.fn();

    render(<SavedOriginSelector origins={[{
      id: "home",
      label: "Home",
      addressInput: "123 Pine St, Seattle, WA 98101, US",
      streetAddress: "123 Pine St",
      city: "Seattle",
      regionCode: "WA",
      postalCode: "98101",
      countryCode: "US",
    }]} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Home" }));

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith({
      label: "Seattle, Washington, United States",
      latitude: 47.6062,
      longitude: -122.3321,
    }));
    expect(fetchMock).toHaveBeenCalledWith("/api/saved-origins/home/resolve", { method: "POST" });
  });
});

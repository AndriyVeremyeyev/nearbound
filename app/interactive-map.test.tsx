import { render, screen } from "@testing-library/react";

import { InteractiveMap } from "./interactive-map";

describe("InteractiveMap", () => {
  it("shows a clear local setup fallback when no browser token is available", () => {
    render(
      <InteractiveMap
        origin={{ label: "Issaquah, WA", latitude: 47.5301, longitude: -122.0326 }}
        destinations={[]}
        onDestinationSelect={jest.fn()}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Map preview unavailable");
  });
});

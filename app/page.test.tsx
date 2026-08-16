import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Nearbound concept prototype", () => {
  it("renders the planner with its initial Issaquah dataset", () => {
    render(<Home />);

    expect(screen.getByLabelText("Starting point")).toHaveValue("Issaquah, WA");
    expect(screen.getByRole("heading", { name: "Your best fits" })).toBeInTheDocument();
    expect(screen.getByText(/ranking updates as you go/i)).toBeInTheDocument();
  });
});

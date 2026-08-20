import { fireEvent, render, screen } from "@testing-library/react";

import { AccountPanel } from "./account-panel";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock("../lib/auth-client", () => ({
  authClient: {
    signIn: { email: jest.fn() },
    signUp: { email: jest.fn() },
    signOut: jest.fn(),
  },
}));

describe("Nearbound account panel", () => {
  it("keeps account creation optional and switches between auth modes", () => {
    render(<AccountPanel currentUser={null} />);

    expect(
      screen.getByRole("heading", { name: "Keep your travel context." }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Your name")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      screen.getByRole("heading", { name: "Create your Nearbound account." }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Your name")).toBeRequired();
    expect(screen.getByLabelText("Password")).toHaveAttribute("minlength", "8");
  });

  it("shows the signed-in state without exposing private data in a share link", () => {
    render(
      <AccountPanel
        currentUser={{ id: "user-1", name: "Andriy", email: "andriy@example.com" }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Welcome back, Andriy." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /plan a trip/i })).toHaveAttribute(
      "href",
      "/",
    );
  });
});

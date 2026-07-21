import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import * as authModule from "@/context/auth";
import { ApiError } from "@/lib/api";
import { LoginPage } from "@/pages/LoginPage";

vi.mock("@/context/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof authModule>();
  return { ...actual, useAuth: vi.fn() };
});

const mockedUseAuth = vi.mocked(authModule.useAuth);

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/books" element={<div>Books page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  it("redirects to /books if already logged in", () => {
    mockedUseAuth.mockReturnValue({
      user: { id: "1", name: "Ada", email: "ada@example.com", role: "USER" },
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderLoginPage();
    expect(screen.getByText("Books page")).toBeInTheDocument();
  });

  it("submits the typed credentials and navigates on success", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({ user: null, loading: false, login, register: vi.fn(), logout: vi.fn() });

    renderLoginPage();
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(login).toHaveBeenCalledWith("ada@example.com", "password123");
    expect(await screen.findByText("Books page")).toBeInTheDocument();
  });

  it("shows the API error message on a failed login", async () => {
    const login = vi.fn().mockRejectedValue(new ApiError(401, "Invalid credentials"));
    mockedUseAuth.mockReturnValue({ user: null, loading: false, login, register: vi.fn(), logout: vi.fn() });

    renderLoginPage();
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    // Still on the login page — no redirect happened.
    expect(screen.queryByText("Books page")).not.toBeInTheDocument();
  });
});

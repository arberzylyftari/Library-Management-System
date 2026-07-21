import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "@/components/protected-route";
import * as authModule from "@/context/auth";

vi.mock("@/context/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof authModule>();
  return { ...actual, useAuth: vi.fn() };
});

const mockedUseAuth = vi.mocked(authModule.useAuth);

function renderAt(path: string, adminOnly = false) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/books" element={<div>Books page</div>} />
        <Route element={<ProtectedRoute adminOnly={adminOnly} />}>
          <Route path="/protected" element={<div>Protected content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("shows a spinner while auth is loading", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    const { container } = renderAt("/protected");
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("redirects to /login when unauthenticated", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAt("/protected");
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("redirects a non-admin away from an admin-only route", () => {
    mockedUseAuth.mockReturnValue({
      user: { id: "1", name: "Regular", email: "u@example.com", role: "USER" },
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAt("/protected", true);
    expect(screen.getByText("Books page")).toBeInTheDocument();
  });

  it("renders the nested route for an authorized user", () => {
    mockedUseAuth.mockReturnValue({
      user: { id: "1", name: "Regular", email: "u@example.com", role: "USER" },
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAt("/protected");
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("lets an admin through an admin-only route", () => {
    mockedUseAuth.mockReturnValue({
      user: { id: "1", name: "Admin", email: "admin@example.com", role: "ADMIN" },
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAt("/protected", true);
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/context/auth";
import * as apiModule from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof apiModule>();
  return { ...actual, api: vi.fn() };
});

const mockedApi = vi.mocked(apiModule.api);

function Probe() {
  const { user, loading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.email : "none"}</span>
      <button onClick={() => void login("ada@example.com", "password123")}>Log in</button>
      <button onClick={logout}>Log out</button>
    </div>
  );
}

beforeEach(() => {
  mockedApi.mockReset();
  localStorage.clear();
});

describe("AuthProvider", () => {
  it("resolves with no user when there is no stored token", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(mockedApi).not.toHaveBeenCalled();
  });

  it("resolves the current user via /auth/me when a token is already stored", async () => {
    localStorage.setItem("library-token", "existing-token");
    mockedApi.mockResolvedValueOnce({
      user: { id: "1", name: "Ada", email: "ada@example.com", role: "USER" },
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("ada@example.com"));
    expect(mockedApi).toHaveBeenCalledWith("/auth/me");
  });

  it("drops a stale token if /auth/me fails", async () => {
    localStorage.setItem("library-token", "stale-token");
    mockedApi.mockRejectedValueOnce(new Error("unauthorized"));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(localStorage.getItem("library-token")).toBeNull();
  });

  it("login stores the token and sets the user", async () => {
    mockedApi.mockResolvedValueOnce({
      token: "new-token",
      user: { id: "1", name: "Ada", email: "ada@example.com", role: "USER" },
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    await act(() => userEvent.click(screen.getByText("Log in")));

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("ada@example.com"));
    expect(localStorage.getItem("library-token")).toBe("new-token");
  });

  it("logout clears the token and user", async () => {
    localStorage.setItem("library-token", "existing-token");
    mockedApi.mockResolvedValueOnce({
      user: { id: "1", name: "Ada", email: "ada@example.com", role: "USER" },
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("ada@example.com"));

    await act(() => userEvent.click(screen.getByText("Log out")));

    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(localStorage.getItem("library-token")).toBeNull();
  });
});

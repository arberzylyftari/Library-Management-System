import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QueryResultView } from "@/components/query-result-view";
import type { AiToolResult } from "@/lib/types";

describe("QueryResultView", () => {
  it("renders an array of objects as a table, hiding noisy keys", () => {
    const result: AiToolResult = {
      tool: "list_books",
      data: [
        { id: "1", title: "Dune", author: "Frank Herbert", status: "READING", createdAt: "x" },
      ],
    };
    render(<QueryResultView result={result} />);

    expect(screen.getByRole("columnheader", { name: "Title" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Author" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Id" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Created At" })).not.toBeInTheDocument();
    expect(screen.getByText("Dune")).toBeInTheDocument();
    // Status is humanized via statusLabel, not shown raw.
    expect(screen.getByText("Reading")).toBeInTheDocument();
  });

  it("shows a friendly message for an empty array", () => {
    render(<QueryResultView result={{ tool: "list_books", data: [] }} />);
    expect(screen.getByText("No matching results.")).toBeInTheDocument();
  });

  it("renders a plain object as stat tiles", () => {
    render(
      <QueryResultView
        result={{ tool: "library_summary", data: { totalBooks: 5, distinctAuthors: 3 } }}
      />,
    );
    expect(screen.getByText("Total Books")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Distinct Authors")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders nested arrays-of-objects as sub-tables alongside stat tiles", () => {
    render(
      <QueryResultView
        result={{
          tool: "library_summary",
          data: {
            totalBooks: 2,
            byStatus: [{ status: "READING", count: 1 }, { status: "COMPLETED", count: 1 }],
          },
        }}
      />,
    );
    expect(screen.getByText("Total Books")).toBeInTheDocument();
    expect(screen.getByText("By Status")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Count" })).toBeInTheDocument();
  });

  it("joins an array of primitives into a sentence", () => {
    render(<QueryResultView result={{ tool: "x", data: ["Fantasy", "Sci-Fi"] }} />);
    expect(screen.getByText("Fantasy, Sci-Fi")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BooksTable } from "@/components/books-table";
import type { Book } from "@/lib/types";

const book: Book = {
  id: "1",
  title: "Dune",
  author: "Frank Herbert",
  genre: "Sci-Fi",
  status: "READING",
  price: "12.99",
  createdAt: "2024-01-01",
};

describe("BooksTable", () => {
  it("renders book rows with status label and formatted price", () => {
    render(<BooksTable books={[book]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Dune")).toBeInTheDocument();
    expect(screen.getByText("Frank Herbert")).toBeInTheDocument();
    expect(screen.getByText("Reading")).toBeInTheDocument();
    expect(screen.getByText("$12.99")).toBeInTheDocument();
  });

  it("shows an Owner column when showOwner is set", () => {
    const owned = { ...book, user: { id: "u1", name: "Ada", email: "ada@example.com" } };
    render(<BooksTable books={[owned]} showOwner onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole("columnheader", { name: "Owner" })).toBeInTheDocument();
    expect(screen.getByText("Ada")).toBeInTheDocument();
  });

  it("omits the actions column entirely when no edit/delete handlers are given", () => {
    render(<BooksTable books={[book]} />);
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onEdit when the Edit action is chosen", async () => {
    const onEdit = vi.fn();
    render(<BooksTable books={[book]} onEdit={onEdit} onDelete={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await userEvent.click(await screen.findByText("Edit"));

    expect(onEdit).toHaveBeenCalledWith(book);
  });

  it("calls onDelete when the Delete action is chosen", async () => {
    const onDelete = vi.fn();
    render(<BooksTable books={[book]} onEdit={vi.fn()} onDelete={onDelete} />);

    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await userEvent.click(await screen.findByText("Delete"));

    expect(onDelete).toHaveBeenCalledWith(book);
  });
});

import { BookMarked, Loader2, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BookFormDialog } from "@/components/book-form-dialog";
import { BooksTable } from "@/components/books-table";
import { DeleteBookDialog } from "@/components/delete-book-dialog";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import { STATUS_OPTIONS } from "@/lib/book-display";
import { listBooks } from "@/lib/books";
import type { Book, ReadingStatus } from "@/lib/types";

const ALL_STATUSES = "ALL";

export function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReadingStatus | typeof ALL_STATUSES>(ALL_STATUSES);

  const [formOpen, setFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);

  // Debounce the search box so we're not firing a request per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listBooks({
      status: status === ALL_STATUSES ? undefined : status,
      search: debouncedSearch || undefined,
    })
      .then((data) => {
        if (!cancelled) setBooks(data);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err instanceof ApiError ? err.message : "Failed to load books");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, debouncedSearch]);

  const hasFilters = search.trim() !== "" || status !== ALL_STATUSES;

  const openAddDialog = () => {
    setEditingBook(null);
    setFormOpen(true);
  };

  const openEditDialog = (book: Book) => {
    setEditingBook(book);
    setFormOpen(true);
  };

  const handleSaved = (book: Book) => {
    setBooks((prev) => {
      const exists = prev.some((b) => b.id === book.id);
      if (exists) return prev.map((b) => (b.id === book.id ? book : b));
      return [book, ...prev];
    });
  };

  const handleDeleted = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setDeletingBook(null);
  };

  const emptyMessage = useMemo(() => {
    if (hasFilters) return "No books match your filters.";
    return "Your library is empty — add your first book to get started.";
  }, [hasFilters]);

  return (
    <>
      <PageHeader
        title="My Books"
        description="Your personal library."
        action={
          <Button onClick={openAddDialog}>
            <Plus /> Add book
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search title or author…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as ReadingStatus | typeof ALL_STATUSES)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-lg border p-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-16 text-center">
          <BookMarked className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          {!hasFilters && (
            <Button variant="outline" size="sm" onClick={openAddDialog}>
              <Plus /> Add your first book
            </Button>
          )}
        </div>
      ) : (
        <BooksTable books={books} onEdit={openEditDialog} onDelete={setDeletingBook} />
      )}

      <BookFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        book={editingBook}
        onSaved={handleSaved}
      />
      <DeleteBookDialog
        book={deletingBook}
        onOpenChange={(open) => !open && setDeletingBook(null)}
        onDeleted={handleDeleted}
      />
    </>
  );
}

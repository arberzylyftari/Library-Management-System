import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_OPTIONS } from "@/lib/book-display";
import { createBook, updateBook } from "@/lib/books";
import { ApiError } from "@/lib/api";
import type { Book, ReadingStatus } from "@/lib/types";

interface BookFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book?: Book | null;
  onSaved: (book: Book) => void;
}

const emptyForm = {
  title: "",
  author: "",
  genre: "",
  status: "WANT_TO_READ" as ReadingStatus,
  price: "",
};

export function BookFormDialog({ open, onOpenChange, book, onSaved }: BookFormDialogProps) {
  const isEdit = Boolean(book);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  // Reset the form whenever the dialog opens (either blank, or pre-filled for edit).
  useEffect(() => {
    if (!open) return;
    setFieldErrors({});
    setForm(
      book
        ? {
            title: book.title,
            author: book.author,
            genre: book.genre,
            status: book.status,
            price: book.price ?? "",
          }
        : emptyForm,
    );
  }, [open, book]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitting(true);
    try {
      const priceValue = form.price.trim() === "" ? null : Number(form.price);
      // The backend's create schema only accepts a number or an omitted key
      // for price (not null); update accepts null to explicitly clear it.
      const saved = isEdit
        ? await updateBook(book!.id, {
            title: form.title,
            author: form.author,
            genre: form.genre,
            status: form.status,
            price: priceValue,
          })
        : await createBook({
            title: form.title,
            author: form.author,
            genre: form.genre,
            status: form.status,
            ...(priceValue !== null ? { price: priceValue } : {}),
          });
      toast.success(isEdit ? "Book updated" : "Book added");
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.details && typeof err.details === "object") {
        setFieldErrors(err.details as Record<string, string[]>);
      } else if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit book" : "Add a book"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Update the details for this book." : "Add a book to your library."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                aria-invalid={Boolean(fieldErrors.title)}
              />
              {fieldErrors.title && (
                <p className="text-sm text-destructive">{fieldErrors.title[0]}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                required
                value={form.author}
                onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                aria-invalid={Boolean(fieldErrors.author)}
              />
              {fieldErrors.author && (
                <p className="text-sm text-destructive">{fieldErrors.author[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  required
                  value={form.genre}
                  onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
                  aria-invalid={Boolean(fieldErrors.genre)}
                />
                {fieldErrors.genre && (
                  <p className="text-sm text-destructive">{fieldErrors.genre[0]}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="price">Price (optional)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  aria-invalid={Boolean(fieldErrors.price)}
                />
                {fieldErrors.price && (
                  <p className="text-sm text-destructive">{fieldErrors.price[0]}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, status: value as ReadingStatus }))
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Add book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

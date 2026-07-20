import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApiError } from "@/lib/api";
import { deleteBook } from "@/lib/books";
import type { Book } from "@/lib/types";

interface DeleteBookDialogProps {
  book: Book | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (id: string) => void;
}

export function DeleteBookDialog({ book, onOpenChange, onDeleted }: DeleteBookDialogProps) {
  const onConfirm = async () => {
    if (!book) return;
    try {
      await deleteBook(book.id);
      toast.success(`"${book.title}" deleted`);
      onDeleted(book.id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete book");
    }
  };

  return (
    <AlertDialog open={Boolean(book)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{book?.title}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This can't be undone. This will permanently remove the book from your library.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

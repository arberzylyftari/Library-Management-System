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
import { deleteAdminUser } from "@/lib/admin";
import type { AdminUser } from "@/lib/types";

interface DeleteUserDialogProps {
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (id: string) => void;
}

export function DeleteUserDialog({ user, onOpenChange, onDeleted }: DeleteUserDialogProps) {
  const onConfirm = async () => {
    if (!user) return;
    try {
      await deleteAdminUser(user.id);
      toast.success(`"${user.name}" deleted`);
      onDeleted(user.id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete user");
    }
  };

  return (
    <AlertDialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{user?.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This can't be undone. This will permanently remove the user and all of their
            books.
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

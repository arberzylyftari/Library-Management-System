import { Loader2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BooksTable } from "@/components/books-table";
import { DeleteUserDialog } from "@/components/delete-user-dialog";
import { EditUserDialog } from "@/components/edit-user-dialog";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersTable } from "@/components/users-table";
import { useAuth } from "@/context/auth";
import { listAdminBooks, listAdminUsers } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import type { AdminUser, Book } from "@/lib/types";

export function AdminPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);

  useEffect(() => {
    listAdminUsers()
      .then(setUsers)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to load users"))
      .finally(() => setUsersLoading(false));

    listAdminBooks()
      .then(setBooks)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to load books"))
      .finally(() => setBooksLoading(false));
  }, []);

  const handleUserSaved = (saved: Omit<AdminUser, "bookCount">) => {
    setUsers((prev) => prev.map((u) => (u.id === saved.id ? { ...u, ...saved } : u)));
  };

  const handleUserDeleted = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    // Deleting a user cascades to their books on the backend — drop them here too.
    setBooks((prev) => prev.filter((b) => b.user?.id !== id));
    setDeletingUser(null);
  };

  if (!currentUser) return null;

  return (
    <>
      <PageHeader title="Admin" description="Manage all users and books." />

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="books">Books</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          {usersLoading ? (
            <div className="flex items-center justify-center rounded-lg border p-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-16 text-center">
              <Users className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No users yet.</p>
            </div>
          ) : (
            <UsersTable
              users={users}
              currentUserId={currentUser.id}
              onEdit={setEditingUser}
              onDelete={setDeletingUser}
            />
          )}
        </TabsContent>

        <TabsContent value="books">
          {booksLoading ? (
            <div className="flex items-center justify-center rounded-lg border p-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : books.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-16 text-center">
              <p className="text-sm text-muted-foreground">No books yet.</p>
            </div>
          ) : (
            <BooksTable books={books} showOwner />
          )}
        </TabsContent>
      </Tabs>

      <EditUserDialog
        user={editingUser}
        currentUserId={currentUser.id}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onSaved={handleUserSaved}
      />
      <DeleteUserDialog
        user={deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        onDeleted={handleUserDeleted}
      />
    </>
  );
}

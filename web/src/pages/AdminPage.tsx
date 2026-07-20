import { PageHeader } from "@/components/page-header";

export function AdminPage() {
  return (
    <>
      <PageHeader
        title="Admin"
        description="Manage all users and books."
      />
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Admin user and book management is coming in a later step.
      </div>
    </>
  );
}

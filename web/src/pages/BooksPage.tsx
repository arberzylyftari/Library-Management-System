import { PageHeader } from "@/components/page-header";

export function BooksPage() {
  return (
    <>
      <PageHeader title="My Books" description="Your personal library." />
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Book list and add/edit/delete are coming in the next step.
      </div>
    </>
  );
}

import { PageHeader } from "@/components/page-header";

export function AskPage() {
  return (
    <>
      <PageHeader
        title="Ask AI"
        description="Ask natural-language questions about your library."
      />
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        The AI query panel is coming in a later step.
      </div>
    </>
  );
}

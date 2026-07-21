import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { AnswerMarkdown } from "@/components/answer-markdown";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { getRecommendations } from "@/lib/ai";

export function RecommendationsPage() {
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The tool result behind this is just grounding data (the user's own
  // library profile) that the model already folds into its written answer —
  // unlike Ask AI, there's no separate "raw rows" table worth surfacing here.
  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRecommendations();
      setAnswer(res.answer);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRecommendations();
  }, []);

  return (
    <>
      <PageHeader
        title="Recommendations"
        description="Suggested reading based on your library."
        action={
          <Button variant="outline" onClick={() => void fetchRecommendations()} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Refresh
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center rounded-lg border p-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-destructive">
          {error}
        </div>
      ) : (
        <div className="rounded-lg border p-4">
          {answer && (
            <div className="flex gap-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <AnswerMarkdown>{answer}</AnswerMarkdown>
            </div>
          )}
        </div>
      )}
    </>
  );
}

import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { AnswerMarkdown } from "@/components/answer-markdown";
import { PageHeader } from "@/components/page-header";
import { QueryResultView } from "@/components/query-result-view";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { getInsights } from "@/lib/ai";
import type { AiToolResult } from "@/lib/types";

export function InsightsPage() {
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<AiToolResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getInsights();
      setAnswer(res.answer);
      setResults(res.results);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInsights();
  }, []);

  return (
    <>
      <PageHeader
        title="Library Insights"
        description="A snapshot of your reading habits."
        action={
          <Button variant="outline" onClick={() => void fetchInsights()} disabled={loading}>
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
        <div className="flex flex-col gap-4">
          {answer && (
            <div className="flex gap-2 rounded-lg border p-4">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <AnswerMarkdown>{answer}</AnswerMarkdown>
            </div>
          )}
          {results.map((result, i) => (
            <QueryResultView key={i} result={result} />
          ))}
        </div>
      )}
    </>
  );
}

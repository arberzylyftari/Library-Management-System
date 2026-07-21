import { Loader2, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { AnswerMarkdown } from "@/components/answer-markdown";
import { PageHeader } from "@/components/page-header";
import { QueryResultView } from "@/components/query-result-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { askLibrary } from "@/lib/ai";
import type { AiToolResult } from "@/lib/types";

interface Exchange {
  id: number;
  question: string;
  status: "loading" | "done" | "error";
  answer?: string;
  results?: AiToolResult[];
  error?: string;
}

const SUGGESTIONS = [
  "Who owns the most books?",
  "Which is the most popular book?",
  "Show the five most expensive books.",
  "Summarize my reading habits.",
];

export function AskPage() {
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [busy, setBusy] = useState(false);

  const ask = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || busy) return;
    const id = Date.now();
    setExchanges((prev) => [{ id, question: trimmed, status: "loading" }, ...prev]);
    setQuestion("");
    setBusy(true);
    try {
      const res = await askLibrary(trimmed);
      setExchanges((prev) =>
        prev.map((ex) =>
          ex.id === id
            ? { ...ex, status: "done", answer: res.answer, results: res.results }
            : ex,
        ),
      );
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong";
      setExchanges((prev) =>
        prev.map((ex) => (ex.id === id ? { ...ex, status: "error", error: message } : ex)),
      );
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void ask(question);
  };

  return (
    <>
      <PageHeader
        title="Ask AI"
        description="Ask natural-language questions about your library."
      />

      <form onSubmit={onSubmit} className="mb-4 flex gap-2">
        <Input
          placeholder="e.g. Which is the most popular book?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={busy}
        />
        <Button type="submit" disabled={busy || question.trim() === ""}>
          {busy ? <Loader2 className="animate-spin" /> : <Send />}
          Ask
        </Button>
      </form>

      {exchanges.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              onClick={() => void ask(s)}
              disabled={busy}
            >
              {s}
            </Button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {exchanges.map((ex) => (
          <div
            key={ex.id}
            className="flex flex-col gap-3 rounded-lg border p-4 duration-200 animate-in fade-in slide-in-from-top-2"
          >
            <p className="text-sm font-medium">{ex.question}</p>

            {ex.status === "loading" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Thinking…
              </div>
            )}

            {ex.status === "error" && (
              <p className="text-sm text-destructive">{ex.error}</p>
            )}

            {ex.status === "done" && (
              <div className="flex flex-col gap-4">
                {ex.answer && (
                  <div className="flex gap-2">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <AnswerMarkdown>{ex.answer}</AnswerMarkdown>
                  </div>
                )}
                {ex.results?.map((result, i) => (
                  <QueryResultView key={i} result={result} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

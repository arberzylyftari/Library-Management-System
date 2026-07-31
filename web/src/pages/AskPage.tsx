import { Loader2, MessageSquarePlus, Send, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AnswerMarkdown } from "@/components/answer-markdown";
import { PageHeader } from "@/components/page-header";
import { QueryResultView } from "@/components/query-result-view";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askLibrary } from "@/lib/ai";
import { ApiError } from "@/lib/api";
import { deleteConversation, getConversation, listConversations } from "@/lib/conversations";
import type { AiToolResult, ConversationSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Exchange {
  id: string;
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refreshConversations = () => {
    listConversations()
      .then(setConversations)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to load chats"))
      .finally(() => setConversationsLoading(false));
  };

  useEffect(() => {
    refreshConversations();
  }, []);

  const ask = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || busy) return;
    const id = crypto.randomUUID();
    const askingInConversation = activeId;
    setExchanges((prev) => [{ id, question: trimmed, status: "loading" }, ...prev]);
    setQuestion("");
    setBusy(true);
    try {
      const res = await askLibrary(trimmed, askingInConversation ?? undefined);
      setExchanges((prev) =>
        prev.map((ex) =>
          ex.id === id
            ? { ...ex, status: "done", answer: res.answer, results: res.results }
            : ex,
        ),
      );
      setActiveId(res.conversationId);
      if (!askingInConversation) {
        // A brand new conversation was created server-side — refetch the list
        // so it shows up with its auto-generated title.
        refreshConversations();
      } else {
        // Bump the conversation to the top of the list, like a real chat app.
        setConversations((prev) => {
          const current = prev.find((c) => c.id === res.conversationId);
          if (!current) return prev;
          const rest = prev.filter((c) => c.id !== res.conversationId);
          return [{ ...current, updatedAt: new Date().toISOString() }, ...rest];
        });
      }
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

  const startNewChat = () => {
    if (busy) return;
    setActiveId(null);
    setExchanges([]);
    setQuestion("");
  };

  const openConversation = async (id: string) => {
    if (busy || id === activeId) return;
    setLoadingConversation(true);
    try {
      const conversation = await getConversation(id);
      const loaded: Exchange[] = [];
      // Messages come back oldest-first, alternating USER then ASSISTANT.
      for (let i = 0; i < conversation.messages.length; i += 2) {
        const userMsg = conversation.messages[i];
        const assistantMsg = conversation.messages[i + 1];
        loaded.push({
          id: userMsg.id,
          question: userMsg.content,
          status: "done",
          answer: assistantMsg?.content,
          results: assistantMsg?.results ?? [],
        });
      }
      loaded.reverse();
      setExchanges(loaded);
      setActiveId(id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load that chat");
    } finally {
      setLoadingConversation(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    const id = deletingId;
    setDeletingId(null);
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (id === activeId) startNewChat();
      toast.success("Chat deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete chat");
    }
  };

  return (
    <>
      <PageHeader
        title="Ask AI"
        description="Ask natural-language questions about your library."
      />

      <div className="flex gap-6">
        <aside className="hidden w-56 shrink-0 flex-col md:flex">
          <Button
            variant="outline"
            size="sm"
            className="mb-3 justify-start"
            onClick={startNewChat}
            disabled={busy}
          >
            <MessageSquarePlus /> New chat
          </Button>

          {conversationsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-2 py-4 text-xs text-muted-foreground">No past chats yet.</p>
          ) : (
            <div className="flex flex-col gap-0.5 overflow-y-auto">
              {conversations.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "group flex items-center gap-1 rounded-md pr-1 pl-2 text-sm",
                    c.id === activeId
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => void openConversation(c.id)}
                    disabled={busy}
                    className="min-w-0 flex-1 truncate py-1.5 text-left disabled:cursor-not-allowed"
                    title={c.title}
                  >
                    {c.title}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0 opacity-0 group-hover:opacity-100"
                    onClick={() => setDeletingId(c.id)}
                  >
                    <Trash2 className="size-3.5" />
                    <span className="sr-only">Delete chat</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </aside>

        <div className="min-w-0 flex-1">
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

          {exchanges.length === 0 && !loadingConversation && (
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

          {loadingConversation ? (
            <div className="flex items-center justify-center rounded-lg border p-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
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

                  {ex.status === "error" && <p className="text-sm text-destructive">{ex.error}</p>}

                  {ex.status === "done" && (
                    <div className="flex flex-col gap-4">
                      {ex.answer && (
                        <div className="flex gap-2">
                          <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <AnswerMarkdown>{ex.answer}</AnswerMarkdown>
                        </div>
                      )}
                      {ex.results?.map((result, i) => <QueryResultView key={i} result={result} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. The conversation and its messages will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void confirmDelete()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

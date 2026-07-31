import { createContext, useContext, useEffect, useState } from "react";
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
import { askLibrary } from "@/lib/ai";
import { ApiError } from "@/lib/api";
import { deleteConversation, getConversation, listConversations } from "@/lib/conversations";
import type { AiToolResult, ConversationSummary } from "@/lib/types";

export interface Exchange {
  id: string;
  question: string;
  status: "loading" | "done" | "error";
  answer?: string;
  results?: AiToolResult[];
  error?: string;
}

interface AskChatContextValue {
  conversations: ConversationSummary[];
  conversationsLoading: boolean;
  activeId: string | null;
  exchanges: Exchange[];
  busy: boolean;
  loadingConversation: boolean;
  ask: (question: string) => Promise<void>;
  startNewChat: () => void;
  openConversation: (id: string) => Promise<void>;
  requestDelete: (id: string) => void;
}

const AskChatContext = createContext<AskChatContextValue | undefined>(undefined);

// Owns all Ask AI chat state (the conversation list, the active thread, and
// its exchanges) above the routed pages, so both the sidebar (which renders
// the chat list/new-chat/delete UI) and AskPage (which renders the prompt
// box and exchange cards) share one source of truth. Mounted once at the
// authenticated app shell (AppLayout), so it survives navigating away from
// and back to Ask AI without losing the in-progress thread.
export function AskChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
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

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || busy) return;
    const id = crypto.randomUUID();
    const askingInConversation = activeId;
    setExchanges((prev) => [{ id, question: trimmed, status: "loading" }, ...prev]);
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

  const startNewChat = () => {
    if (busy) return;
    setActiveId(null);
    setExchanges([]);
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

  const requestDelete = (id: string) => setDeletingId(id);

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
    <AskChatContext.Provider
      value={{
        conversations,
        conversationsLoading,
        activeId,
        exchanges,
        busy,
        loadingConversation,
        ask,
        startNewChat,
        openConversation,
        requestDelete,
      }}
    >
      {children}
      <DeleteConversationDialog
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onConfirm={() => void confirmDelete()}
      />
    </AskChatContext.Provider>
  );
}

export function useAskChat() {
  const ctx = useContext(AskChatContext);
  if (!ctx) throw new Error("useAskChat must be used within an AskChatProvider");
  return ctx;
}

// Kept local to this file rather than a new component file — it's a single
// small dialog with no reuse outside this provider.
function DeleteConversationDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
            onClick={onConfirm}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

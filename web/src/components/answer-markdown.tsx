import Markdown from "react-markdown";

// Renders the AI agent's markdown answer with styling that matches the app
// (no typography plugin needed — element overrides do the work).
export function AnswerMarkdown({ children }: { children: string }) {
  return (
    <div className="text-sm leading-relaxed">
      <Markdown
        components={{
          p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-foreground" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0" {...props} />
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}

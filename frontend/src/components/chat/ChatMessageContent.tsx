"use client";

import React from "react";
import ReactMarkdown from "react-markdown";

interface ChatMessageContentProps {
  content: string;
  role: "user" | "assistant";
}

export function ChatMessageContent({ content, role }: ChatMessageContentProps) {
  if (role === "user") {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none space-y-2 text-sm leading-relaxed">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-foreground mt-3 mb-1">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-foreground mt-3 mb-1">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold text-foreground mt-2 mb-1">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-foreground mt-2 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-normal">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>,
          li: ({ children }) => <li className="leading-snug">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-background/80 border border-border text-xs font-mono text-primary font-medium">
              {children}
            </code>
          ),
          hr: () => <hr className="my-3 border-border" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

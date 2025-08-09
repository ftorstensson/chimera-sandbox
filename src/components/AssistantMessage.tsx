// src/components/AssistantMessage.tsx
// VERIFIED-STABLE-V2
// v4.0 - Implements the Tailwind CSS Typography plugin for professional, global styling

"use client";

import React from "react";
import ReactMarkdown from "react-markdown";

interface AssistantMessageProps {
  children: React.ReactNode;
}

const AssistantMessage: React.FC<AssistantMessageProps> = React.memo(({ children }) => {
  const messageContent = typeof children === 'string' ? children : String(children);

  return (
    <div className="flex justify-start">
      {/* --- THIS IS THE DEFINITIVE FIX --- */}
      {/* We apply the `prose` class from our new typography plugin. */}
      {/* This single class will automatically style all markdown elements (headings, lists, bold, etc.) */}
      {/* with beautiful, consistent, and well-spaced typography. */}
      {/* It creates the "air" and professional hierarchy we need. */}
      <div className="prose dark:prose-invert max-w-none text-foreground/90">
        <ReactMarkdown>
          {messageContent}
        </ReactMarkdown>
      </div>
      {/* --- End of Fix --- */}
    </div>
  );
});

AssistantMessage.displayName = 'AssistantMessage';

export default AssistantMessage;
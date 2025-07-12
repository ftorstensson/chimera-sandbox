// src/components/AssistantMessage.tsx
// FINAL SIMPLIFIED VERSION

import React from 'react';

// Helper function to clean markdown-style bolding
const cleanText = (text: string) => {
  return text.replace(/\*\*(.*?)\*\*/g, '$1');
};

interface AssistantMessageProps {
  children: React.ReactNode;
}

export default function AssistantMessage({ children }: AssistantMessageProps) {
  // This component is now ONLY responsible for rendering the chat bubble
  // and the text content passed to it. It no longer knows about project documents.
  const content = typeof children === 'string' ? cleanText(children) : children;

  return (
    <div className="flex justify-start">
      <div className="bg-white text-gray-800 p-4 rounded-2xl rounded-bl-none shadow-sm whitespace-pre-wrap" style={{ maxWidth: '800px', width: '100%' }}>
        {content}
      </div>
    </div>
  );
}
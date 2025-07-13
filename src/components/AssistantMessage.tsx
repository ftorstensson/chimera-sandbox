// src/components/AssistantMessage.tsx
import React from 'react';

interface AssistantMessageProps {
  children: React.ReactNode;
}

export default function AssistantMessage({ children }: AssistantMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="bg-white text-gray-800 p-4 rounded-2xl rounded-bl-none shadow-sm whitespace-pre-wrap" style={{ maxWidth: '800px', width: '100%' }}>
        {children}
      </div>
    </div>
  );
}
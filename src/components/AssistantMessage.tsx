// src/components/AssistantMessage.tsx - CORRECTED
import React from 'react';

export default function AssistantMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-start">
      <div className="bg-white text-gray-800 p-4 rounded-2xl rounded-bl-none shadow-sm" style={{ maxWidth: '800px', width: '100%' }}>
        {children}
      </div>
    </div>
  );
}
// src/components/AgentOutputCard.tsx - CORRECTED
import React from 'react';

export default function AgentOutputCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="font-semibold text-gray-900 whitespace-pre-wrap">{title}</p>
      {children}
    </div>
  );
}
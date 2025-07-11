// src/components/ListRenderer.tsx
import React from 'react';

export function ListRenderer({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="font-semibold text-gray-800">{title}</h4>
      <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-gray-600">
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </div>
  );
}
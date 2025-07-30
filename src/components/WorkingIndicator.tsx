// src/app/_sandbox/WorkingIndicator.tsx
// v1.1 - Refined animation with a brighter green for more contrast

"use client";

import React from 'react';

interface WorkingIndicatorProps {
  message: string;
}

export const WorkingIndicator: React.FC<WorkingIndicatorProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-100 dark:bg-gray-900 rounded-lg">
      <div className="flex space-x-2">
        {/* The green is now lighter for a more obvious pulse animation */}
        <span className="h-4 w-4 bg-green-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
        <span className="h-4 w-4 bg-green-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
        <span className="h-4 w-4 bg-green-400 rounded-full animate-pulse"></span>
      </div>
      <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-md text-center">
        {message}
      </p>
    </div>
  );
};
// src/components/WorkingIndicator.tsx
// VERIFIED-STABLE-V2
// v2.0 - STABILIZED: Made the 'message' prop optional to allow for generic loading states.

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

// The 'message' prop is now optional (message?: string)
interface WorkingIndicatorProps {
  message?: string;
}

export const WorkingIndicator: React.FC<WorkingIndicatorProps> = ({ message }) => {
  return (
    <div className="flex justify-center items-center p-4">
      <Card className="bg-gray-100 dark:bg-zinc-800 p-2 rounded-lg max-w-xs animate-pulse">
        <CardContent className="p-2">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <span className="h-2 w-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="h-2 w-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="h-2 w-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"></span>
            </div>
            {/* We only display a message if one is provided */}
            {message && <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
// src/components/ActionMessage.tsx
// A reusable component to display an AI message with actionable buttons.

"use client";

import React from "react";
import { Button } from "@/components/ui/button";

// The component's props interface
export interface ActionMessageProps {
  message: {
    text: string;
    actions: {
      id: string;
      text: string;
      isPrimary?: boolean;
    }[];
  };
  onAction: (actionId: string) => void;
}

// The component itself
export const ActionMessage: React.FC<ActionMessageProps> = ({ message, onAction }) => {
  return (
    <div className="flex justify-start">
      <div className="flex flex-col space-y-2 max-w-md">
        <div className="bg-gray-200 dark:bg-zinc-700 p-4 rounded-2xl rounded-bl-none shadow-sm">
          <p className="text-sm">{message.text}</p>
        </div>
        <div className="w-full flex justify-end space-x-2">
          {message.actions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              onClick={() => onAction(action.id)}
              className={
                action.isPrimary
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                  : "bg-background hover:bg-accent hover:text-accent-foreground"
              }
            >
              {action.text}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
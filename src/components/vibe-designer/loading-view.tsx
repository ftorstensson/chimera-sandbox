"use client";

import { useState, useEffect } from "react";

const messages = [
  "Analyzing your idea...",
  "Brainstorming core concepts...",
  "Identifying key features...",
  "Defining the target audience...",
  "Putting it all together...",
];

export function LoadingView() {
  const [currentMessage, setCurrentMessage] = useState(messages[0]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setCurrentMessage(messages[index]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-96 flex-col items-center justify-center space-y-6 text-center animate-in fade-in-50 duration-500">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute h-full w-full animate-spin rounded-full border-4 border-dashed border-primary"></div>
        <div className="absolute h-full w-full animate-spin rounded-full border-4 border-solid border-accent opacity-75 [animation-delay:-0.2s]"></div>
      </div>
      <div className="space-y-2">
        <p className="font-headline text-2xl font-semibold text-primary transition-all duration-300">
          {currentMessage}
        </p>
        <p className="text-muted-foreground">The AI is working its magic. Please wait a moment.</p>
      </div>
    </div>
  );
}

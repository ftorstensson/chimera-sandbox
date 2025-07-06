"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SendHorizontal, Bot, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { Message } from "@/app/page";


type ChatViewProps = {
  messages: Message[];
  onSendMessage: (message: string) => void;
};

export function ChatView({ messages, onSendMessage }: ChatViewProps) {
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto">
      <ScrollArea className="flex-1 w-full" viewportRef={viewportRef}>
        <div className="space-y-6 p-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 text-sm ${message.role === 'user' ? 'justify-end' : 'items-end'}`}>
              {message.role === 'ai' && (
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback><Bot size={18} /></AvatarFallback>
                </Avatar>
              )}
              <div className={`rounded-lg px-4 py-3 max-w-xl animate-in fade-in duration-300 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {message.isGenerating ? (
                   <div className="flex items-center gap-2 p-2">
                     <div className="w-2 h-2 bg-foreground/70 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                     <div className="w-2 h-2 bg-foreground/70 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                     <div className="w-2 h-2 bg-foreground/70 rounded-full animate-pulse"></div>
                   </div>
                ) : (
                  typeof message.content === 'string' ? <p className="whitespace-pre-wrap">{message.content}</p> : message.content
                )}
              </div>
              {message.role === 'user' && (
                 <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback><User size={18} /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 bg-background w-full sticky bottom-0">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto">
          <Input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Suggest a change or ask a question..."
            className="flex-1 h-12 text-base"
            autoFocus
          />
          <Button type="submit" size="icon" className="h-12 w-12" disabled={!inputValue.trim()}>
            <SendHorizontal />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

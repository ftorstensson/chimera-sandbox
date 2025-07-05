"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message } from "@/app/page";
import { SendHorizontal, Bot, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type ChatViewProps = {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onStartOver: () => void;
};

export function ChatView({ messages, onSendMessage, onStartOver }: ChatViewProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  return (
    <div className="flex flex-col h-[85vh] w-full bg-card rounded-xl shadow-lg border animate-in fade-in-50 duration-500">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="font-headline text-xl font-bold text-primary">Vibe Designer AI</h1>
        <Button variant="outline" onClick={onStartOver}>Start Over</Button>
      </header>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex items-start gap-3 text-sm ${message.role === 'user' ? 'justify-end' : ''}`}>
              {message.role === 'ai' && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback><Bot size={18} /></AvatarFallback>
                </Avatar>
              )}
              <div className={`rounded-lg px-4 py-3 max-w-2xl ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {message.isGenerating ? (
                   <div className="flex items-center gap-2 p-2">
                     <div className="w-2 h-2 bg-foreground/70 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                     <div className="w-2 h-2 bg-foreground/70 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                     <div className="w-2 h-2 bg-foreground/70 rounded-full animate-pulse"></div>
                   </div>
                ) : (
                  typeof message.content === 'string' ? <p>{message.content}</p> : message.content
                )}
              </div>
              {message.role === 'user' && (
                 <Avatar className="w-8 h-8">
                  <AvatarFallback><User size={18} /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t bg-background/50 rounded-b-xl">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Suggest a change or ask a question..."
            className="flex-1"
            autoFocus
          />
          <Button type="submit" size="icon" disabled={!inputValue.trim()}>
            <SendHorizontal />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

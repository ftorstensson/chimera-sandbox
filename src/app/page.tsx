// src/app/page.tsx
// FINAL CORRECTED VERSION v4.1
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import UserMessage from "@/components/UserMessage";
import AssistantMessage from "@/components/AssistantMessage";

interface ChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string | null;
}

interface ChatHistoryItem {
  chatId: string;
  title: string;
}

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const backendApiUrl = 'https://idx-ai-designer-backend-82522688-534939227554.australia-southeast1.run.app';

  const fetchChatHistory = useCallback(async () => {
    try {
      const response = await fetch(`${backendApiUrl}/chats`);
      if (!response.ok) throw new Error("Failed to fetch chat history");
      const data: ChatHistoryItem[] = await response.json();
      setChatHistory(data);
    } catch (error) { console.error(error); }
  }, [backendApiUrl]);

  useEffect(() => { fetchChatHistory(); }, [fetchChatHistory]);

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setCurrentInput("");
  };

  const handleSelectChat = useCallback(async (chatId: string) => {
    // In a full implementation, you would fetch the chat messages here
    // For now, we just start a new local session with the correct ID
    handleNewChat();
    setCurrentChatId(chatId);
    const selected = chatHistory.find(c => c.chatId === chatId);
    setMessages([{ role: 'assistant', content: `Continuing conversation: ${selected?.title || 'Untitled Chat'}` }]);
  }, [chatHistory]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (input: string) => {
    const effectiveInput = input.trim();
    if (!effectiveInput) return;

    setIsLoading(true);
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: effectiveInput }];
    setMessages(newMessages);
    setCurrentInput("");
    
    try {
      const response = await fetch(`${backendApiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: currentChatId,
          message: effectiveInput,
          // Send the current message history for context
          messages: newMessages.filter(m => m.role !== 'tool'),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(errData.error);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // The backend now sends the full history, so we can just replace our local version
      setMessages(data.full_messages);
      setCurrentChatId(data.chatId);
      
      // If this was the first message in a new chat, refresh the history list
      if (!currentChatId) {
        fetchChatHistory();
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className={`bg-gray-800 text-white flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <Button onClick={handleNewChat} className="w-full bg-indigo-500 hover:bg-indigo-600">
            + New Chat
          </Button>
        </div>
        <div className="flex-grow overflow-y-auto">
          <nav className="p-2 space-y-1">
            {chatHistory.map(chat => (
              <a key={chat.chatId} href="#" onClick={(e) => { e.preventDefault(); handleSelectChat(chat.chatId); }}
                 className={`block px-3 py-2 rounded-md text-sm font-medium truncate ${currentChatId === chat.chatId ? 'bg-gray-900' : 'hover:bg-gray-700'}`}>
                {chat.title}
              </a>
            ))}
          </nav>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <header className="flex items-center text-center p-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Vibe Designer AI</h1>
        </header>
        
        <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-6 space-y-6 bg-gray-50">
          {messages.map((msg, index) => {
            if (msg.role === 'user') {
              return <UserMessage key={index}>{msg.content}</UserMessage>;
            }
            if (msg.role === 'assistant' && msg.content) {
              return <AssistantMessage key={index}>{msg.content}</AssistantMessage>;
            }
            return null;
          })}
          {isLoading && ( /* ... Loading indicator ... */
            <div className="flex justify-start">
              <div className="bg-white text-gray-500 p-4 rounded-2xl rounded-bl-none shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
           )}
        </div>

        <div className="p-4 bg-white/80 backdrop-blur-sm border-t">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(currentInput); }}>
            <div className="flex items-center space-x-2">
              <Textarea value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} placeholder="Describe your app idea, or type your refinements..." className="flex-grow rounded-lg px-4 py-2 resize-none" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(currentInput); } }} disabled={isLoading} rows={1}/>
              <Button type="submit" className="rounded-lg h-10 w-16" disabled={isLoading}>Send</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
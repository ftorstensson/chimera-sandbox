// src/app/page.tsx
// v9.6 - The Final "Full Page Scroll" UI Polish
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserMessage from "@/components/UserMessage";
import AssistantMessage from "@/components/AssistantMessage";
import ExpertOutputDisplay from "@/components/ExpertOutputDisplay";
import { Menu, Compass, Code, MessageSquare, Plus } from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface ChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string | null;
  agent_used?: string;
  structured_data?: any;
}

interface ChatHistoryItem {
  chatId: string;
  title: string;
}

const agentList = ['concept_crafter', 'guide_agent', 'insight_agent'];

// ==============================================================================
//  WELCOME SCREEN COMPONENT
// ==============================================================================
const WelcomeScreen = () => (
  // This div ensures the welcome screen also respects the container's height
  <div className="flex flex-col items-center justify-center h-full text-center pb-24">
    <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">Hello, I'm Vibe Designer</h1>
    <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Your creative partner for designing new applications.</p>
    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700"><Compass className="h-6 w-6 mx-auto mb-2 text-indigo-500"/><p>Explore new app ideas</p></div>
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700"><Code className="h-6 w-6 mx-auto mb-2 text-indigo-500"/><p>Design application architecture</p></div>
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700"><MessageSquare className="h-6 w-6 mx-auto mb-2 text-indigo-500"/><p>Craft user-centric experiences</p></div>
    </div>
  </div>
);

// ==============================================================================
//  MAIN HOME PAGE COMPONENT
// ==============================================================================
export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [forcedAgent, setForcedAgent] = useState<string | "none">("none");

  const bottomOfChatRef = useRef<HTMLDivElement>(null);
  const backendApiUrl = 'https://idx-ai-designer-backend-82522688-534939227554.australia-southeast1.run.app';

  const fetchChatHistory = useCallback(async () => {
    try {
      const response = await fetch(`${backendApiUrl}/chats`);
      if (!response.ok) throw new Error("Failed to fetch chat history");
      const data: ChatHistoryItem[] = await response.json();
      setChatHistory(data);
    } catch (error) { console.error("Failed to fetch chat history:", error); }
  }, [backendApiUrl]);

  useEffect(() => { fetchChatHistory(); }, [fetchChatHistory]);

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setCurrentInput("");
  };

  const loadChatHistory = useCallback(async (chatId: string) => {
    setIsLoading(true);
    try {
        const response = await fetch(`${backendApiUrl}/chats/${chatId}`);
        if (!response.ok) throw new Error(`Failed to fetch chat: ${response.statusText}`);
        const data = await response.json();
        setMessages(data.messages || []);
        setCurrentChatId(chatId);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setMessages([{ role: 'assistant', content: `Error loading chat: ${errorMessage}` }]);
        setCurrentChatId(null);
    } finally {
        setIsLoading(false);
    }
  }, [backendApiUrl]);

  const handleSubmit = async (input: string) => {
    const effectiveInput = input.trim();
    if (!effectiveInput || isLoading) return;
    setIsLoading(true);
    const currentMessages = messages.length === 0 && !currentChatId ? [] : [...messages];
    const optimisticMessages: ChatMessage[] = [...currentMessages, { role: 'user', content: effectiveInput }];
    setMessages(optimisticMessages);
    setCurrentInput("");
    try {
      const response = await fetch(`${backendApiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: currentChatId, message: effectiveInput, force_tool_name: forcedAgent }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setMessages(data.messages);
      if (!currentChatId && data.chatId) {
        setCurrentChatId(data.chatId);
        await fetchChatHistory();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
      setForcedAgent("none");
    }
  };
  
  useEffect(() => {
    bottomOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- v9.6 JSX RENDER (FULL PAGE SCROLL LAYOUT) ---
  return (
    <div className="flex h-screen w-full bg-gray-100 dark:bg-[#131314] text-gray-900 dark:text-gray-100">
      
      <aside className={`flex flex-col flex-shrink-0 bg-[#1e1f20] text-white transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-0'}`}>
        <div className="p-2 flex-shrink-0">
          <Button variant="ghost" className="w-full justify-start gap-2 text-lg" onClick={handleNewChat}><Plus /> New Chat</Button>
        </div>
        <div className="flex-grow overflow-y-auto px-2">
          <p className="px-3 py-2 text-sm font-medium text-gray-400">Recent</p>
          <nav className="space-y-1">
            {chatHistory.map(chat => (
              <a key={chat.chatId} href="#" onClick={(e) => { e.preventDefault(); loadChatHistory(chat.chatId); }}
                 className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium truncate ${currentChatId === chat.chatId ? 'bg-[#3c4655] text-white' : 'text-gray-300 hover:bg-[#2d2e30]'}`}>
                <MessageSquare className="h-4 w-4" />{chat.title}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* ===== MAIN SCROLLING CONTAINER (Correct) ===== */}
      <main className="flex flex-1 flex-col h-full overflow-y-auto">
        
        {/* === STICKY HEADER (Correct) === */}
        <header className="sticky top-0 z-10 flex items-center p-2 flex-shrink-0 border-b dark:border-gray-700 bg-white/80 dark:bg-[#131314]/80 backdrop-blur-sm">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mr-2 text-gray-500"><Menu size={24} /></Button>
          <h1 className="text-xl font-semibold">Vibe Designer AI</h1>
        </header>

        {/* This container centers the chat content and handles its max-width */}
        <div className="w-full max-w-3xl mx-auto flex-grow">
          {messages.length === 0 && !isLoading ? (
            <WelcomeScreen />
          ) : (
            <div className="p-6 space-y-6">
              {messages.map((msg, index) => {
                if (msg.role === 'user' && msg.content) return <UserMessage key={index}>{msg.content}</UserMessage>;
                if (msg.role === 'assistant' && msg.content) {
                  return (
                    <AssistantMessage key={index}>
                      {msg.content}
                      {msg.agent_used && msg.structured_data && (
                        <ExpertOutputDisplay agentName={msg.agent_used} data={msg.structured_data} />
                      )}
                    </AssistantMessage>
                  );
                }
                return null;
              })}
              {isLoading && messages.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-2xl rounded-bl-none shadow-sm animate-pulse">...thinking</div>
                  </div>
              )}
              {/* This empty div is a reference point to scroll to the bottom */}
              <div ref={bottomOfChatRef}></div>
            </div>
          )}
        </div>
        
        {/* === STICKY FOOTER (Correct) === */}
        <div className="sticky bottom-0 z-10 flex-shrink-0 bg-white/80 dark:bg-[#131314]/80 backdrop-blur-sm">
           <div className="p-4 border-t border-gray-200 dark:border-gray-700 w-full max-w-3xl mx-auto">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(currentInput); }}>
              <div className="flex items-end space-x-2">
                <Textarea value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} placeholder="Describe your app idea..." className="flex-grow rounded-lg px-4 py-2 resize-none bg-gray-100 dark:bg-gray-700" rows={1}/>
                <div className="flex flex-col space-y-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400">Debug:</label>
                    <Select onValueChange={(value) => setForcedAgent(value as string)} value={forcedAgent || "none"}>
                      <SelectTrigger className="w-[180px] h-10 bg-white dark:bg-gray-700"><SelectValue placeholder="Auto" /></SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-700">
                        <SelectItem value="none">Auto</SelectItem>
                        {agentList.map(agent => <SelectItem key={agent} value={agent}>{agent}</SelectItem>)}
                      </SelectContent>
                    </Select>
                </div>
                <Button type="submit" className="rounded-lg h-10 w-16 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading}>Send</Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
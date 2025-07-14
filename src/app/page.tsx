// src/app/page.tsx
// DEFINITIVE VERSION v8.0 - The Universal Expert UI
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserMessage from "@/components/UserMessage";
import AssistantMessage from "@/components/AssistantMessage";

// --- UNIVERSAL COMPONENT IMPORT ---
// We only need one component for all specialist output now.
import ExpertOutputDisplay from "@/components/ExpertOutputDisplay";

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

// A simple list of our expert agents for the debug dropdown.
const agentList = [
    'concept_crafter',
    'guide_agent',
    'insight_agent',
];

// ==============================================================================
//  MAIN HOME PAGE COMPONENT
// ==============================================================================
export default function HomePage() {
  // --- STATE HOOKS ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [forcedAgent, setForcedAgent] = useState<string | "none">("none");

  const chatContainerRef = useRef<HTMLDivElement>(null);
  // IMPORTANT: Ensure this URL points to your deployed backend service
  const backendApiUrl = 'https://idx-ai-designer-backend-82522688-534939227554.australia-southeast1.run.app';

  // --- DATA FETCHING & CHAT MANAGEMENT ---
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
    // This is a placeholder. In a real app, you would fetch the full message history.
    handleNewChat();
    setCurrentChatId(chatId);
    const selected = chatHistory.find(c => c.chatId === chatId);
    setMessages([{ role: 'assistant', content: `Resuming conversation: ${selected?.title || 'Untitled Chat'}` }]);
  }, [chatHistory]);

  // --- MAIN SUBMIT HANDLER ---
  const handleSubmit = async (input: string) => {
    const effectiveInput = input.trim();
    if (!effectiveInput || isLoading) return;

    setIsLoading(true);
    const optimisticMessages: ChatMessage[] = [...messages, { role: 'user', content: effectiveInput }];
    setMessages(optimisticMessages);
    setCurrentInput("");
    
    try {
      const response = await fetch(`${backendApiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: currentChatId,
          message: effectiveInput,
          force_tool_name: forcedAgent === "none" ? null : forcedAgent,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages(data.messages);
      if (!currentChatId && data.chatId) {
        setCurrentChatId(data.chatId);
        fetchChatHistory();
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
      setForcedAgent("none");
    }
  };
  
  // Auto-scroll effect
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // --- JSX RENDER ---
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`bg-gray-800 text-white flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <Button onClick={handleNewChat} className="w-full bg-indigo-500 hover:bg-indigo-600">+ New Chat</Button>
        </div>
        <div className="flex-grow overflow-y-auto">
          <nav className="p-2 space-y-1">
            {chatHistory.map(chat => (
              <a key={chat.chatId} href="#" onClick={(e) => { e.preventDefault(); loadChatHistory(chat.chatId); }}
                 className={`block px-3 py-2 rounded-md text-sm font-medium truncate ${currentChatId === chat.chatId ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                {chat.title}
              </a>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        <header className="flex items-center text-center p-4 border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mr-4 text-gray-600 dark:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Vibe Designer AI</h1>
        </header>
        
        {/* Message Display Area */}
        <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
          {messages.map((msg, index) => {
            if (msg.role === 'user' && msg.content) {
              return <UserMessage key={index}>{msg.content}</UserMessage>;
            }
            if (msg.role === 'assistant' && msg.content) {
              const showExpertComponent = msg.agent_used && msg.structured_data;
              return (
                <AssistantMessage key={index}>
                  {msg.content}
                  {showExpertComponent && (
                    <ExpertOutputDisplay
                      agentName={msg.agent_used!}
                      data={msg.structured_data}
                    />
                  )}
                </AssistantMessage>
              );
            }
            return null; // Ignore 'tool' messages or messages without content
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-700 text-gray-500 p-4 rounded-2xl rounded-bl-none shadow-sm"><div className="flex items-center space-x-2"><div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div></div></div>
            </div>
           )}
        </div>
        
        {/* Input Form */}
        <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t dark:border-gray-700">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(currentInput); }}>
            <div className="flex items-end space-x-2">
              <Textarea value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} placeholder="Describe your app idea..." className="flex-grow rounded-lg px-4 py-2 resize-none bg-white dark:bg-gray-700 dark:text-white" rows={1}/>
              <div className="flex flex-col space-y-1">
                 <label className="text-xs text-gray-500 dark:text-gray-400">Debug:</label>
                 <Select onValueChange={(value) => setForcedAgent(value as string)} value={forcedAgent || "none"}>
                   <SelectTrigger className="w-[180px] h-10 bg-white dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Auto" /></SelectTrigger>
                   <SelectContent className="bg-white dark:bg-gray-700 dark:text-white">
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
    </div>
  );
}
// src/app/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ProjectPlan } from "./types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// --- COMPONENT IMPORTS ---
import UserMessage from "@/components/UserMessage";
import AssistantMessage from "@/components/AssistantMessage";
import GuideOutputDisplay from "@/components/GuideOutputDisplay";
import InsightOutputDisplay from "@/components/InsightOutputDisplay";
import JourneyOutputDisplay from "@/components/JourneyOutputDisplay"; // <-- 1. IMPORT a new component
// We will add more display components here later

// This defines the type for a single chat message in our state
// It now matches the structure we save in Firestore
interface ChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

// Type for the chat history list in the side panel
interface ChatHistoryItem {
  chatId: string;
  title: string;
}

// This map tells the app which React component to use for which agent's data
const componentMap: { [key: string]: React.ComponentType<{ data: any }> } = {
  guide_agent: GuideOutputDisplay,
  insight_agent: InsightOutputDisplay,
  journey_agent: JourneyOutputDisplay, // <-- 2. REGISTER the new component
  // We will add 'architect', etc. here later
};

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [projectDocument, setProjectDocument] = useState<Partial<ProjectPlan>>({});
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // NEW STATE for managing multiple chats
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const backendApiUrl = 'https://idx-ai-designer-backend-82522688-534939227554.australia-southeast1.run.app';

  // --- NEW: DATA FETCHING AND STATE MANAGEMENT FUNCTIONS ---

  const fetchChatHistory = useCallback(async () => {
    try {
      const response = await fetch(`${backendApiUrl}/chats`);
      if (!response.ok) throw new Error("Failed to fetch chat history");
      const data: ChatHistoryItem[] = await response.json();
      setChatHistory(data);
    } catch (error) {
      console.error(error);
      // Optionally show a toast or error message to the user
    }
  }, [backendApiUrl]);

  // Fetch history when the component mounts
  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setProjectDocument({});
    setCurrentInput("");
  };
  
  const handleSelectChat = (chatId: string) => {
    const selectedChat = chatHistory.find(c => c.chatId === chatId);
    if (!selectedChat) return;

    // In a full implementation, you would fetch the full chat history here.
    // For now, we just reset the view, assuming the backend will load the context.
    // This is a simplification to get started.
    handleNewChat(); // Clear the board
    setCurrentChatId(chatId); // Set the ID for the next message
    // A more robust implementation would fetch and display the old messages.
    setMessages([{ role: 'assistant', content: `Continuing conversation: ${selectedChat.title}` }]);
  };


  // Effect to auto-scroll to the latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // --- REFACTORED: handleSubmit to work with the new stateful backend ---
  const handleSubmit = async (input: string) => {
    const effectiveInput = input.trim();
    if (!effectiveInput) {
      alert("Please enter a message to continue.");
      return;
    }
    
    const userMessage: ChatMessage = { role: 'user', content: effectiveInput };
    setMessages(prev => [...prev, userMessage]);
    
    setCurrentInput("");
    setIsLoading(true);
    
    try {
      const response = await fetch(`${backendApiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: currentChatId,
          message: effectiveInput,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: `API request failed with status: ${response.status}` }));
        throw new Error(errData.error || "An unknown API error occurred.");
      }

      const data = await response.json();
      if(data.error) throw new Error(data.error);

      setCurrentChatId(data.chatId);
      setProjectDocument(data.project_document);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.natural_language_response,
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // If a new chat was created, refresh the history
      if (!currentChatId) {
        fetchChatHistory();
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      const errorAssistantMessage: ChatMessage = {
        role: 'assistant',
        content: `Sorry, something went wrong: ${errorMessage}`,
      };
      setMessages(prev => [...prev, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* --- NEW: Sidebar for Chat History --- */}
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
                {chat.title.replace("Chat: ", "")}
              </a>
            ))}
          </nav>
        </div>
      </div>
      
      {/* --- Main Chat Area --- */}
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
              return <AssistantMessage 
                  key={index} 
                  content={msg.content} 
                  projectDocument={projectDocument} // Pass the latest full project doc
                  componentMap={componentMap} 
                />;
            }
            return null; // Don't render tool messages, etc.
          })}

          {isLoading && (
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
              <Textarea
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Describe your app idea, or type your refinements..."
                className="flex-grow rounded-lg px-4 py-2 resize-none"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(currentInput); } }}
                disabled={isLoading}
                rows={1}
              />
              <Button type="submit" className="rounded-lg h-10 w-16" disabled={isLoading}>
                Send
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
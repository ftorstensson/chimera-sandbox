// src/app/page.tsx - FINAL DEFINITIVE VERSION v3
"use client";

import { useState, useRef, useEffect } from "react";
import type { ProjectPlan } from "./types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// --- COMPONENT IMPORTS - CORRECTED SYNTAX ---
import UserMessage from "@/components/UserMessage";
import AssistantMessage from "@/components/AssistantMessage";
import AgentOutputCard from "@/components/AgentOutputCard";
import GuideOutputDisplay from "@/components/GuideOutputDisplay";
import InsightOutputDisplay from "@/components/InsightOutputDisplay";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: React.ReactNode;
}

const agentDisplayMap: Record<string, React.FC<{ data: any }>> = {
  guide_agent: GuideOutputDisplay,
  insight_agent: InsightOutputDisplay,
};

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [projectDocument, setProjectDocument] = useState<Partial<ProjectPlan>>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const backendApiBaseUrl = 'https://idx-ai-designer-backend-82522688-534939227554.australia-southeast1.run.app';

  useEffect(() => {
    chatContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const handleSubmit = async (input: string) => {
    const effectiveInput = input || (messages.length > 0 ? "Sounds good, continue." : "");
    if (!effectiveInput) {
      alert("Please describe your app idea to start.");
      return;
    }
    
    const newUserMessage: ChatMessage = { role: 'user', content: effectiveInput };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    
    setCurrentInput("");
    setIsLoading(true);
    
    try {
      const endpoint = `${backendApiBaseUrl}/chat`;
      const requestBody = {
        messages: updatedMessages.map(msg => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : "[User received a structured response]",
        })),
        project_context: projectDocument
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
          const err = await response.json().catch(() => ({error: "API call failed with no JSON response."}));
          throw new Error(err.error || "An unknown API error occurred.");
      }

      const data = await response.json();
      if(data.error) throw new Error(data.error);

      if (data.agent_used && data.structured_data) {
          setProjectDocument(prevDoc => ({ ...prevDoc, [data.agent_used]: data.structured_data }));
      }
      
      const AgentDisplayComponent = agentDisplayMap[data.agent_used];

      const assistantResponseContent = (
        <AgentOutputCard title={data.natural_language_response}>
          {AgentDisplayComponent ? <AgentDisplayComponent data={data.structured_data} /> : null}
        </AgentOutputCard>
      );
      
      setMessages(prev => [...prev, { role: 'assistant', content: assistantResponseContent }]);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, something went wrong: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gray-50">
        <header className="text-center p-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <h1 className="text-xl font-semibold text-gray-900">Vibe Designer AI</h1>
        </header>
        
        <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-6 space-y-8">
            {messages.map((msg, index) => (
              <div key={index}>
                {msg.role === 'user' 
                    ? <UserMessage>{msg.content}</UserMessage> 
                    : <AssistantMessage>{msg.content}</AssistantMessage>
                }
              </div>
            ))}
            {isLoading && <AssistantMessage>Thinking...</AssistantMessage>}
        </div>

        <div className="p-4 bg-white border-t">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(currentInput); }}>
                <div className="flex items-center space-x-2">
                    <Textarea
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        placeholder="Describe your app idea, or type your refinements..."
                        className="flex-grow rounded-lg px-4 py-2"
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
  );
}
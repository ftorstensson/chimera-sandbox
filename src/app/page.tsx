// src/app/page.tsx - NEW CHAT-BASED VERSION
"use client";

import { useState, useRef, useEffect } from "react";
import type { ProjectPlan } from "./types";
import { UserMessage } from "@/components/UserMessage";
import { AssistantMessage } from "@/components/AssistantMessage";
import { AgentOutputCard } from "@/components/AgentOutputCard";
// We need to re-import the UI components for the input
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Define a type for our chat messages
interface ChatMessage {
  role: 'user' | 'assistant';
  content: React.ReactNode; // Can be a string or a full component
}

// Same steps as before
const VIBE_STEPS = [
    { key: "guide", title: "🛸 The Guide", description: "Let's start with the big picture..." },
    { key: "insight", title: "🔍 The Insight Agent", description: "Next, who are we building this for?" },
    // ... add the rest of the agents here
];


export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [projectDocument, setProjectDocument] = useState<Partial<ProjectPlan>>({});
  const [isLoading, setIsLoading] = useState(false);

  const backendApiBaseUrl = 'https://idx-ai-designer-backend-82522688-534939227554.australia-southeast1.run.app'; // Replace with your URL

  const handleSubmit = async (input: string) => {
    if (!input) return;

    // Add the user's message to the chat history
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setCurrentInput("");
    setIsLoading(true);

    const step = VIBE_STEPS[currentStep];

    // Build the context, including ALL previous feedback from the chat history
    const context = {
      ...projectDocument,
      user_feedback_for_next_step: input
    };
    
    try {
      const endpoint = `${backendApiBaseUrl}/${step.key}`;
      const requestBody = currentStep === 0 ? { idea: input } : { context };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error("API call failed");

      const data = await response.json();
      
      const newProjectDocument = { ...projectDocument, [step.key]: data };
      setProjectDocument(newProjectDocument);

      // Add the AI's response to the chat history
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: <AgentOutputCard title={step.title} description={step.description}>
                   {/* We will build specific renderers for each agent's output later */}
                   <pre>{JSON.stringify(data, null, 2)}</pre> 
                 </AgentOutputCard>
      }]);

      setCurrentStep(prev => prev + 1);

    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, an error occurred." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
        <header className="text-center my-4">
            <h1 className="text-4xl font-bold">Vibe Designer AI</h1>
        </header>
        
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
                msg.role === 'user'
                    ? <UserMessage key={index}>{msg.content}</UserMessage>
                    : <AssistantMessage key={index}>{msg.content}</AssistantMessage>
            ))}
            {isLoading && <AssistantMessage>Thinking...</AssistantMessage>}
        </div>

        <div className="p-4 border-t">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(currentInput); }}>
                <div className="flex items-center space-x-2">
                    <Textarea
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        placeholder={messages.length === 0 ? "Describe your app idea..." : "Any refinements? Or just press Enter to continue..."}
                        className="flex-grow"
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(currentInput); } }}
                        disabled={isLoading || currentStep >= VIBE_STEPS.length}
                    />
                    <Button type="submit" disabled={isLoading || currentStep >= VIBE_STEPS.length}>
                        Send
                    </Button>
                </div>
            </form>
        </div>
    </div>
  );
}
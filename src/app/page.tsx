"use client";

import { useState } from "react";
import { InitialView } from "@/components/vibe-designer/initial-view";
import { useToast } from "@/hooks/use-toast";
import { ChatView } from "@/components/vibe-designer/chat-view";
import { BlueprintMessage } from "@/components/vibe-designer/blueprint-message";

// The type for our blueprint from the backend
type ProjectDocument = {
  guide: any;
  insight: any;
  journey: any;
  architect: any;
  ai_companion: any;
  mvp: any;
};

// The type for a chat message
export type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string | React.ReactNode;
  isGenerating?: boolean;
};

type View = "initial" | "chat";

export default function Home() {
  const [view, setView] = useState<View>("initial");
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  const handleGenerate = async (data: { appIdea: string }) => {
    setView("chat");

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: data.appIdea };
    const aiLoadingMessage: Message = { id: (Date.now() + 1).toString(), role: 'ai', content: '', isGenerating: true };
    setMessages([userMessage, aiLoadingMessage]);

    const backendApiUrl = 'https://idx-multi-agent-test-2-76381231-121857917257.australia-southeast1.run.app'; 

    try {
      const response = await fetch(backendApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea: data.appIdea }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`The AI agency reported an error: ${errorText || response.statusText}`);
      }

      const result: ProjectDocument = await response.json();
      
      const blueprintContent = <BlueprintMessage blueprint={result} />;
      const aiResponseMessage: Message = { 
        id: aiLoadingMessage.id, 
        role: 'ai', 
        content: blueprintContent,
        isGenerating: false,
      };
      
      setMessages([userMessage, aiResponseMessage]);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      const aiErrorMessage: Message = {
        id: aiLoadingMessage.id,
        role: 'ai',
        content: `Sorry, I ran into an error generating the blueprint. ${errorMessage}`,
        isGenerating: false,
      };
       setMessages([userMessage, aiErrorMessage]);
      toast({
        variant: "destructive",
        title: "Error Generating Blueprint",
        description: errorMessage,
      });
    }
  };
  
  const handleSendMessage = async (messageText: string) => {
    const newUserMessage: Message = { id: Date.now().toString(), role: 'user', content: messageText };
    setMessages(prev => [...prev, newUserMessage]);
    
    const aiLoadingMessageId = (Date.now() + 1).toString();
    const aiLoadingMessage: Message = { id: aiLoadingMessageId, role: 'ai', content: '', isGenerating: true };
    setMessages(prev => [...prev, aiLoadingMessage]);

    await new Promise(res => setTimeout(res, 1500));

    const cannedResponse = "I've received your feedback. The ability to revise the blueprint is coming soon! For now, you can start over to generate a new plan with your refined idea.";
    const aiResponseMessage: Message = {
      id: aiLoadingMessageId,
      role: 'ai',
      content: cannedResponse,
      isGenerating: false,
    };
    
    setMessages(prev => prev.map(m => m.id === aiLoadingMessageId ? aiResponseMessage : m));
  };

  const handleStartOver = () => {
    setView("initial");
    setMessages([]);
  };

  const renderContent = () => {
    switch (view) {
      case "chat":
        return <ChatView messages={messages} onSendMessage={handleSendMessage} onStartOver={handleStartOver} />;
      case "initial":
      default:
        return <InitialView onGenerate={handleGenerate} />;
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        {renderContent()}
      </div>
    </main>
  );
}

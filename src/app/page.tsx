"use client";

import { useState } from "react";
import { generateAppBlueprint } from "@/ai/flows/generate-app-blueprint";
import type { GenerateAppBlueprintOutput } from "@/ai/schemas";
import { reviseAppBlueprint } from "@/ai/flows/revise-app-blueprint";

import { InitialView } from "@/components/vibe-designer/initial-view";
import { ChatView } from "@/components/vibe-designer/chat-view";
import { useToast } from "@/hooks/use-toast";
import { BlueprintMessage } from "@/components/vibe-designer/blueprint-message";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  const [appIdea, setAppIdea] = useState("");
  const [currentBlueprint, setCurrentBlueprint] = useState<GenerateAppBlueprintOutput | null>(null);
  const { toast } = useToast();

  const handleGenerate = async (data: { appIdea: string }) => {
    setView("chat");
    setAppIdea(data.appIdea);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: data.appIdea,
    };
    const generatingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'ai',
      content: "",
      isGenerating: true,
    };
    setMessages([userMessage, generatingMessage]);

    try {
      const blueprint = await generateAppBlueprint({ appIdea: data.appIdea });
      setCurrentBlueprint(blueprint);
      const blueprintMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: <BlueprintMessage blueprint={blueprint} />,
      };
      setMessages([userMessage, blueprintMessage]);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Error Generating Blueprint",
        description: errorMessage,
      });
      handleStartOver();
    }
  };

  const handleRevise = async (feedback: string) => {
    if (!currentBlueprint) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: feedback,
    };
    const generatingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'ai',
      content: "",
      isGenerating: true,
    };

    setMessages(prev => [...prev, userMessage, generatingMessage]);

    try {
      const fullBlueprintString = JSON.stringify(currentBlueprint, null, 2);
      const newBlueprint = await reviseAppBlueprint({
        initialAppIdea: appIdea,
        currentBlueprint: fullBlueprintString,
        userFeedback: feedback,
      });
      
      setCurrentBlueprint(newBlueprint);

      const revisedMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'ai',
        content: <BlueprintMessage blueprint={newBlueprint} />,
      };

      setMessages(prev => [...prev.slice(0, -1), revisedMessage]);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Error Revising Blueprint",
        description: errorMessage,
      });
      setMessages(prev => prev.slice(0, -1));
    }
  };


  const handleStartOver = () => {
    setView("initial");
    setMessages([]);
    setAppIdea("");
    setCurrentBlueprint(null);
  };

  const renderContent = () => {
    switch (view) {
      case "chat":
        return (
          <ChatView
            messages={messages}
            onSendMessage={handleRevise}
          />
        );
      case "initial":
      default:
        return <InitialView onGenerate={handleGenerate} />;
    }
  };

  return (
    <main className={cn(
      "flex min-h-screen w-full flex-col",
      view === 'initial' ? "items-center justify-center p-4 sm:p-8" : ""
    )}>
      {view === 'chat' && (
        <header className="flex items-center justify-between p-4 border-b w-full sticky top-0 bg-background/95 z-10 backdrop-blur-sm">
          <h1 className="font-headline text-xl font-bold text-primary">Vibe Designer AI</h1>
          <Button variant="outline" onClick={handleStartOver}>Start Over</Button>
        </header>
      )}
      <div className={cn(
        "w-full",
        view === 'initial' ? "max-w-2xl" : "flex-1 flex flex-col"
      )}>
        {renderContent()}
      </div>
    </main>
  );
}

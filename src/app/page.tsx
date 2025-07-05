"use client";

import { useState } from "react";
import { generateAppBlueprint, GenerateAppBlueprintOutput, GenerateAppBlueprintInput } from "@/ai/flows/generate-app-blueprint";
import { reviseAppBlueprint, ReviseAppBlueprintInput, ReviseAppBlueprintOutput } from "@/ai/flows/revise-app-blueprint";
import { InitialView } from "@/components/vibe-designer/initial-view";
import { BlueprintView } from "@/components/vibe-designer/blueprint-view";
import { LoadingView } from "@/components/vibe-designer/loading-view";
import { useToast } from "@/hooks/use-toast";

type View = "initial" | "loading" | "blueprint";

export default function Home() {
  const [view, setView] = useState<View>("initial");
  const [appIdea, setAppIdea] = useState("");
  const [blueprint, setBlueprint] = useState<GenerateAppBlueprintOutput | null>(null);
  const { toast } = useToast();

  const handleGenerate = async (data: { appIdea: string }) => {
    setView("loading");
    setAppIdea(data.appIdea);

    try {
      const result = await generateAppBlueprint({ appIdea: data.appIdea });
      setBlueprint(result);
      setView("blueprint");
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Error Generating Blueprint",
        description: errorMessage,
      });
      setView("initial");
    }
  };

  const formatBlueprintToString = (bp: GenerateAppBlueprintOutput): string => {
    return `Core Problem: ${bp.coreProblem}\n\nKey Features: ${bp.keyFeatures}\n\nTarget User: ${bp.targetUser}`;
  };
  
  const parseBlueprintFromString = (str: string): GenerateAppBlueprintOutput => {
    const coreProblemMatch = str.match(/Core Problem:\s*([\s\S]*?)(?=Key Features:|$)/i);
    const keyFeaturesMatch = str.match(/Key Features:\s*([\s\S]*?)(?=Target User:|$)/i);
    const targetUserMatch = str.match(/Target User:\s*([\s\S]*)/i);

    return {
      coreProblem: coreProblemMatch ? coreProblemMatch[1].trim() : "Could not parse Core Problem.",
      keyFeatures: keyFeaturesMatch ? keyFeaturesMatch[1].trim() : "Could not parse Key Features.",
      targetUser: targetUserMatch ? targetUserMatch[1].trim() : "Could not parse Target User.",
    };
  }

  const handleRevise = async (data: { feedback: string }) => {
    if (!blueprint) return;
    setView("loading");

    const input: ReviseAppBlueprintInput = {
      initialAppIdea: appIdea,
      currentBlueprint: formatBlueprintToString(blueprint),
      userFeedback: data.feedback,
    };

    try {
      const result = await reviseAppBlueprint(input);
      const newBlueprint = parseBlueprintFromString(result.revisedBlueprint);
      setBlueprint(newBlueprint);
      setView("blueprint");
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Error Revising Blueprint",
        description: errorMessage,
      });
      setView("blueprint");
    }
  };

  const handleStartOver = () => {
    setView("initial");
    setBlueprint(null);
    setAppIdea("");
  };

  const renderContent = () => {
    switch (view) {
      case "loading":
        return <LoadingView />;
      case "blueprint":
        return blueprint && <BlueprintView blueprint={blueprint} appIdea={appIdea} onRevise={handleRevise} onStartOver={handleStartOver} />;
      case "initial":
      default:
        return <InitialView onGenerate={handleGenerate} />;
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-3xl space-y-8">
        {renderContent()}
      </div>
    </main>
  );
}

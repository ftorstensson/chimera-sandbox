"use client";

import { useState } from "react";
import type { ProjectPlan } from "./types";
import { ConversationDisplay } from "@/components/ConversationDisplay";

// Define the steps of our process
const VIBE_STEPS = [
  { key: "guide", title: "Shaping the Vision", endpoint: "/guide", buttonText: "Next: Analyze the Market" },
  { key: "insight", title: "Analyzing the Market", endpoint: "/insight", buttonText: "Next: Design the User Journey" },
  { key: "journey", title: "Designing the Journey", endpoint: "/journey", buttonText: "Next: Plan the Architecture" },
  { key: "architect", title: "Planning the Architecture", endpoint: "/architect", buttonText: "Next: Add AI Features" },
  { key: "ai_companion", title: "Adding AI Features", endpoint: "/ai-companion", buttonText: "Next: Define the MVP" },
  { key: "mvp", title: "Defining the MVP", endpoint: "/mvp", buttonText: "View Full Plan" },
];

const LoadingSpinner = ({ text }: { text: string }) => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    <p className="ml-4 text-lg">{text}...</p>
  </div>
);

export default function HomePage() {
  const [idea, setIdea] = useState("");
  const [currentStep, setCurrentStep] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [projectDocument, setProjectDocument] = useState<Partial<ProjectPlan>>({});
  const [error, setError] = useState<string | null>(null);

  // IMPORTANT: This must be the base URL of your deployed backend
  const backendApiBaseUrl = 'https://idx-ai-designer-backend-82522688-534939227554.australia-southeast1.run.app'; 

  const handleStart = () => {
    if (!idea) {
      alert("Please enter your app idea.");
      return;
    }
    setError(null);
    setCurrentStep(0);
    handleNextStep(0, {});
  };
  
  const handleNextStep = async (stepIndex: number, currentDoc: Partial<ProjectPlan>) => {
    setIsLoading(true);
    const step = VIBE_STEPS[stepIndex];

    try {
      const endpoint = `${backendApiBaseUrl}${step.endpoint}`;
      const requestBody = stepIndex === 0 ? { idea } : { context: currentDoc };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
        throw new Error(errorData.error || `An unknown error occurred.`);
      }

      const data = await response.json();
      
      const newProjectDocument = { ...currentDoc, [step.key as keyof ProjectPlan]: data };
      setProjectDocument(newProjectDocument);
      setCurrentStep(stepIndex + 1);

    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    setIdea("");
    setCurrentStep(-1);
    setProjectDocument({});
    setError(null);
  };

  const renderContent = () => {
    if (currentStep === -1) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <label htmlFor="idea-input" className="block text-sm font-medium text-gray-700 mb-1">
              What's the vibe?
            </label>
            <textarea id="idea-input" value={idea} onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g., An app that uses AI to suggest recipes based on ingredients I have in my fridge."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <button onClick={handleStart} className="mt-4 w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700">
              Start Designing
            </button>
        </div>
      );
    }

    return (
      <div>
        <ConversationDisplay plan={projectDocument} />
        
        {isLoading && <LoadingSpinner text={VIBE_STEPS[currentStep]?.title || 'Finalizing'} />}

        {error && (
            <div className="mt-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <p className="font-bold">An Error Occurred</p><p>{error}</p>
            </div>
        )}

        {!isLoading && currentStep <= 5 && (
            <button onClick={() => handleNextStep(currentStep, projectDocument)} className="mt-6 w-full bg-green-600 text-white font-bold py-3 px-4 rounded-md hover:bg-green-700">
                {VIBE_STEPS[currentStep].buttonText}
            </button>
        )}
        
        {currentStep > 5 && !isLoading && (
           <div className="text-center mt-8">
              <h2 className="text-2xl font-bold">🎉 Your Vibe is Fully Designed!</h2>
              <button onClick={handleReset} className="mt-4 bg-gray-600 text-white font-bold py-2 px-6 rounded-md hover:bg-gray-700">
                  Start a New Vibe
              </button>
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 text-gray-800">
      <main className="container mx-auto p-4 md:p-8 w-full max-w-4xl">
        <header className="text-center my-8">
          <h1 className="text-5xl font-bold tracking-tight">Vibe Designer AI</h1>
          <p className="text-lg text-gray-600 mt-2">
            {currentStep === -1 
              ? "Turn your spark of an idea into a complete project plan."
              : `Step ${currentStep + 1}: ${VIBE_STEPS[currentStep]?.title || 'Complete!'}`
            }
          </p>
        </header>
        {renderContent()}
      </main>
    </div>
  );
}
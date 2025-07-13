// src/components/AICompanionOutputDisplay.tsx
// v1.2 - Bugfix for CardHeader closing tag typo

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Users } from 'lucide-react';

// Define the TypeScript interface for the component's props for type safety
interface AICompanionOutputDisplayProps {
  data: {
    title: string;
    description: string;
    persona: {
      name: string;
      style: string;
      tone: string;
    };
    core_functions: Array<{
      function_name: string;
      description: string;
      details: string[];
    }>;
  };
}

const AICompanionOutputDisplay: React.FC<AICompanionOutputDisplayProps> = ({ data }) => {
  // Gracefully handle cases where data might not be present
  if (!data || !data.persona || !data.core_functions) {
    return (
        <Card className="bg-yellow-50 border border-yellow-200">
            <CardHeader>
                <CardTitle className="text-yellow-800">Incomplete Data</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-yellow-700">Waiting for complete AI Companion data from the backend.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-6 text-gray-800">
      {/* Main Title and Description */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">{data.title}</h2>
        <p className="mt-2 text-lg text-gray-600 max-w-3xl mx-auto">{data.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Persona Card */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-blue-500" />
              <CardTitle className="text-xl font-semibold">AI Persona: {data.persona.name}</CardTitle>
            </div>
            <CardDescription className="pt-2">The personality and communication style of your AI companion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-700">Style:</h4>
              <p className="text-gray-600">{data.persona.style}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700">Tone:</h4>
              <p className="text-gray-600">{data.persona.tone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Core Capabilities Introduction Card */}
        <Card className="bg-white border border-gray-200 shadow-sm">
           <CardHeader>
            <div className="flex items-center space-x-3">
               <Lightbulb className="h-6 w-6 text-yellow-500" />
               <CardTitle className="text-xl font-semibold">Core Capabilities</CardTitle>
            </div>
            <CardDescription className="pt-2">An overview of what this AI companion is designed to do.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              The AI companion is equipped with the following primary functions to assist the user effectively. Each function handles a specific aspect of the user's journey.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Core Functions Detailed List */}
      <div className="space-y-4 pt-4">
        <h3 className="text-2xl font-bold text-center text-gray-900">Functionality Breakdown</h3>
        {data.core_functions.map((func, index) => (
          <Card key={index} className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50 p-4">
               <CardTitle className="text-lg font-semibold flex items-center gap-3">
                 <Badge variant="secondary" className="text-base h-6 w-6 flex items-center justify-center">{index + 1}</Badge>
                 {func.function_name}
               </CardTitle>
               <CardDescription className="pt-2 pl-10">{func.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                {func.details.map((detail, detailIndex) => (
                  <li key={detailIndex}>{detail}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AICompanionOutputDisplay;
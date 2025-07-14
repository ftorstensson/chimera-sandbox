// src/components/ExpertOutputDisplay.tsx
// v1.0 - The Universal Expert UI Component

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Link as LinkIcon } from 'lucide-react';

// Define the shape of the data this component expects
// It's designed to be flexible.
interface ExpertOutputDisplayProps {
  agentName: string;
  data: any; // The data can be any JSON object from a specialist
}

// A helper function to convert agent names into friendly titles
const getAgentTitle = (agentName: string): string => {
  const titles: { [key: string]: string } = {
    concept_crafter: "From the desk of: The Concept Crafter",
    guide_agent: "From the desk of: The Guide",
    insight_agent: "From the desk of: The Insight Agent",
    // Add other agents here as they are upgraded
  };
  return titles[agentName] || "A new report from our team";
};

// A helper function to render any value intelligently
const renderValue = (value: any): React.ReactNode => {
  // If the value is a simple type (string, number), just display it.
  if (typeof value !== 'object' || value === null) {
    return <p>{String(value)}</p>;
  }

  // If the value is an array, try to render it as a list of links.
  if (Array.isArray(value)) {
    // Check if the first item in the array looks like our 'App Analogue' structure
    if (value.length > 0 && value[0].name && value[0].url) {
      return (
        <ul className="space-y-2">
          {(value as { name: string; url: string }[]).map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-gray-400" />
              <a
                href={item.url}
                target="_blank" // This makes the link open in a new tab
                rel="noopener noreferrer" // Security best practice for new tabs
                className="text-blue-600 hover:underline"
              >
                {item.name}
              </a>
            </li>
          ))}
        </ul>
      );
    }
    // Otherwise, just join the array elements as a string.
    return <p>{value.join(', ')}</p>;
  }

  // If the value is an object, render its key-value pairs.
  return (
    <div className="ml-4 space-y-1 border-l-2 border-gray-200 pl-4">
      {Object.entries(value).map(([key, val]) => (
        <div key={key}>
          <p className="font-semibold text-gray-600">{key.replace(/([A-Z])/g, ' $1').trim()}:</p>
          <div className="pl-2">{renderValue(val)}</div>
        </div>
      ))}
    </div>
  );
};

const ExpertOutputDisplay: React.FC<ExpertOutputDisplayProps> = ({ agentName, data }) => {
  if (!data) return null;

  return (
    <Card className="mt-4 bg-indigo-50/50 border-indigo-200 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-3 text-indigo-800">
          <BrainCircuit className="h-6 w-6" />
          {getAgentTitle(agentName)}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-gray-700">
        {/* We start rendering the object from the top level */}
        {Object.entries(data).map(([key, value]) => (
           <div key={key} className="mt-2">
             <p className="font-semibold">{key.replace(/([A-Z])/g, ' $1').trim()}:</p>
             <div className="pl-2">{renderValue(value)}</div>
           </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ExpertOutputDisplay;
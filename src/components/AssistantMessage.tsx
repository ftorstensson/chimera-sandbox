// src/components/AssistantMessage.tsx

import React from 'react';

// This helper function removes leading/trailing asterisks and the colon from "headlines"
const cleanText = (text: string) => {
  return text.replace(/\*\*(.*?):\*\*/g, '$1:').replace(/\*\*(.*?)\*\*/g, '$1');
};

// The main component map will be passed here, along with the data
// This component now handles rendering the correct sub-component
interface AssistantMessageProps {
  content: string; // The natural language summary from the AI
  projectDocument?: any; // The full data object
  componentMap?: { [key: string]: React.ComponentType<any> }; // Map of agent names to components
}

export default function AssistantMessage({ content, projectDocument, componentMap }: AssistantMessageProps) {
  // Find the last agent key in the project document to display its output
  const agentKeys = projectDocument ? Object.keys(projectDocument) : [];
  const lastAgentKey = agentKeys.length > 0 ? agentKeys[agentKeys.length - 1] : null;

  // Determine which specific output component to render, if any
  const OutputComponent = lastAgentKey && componentMap ? componentMap[lastAgentKey] : null;
  const outputData = lastAgentKey && projectDocument ? projectDocument[lastAgentKey] : null;

  return (
    <div className="flex justify-start">
      <div className="bg-white text-gray-800 p-4 rounded-2xl rounded-bl-none shadow-sm whitespace-pre-wrap" style={{ maxWidth: '800px', width: '100%' }}>
        {cleanText(content)}
        {OutputComponent && outputData && (
          <>
            <hr className="my-4 border-gray-200" />
            <OutputComponent data={outputData} />
          </>
        )}
      </div>
    </div>
  );
}
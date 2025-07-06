// src/components/vibe-designer/blueprint-display.tsx

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProjectDocument } from "@/app/page"; // Import the type from our main page

type BlueprintDisplayProps = {
  document: ProjectDocument;
};

// A helper to render JSON prettily
const JsonDisplay = ({ data }: { data: any }) => (
  <pre className="mt-2 p-3 bg-gray-50 rounded-md text-xs whitespace-pre-wrap break-words">
    {JSON.stringify(data, null, 2)}
  </pre>
);

export const BlueprintDisplay = ({ document }: BlueprintDisplayProps) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Here is the initial project plan based on your idea:</h3>
      <Accordion type="single" collapsible className="w-full">
        {document.guide && (
          <AccordionItem value="guide">
            <AccordionTrigger>User Guide</AccordionTrigger>
            <AccordionContent><JsonDisplay data={document.guide} /></AccordionContent>
          </AccordionItem>
        )}
        {document.insight && (
          <AccordionItem value="insight">
            <AccordionTrigger>Market Insight</AccordionTrigger>
            <AccordionContent><JsonDisplay data={document.insight} /></AccordionContent>
          </AccordionItem>
        )}
        {document.journey && (
          <AccordionItem value="journey">
            <AccordionTrigger>User Journey</AccordionTrigger>
            <AccordionContent><JsonDisplay data={document.journey} /></AccordionContent>
          </AccordionItem>
        )}
        {document.architect && (
          <AccordionItem value="architect">
            <AccordionTrigger>Technical Architect</AccordionTrigger>
            <AccordionContent><JsonDisplay data={document.architect} /></AccordionContent>
          </AccordionItem>
        )}
        {document.ai_companion && (
          <AccordionItem value="ai_companion">
            <AccordionTrigger>AI Companion</AccordionTrigger>
            <AccordionContent><JsonDisplay data={document.ai_companion} /></AccordionContent>
          </AccordionItem>
        )}
        {document.mvp && (
          <AccordionItem value="mvp">
            <AccordionTrigger>MVP Features</AccordionTrigger>
            <AccordionContent><JsonDisplay data={document.mvp} /></AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
      <p className="mt-4 text-sm text-gray-600">What would you like to change or refine?</p>
    </div>
  );
};
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Bot, Compass, Lightbulb, Milestone, ShieldCheck, Users } from 'lucide-react';

type ProjectDocument = {
  guide: any;
  insight: any;
  journey: any;
  architect: any;
  ai_companion: any;
  mvp: any;
};

type BlueprintMessageProps = {
  blueprint: ProjectDocument;
};

const renderContent = (content: any) => {
    if (typeof content === 'object' && content !== null && content.response) {
        return <p className="whitespace-pre-wrap">{content.response}</p>;
    }
    if (typeof content === 'string') {
        return <p className="whitespace-pre-wrap">{content}</p>;
    }
    return <pre className="text-xs font-code bg-background/50 p-2 rounded-md">{JSON.stringify(content, null, 2)}</pre>;
}

export function BlueprintMessage({ blueprint }: BlueprintMessageProps) {
  return (
    <div className="space-y-4 text-sm w-full">
      <p className="font-semibold">Here is the initial project plan based on your idea:</p>
      <Accordion type="multiple" defaultValue={['guide', 'insight']} className="w-full">
        <AccordionItem value="guide">
          <AccordionTrigger className="text-sm font-semibold"><Compass className="mr-2 h-4 w-4 text-primary" /> User Guide</AccordionTrigger>
          <AccordionContent>{renderContent(blueprint.guide)}</AccordionContent>
        </AccordionItem>
        <AccordionItem value="insight">
          <AccordionTrigger className="text-sm font-semibold"><Lightbulb className="mr-2 h-4 w-4 text-primary" /> Market Insight</AccordionTrigger>
          <AccordionContent>{renderContent(blueprint.insight)}</AccordionContent>
        </AccordionItem>
        <AccordionItem value="journey">
          <AccordionTrigger className="text-sm font-semibold"><Users className="mr-2 h-4 w-4 text-primary" /> User Journey</AccordionTrigger>
          <AccordionContent>{renderContent(blueprint.journey)}</AccordionContent>
        </AccordionItem>
        <AccordionItem value="architect">
          <AccordionTrigger className="text-sm font-semibold"><Milestone className="mr-2 h-4 w-4 text-primary" /> Technical Architect</AccordionTrigger>
          <AccordionContent>{renderContent(blueprint.architect)}</AccordionContent>
        </AccordionItem>
        <AccordionItem value="ai_companion">
          <AccordionTrigger className="text-sm font-semibold"><Bot className="mr-2 h-4 w-4 text-primary" /> AI Companion</AccordionTrigger>
          <AccordionContent>{renderContent(blueprint.ai_companion)}</AccordionContent>
        </AccordionItem>
        <AccordionItem value="mvp">
          <AccordionTrigger className="text-sm font-semibold"><ShieldCheck className="mr-2 h-4 w-4 text-primary" /> MVP Features</AccordionTrigger>
          <AccordionContent>{renderContent(blueprint.mvp)}</AccordionContent>
        </AccordionItem>
      </Accordion>
      <p className="pt-4 font-medium">What would you like to change or refine?</p>
    </div>
  );
}

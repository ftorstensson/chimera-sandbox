// src/components/ConversationDisplay.tsx
import type { ProjectPlan, Persona } from '@/app/types'; // Import our data shapes
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// A small helper component to render lists neatly
const ListRenderer = ({ title, items }: { title: string; items: string[] }) => (
  <div className="mt-4">
    <h4 className="font-semibold text-gray-800">{title}</h4>
    <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-gray-600">
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </ul>
  </div>
);

// A helper for displaying one persona
const PersonaCard = ({ persona }: { persona: Persona }) => (
    <div className="mb-3 p-3 border rounded-lg bg-slate-50">
        <p className="font-bold text-slate-800">{persona.name} ({persona.role})</p>
        <p className="text-sm text-slate-600"><strong>Goals:</strong> {persona.goals.join(', ')}</p>
        <p className="text-sm text-slate-600"><strong>Pains:</strong> {persona.pains.join(', ')}</p>
    </div>
);

// The main display component
export function ConversationDisplay({ plan }: { plan: Partial<ProjectPlan> }) {
  return (
    <div className="space-y-6 mt-8">
      {plan.guide && (
        <Card className="animate-in fade-in-50">
          <CardHeader>
            <CardTitle>🛸 Okay, let's start with the big picture.</CardTitle>
            <CardDescription>The Guide has shaped the core vision for your app.</CardDescription>
          </CardHeader>
          <CardContent>
            <p><strong>Problem Summary:</strong> {plan.guide.ProblemSummary}</p>
            <p className="mt-3 italic bg-gray-50 p-3 rounded">"{plan.guide.UserStory}"</p>
          </CardContent>
        </Card>
      )}

      {plan.insight && (
        <Card className="animate-in fade-in-50">
          <CardHeader>
            <CardTitle>🔍 Next, who are we building this for?</CardTitle>
            <CardDescription>The Insight Agent has identified these target users.</CardDescription>
          </CardHeader>
          <CardContent>
            <h4 className="font-semibold mb-2">Potential User Personas:</h4>
            {plan.insight.Personas.map((p, i) => <PersonaCard key={i} persona={p} />)}
          </CardContent>
        </Card>
      )}
      
      {plan.journey && (
        <Card className="animate-in fade-in-50">
          <CardHeader>
            <CardTitle>🧭 How will users interact with it?</CardTitle>
            <CardDescription>The Journey Agent has mapped out the core experience.</CardDescription>
          </CardHeader>
          <CardContent>
            <ListRenderer title="User Journey Steps" items={plan.journey.UserJourneySteps} />
          </CardContent>
        </Card>
      )}
      
      {/* We can add similar display cards for Architect, AI, and MVP later */}

    </div>
  );
}
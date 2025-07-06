// src/components/vibe-designer/insight-display.tsx

// This component displays the output from the 'Insight' agent.

type Persona = {
    name: string;
    motivations: string[];
    frustrations: string[];
  };
  
  type InsightDisplayProps = {
    data: {
      Personas: Persona[];
      JobsToBeDone: string[];
      CompetitorLandscape: string[];
      InsightSummary: string;
    };
  };
  
  export const InsightDisplay = ({ data }: InsightDisplayProps) => {
    return (
      <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800">Step 2: Market & User Insights</h3>
        
        <div>
          <h4 className="font-semibold text-gray-700">User Personas</h4>
          <div className="mt-2 space-y-3">
            {data.Personas.map((persona, index) => (
              <div key={index} className="p-3 bg-white rounded-md border">
                <p className="font-bold">{persona.name}</p>
                <p className="text-sm text-gray-500 mt-1"><strong>Motivations:</strong> {persona.motivations.join(', ')}</p>
                <p className="text-sm text-gray-500"><strong>Frustrations:</strong> {persona.frustrations.join(', ')}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-700">Jobs To Be Done</h4>
          <ul className="list-disc list-inside mt-1 text-gray-600">
            {data.JobsToBeDone.map((job, index) => (
              <li key={index}>{job}</li>
            ))}
          </ul>
        </div>
  
        <p className="text-sm text-green-700 pt-2 border-t border-green-200">
          This looks like a solid foundation. Now, let's map out the user's journey...
        </p>
      </div>
    );
  };
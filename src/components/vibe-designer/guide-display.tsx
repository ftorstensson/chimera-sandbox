// src/components/vibe-designer/guide-display.tsx

// This is a React component designed to display the output from the 'Guide' agent.

type GuideDisplayProps = {
    data: {
      ProblemSummary: string;
      UserStory: string;
      DreamOutcome: string;
      HeroExperienceNarrative: string;
      OptionalAppAnalogues: string[];
    };
  };
  
  export const GuideDisplay = ({ data }: GuideDisplayProps) => {
    return (
      <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800">Step 1: The Vision & Strategy</h3>
        
        <div>
          <h4 className="font-semibold text-gray-700">Problem Summary</h4>
          <p className="text-gray-600 mt-1">{data.ProblemSummary}</p>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-700">User Story</h4>
          <p className="text-gray-600 mt-1 italic">"{data.UserStory}"</p>
        </div>
  
        <div>
          <h4 className="font-semibold text-gray-700">Hero Experience Narrative</h4>
          <p className="text-gray-600 mt-1">{data.HeroExperienceNarrative}</p>
        </div>
        
         <div>
          <h4 className="font-semibold text-gray-700">Similar Apps / Analogues</h4>
          <ul className="list-disc list-inside mt-1 text-gray-600">
            {data.OptionalAppAnalogues.map((analogue, index) => (
              <li key={index}>{analogue}</li>
            ))}
          </ul>
        </div>
  
        <p className="text-sm text-blue-700 pt-2 border-t border-blue-200">
          Next up: Researching the market and user personas...
        </p>
      </div>
    );
  };
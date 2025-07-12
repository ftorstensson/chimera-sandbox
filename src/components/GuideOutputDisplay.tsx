// src/components/GuideOutputDisplay.tsx

import type { GuideOutput } from '@/app/types';

// Helper to format the User Story robustly
const formatUserStory = (story: any): string => {
  if (typeof story === 'string') {
    return `"${story}"`;
  }
  if (typeof story === 'object' && story !== null) {
    // Handle potential object structures like { as_a: '...', i_want: '...' }
    return Object.values(story).join(' ');
  }
  return 'Not specified';
};

export default function GuideOutputDisplay({ data }: { data: GuideOutput }) {
  const outputParts = [];

  outputParts.push(`The Core Problem: ${data.ProblemSummary}`);
  outputParts.push(`The User Story: ${formatUserStory(data.UserStory)}`);
  outputParts.push(`Dream Outcome: ${data.DreamOutcome}`);
  outputParts.push(`Hero Experience: ${data.HeroExperienceNarrative}`);

  if (data.OptionalAppAnalogues && data.OptionalAppAnalogues.length > 0) {
    outputParts.push(`Similar Apps: ${data.OptionalAppAnalogues.join(', ')}`);
  }

  return (
    <div>
      {outputParts.join('\n\n')}
    </div>
  );
}
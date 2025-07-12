// src/components/GuideOutputDisplay.tsx

import type { GuideOutput } from '@/app/types';

export default function GuideOutputDisplay({ data }: { data: GuideOutput }) {
  const outputParts = [];

  outputParts.push(`The Core Problem: ${data.ProblemSummary}`);
  outputParts.push(`The User Story: "${data.UserStory}"`);
  outputParts.push(`Dream Outcome: ${data.DreamOutcome}`);
  outputParts.push(`Hero Experience: ${data.HeroExperienceNarrative}`);

  if (data.OptionalAppAnalogues && data.OptionalAppAnalogues.length > 0) {
    outputParts.push(`Similar Apps: ${data.OptionalAppAnalogues.join(', ')}`);
  }

  return (
    <div className="text-sm">
      {outputParts.join('\n\n')}
    </div>
  );
}
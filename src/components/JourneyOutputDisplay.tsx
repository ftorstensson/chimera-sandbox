// src/components/JourneyOutputDisplay.tsx

import type { JourneyOutput } from '@/app/types';
import { ListRenderer } from './ListRenderer';

export default function JourneyOutputDisplay({ data }: { data: JourneyOutput }) {
  if (!data) {
    return null;
  }

  // The 'text-sm' and 'space-y-4' classes have been adjusted
  return (
    <div className="space-y-2">
      {data.UserJourneySteps && (
        <div>
          <p className="font-semibold text-gray-800 mb-1">User Journey Steps:</p>
          <ListRenderer items={data.UserJourneySteps} />
        </div>
      )}
      
      {data.ScreenMap && (
        <div>
          <p className="font-semibold text-gray-800 mb-1">Screen Map:</p>
          <ListRenderer items={data.ScreenMap} />
        </div>
      )}

      {data.Components && (
        <div>
          <p className="font-semibold text-gray-800 mb-1">Key Components:</p>
          <ListRenderer items={data.Components} />
        </div>
      )}

      {data.UXTips && (
        <div>
          <p className="font-semibold text-gray-800 mb-1">UX Tips:</p>
          <ListRenderer items={data.UXTips} />
        </div>
      )}
    </div>
  );
}
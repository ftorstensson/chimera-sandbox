// src/components/InsightOutputDisplay.tsx

import type { InsightOutput } from '@/app/types';
import ListRenderer from './ListRenderer';

export default function InsightOutputDisplay({ data }: { data: InsightOutput }) {
  if (!data) {
    return null;
  }

  return (
    <div className="space-y-2">
      {data.CompetitorLandscape && (
        <div>
          <p className="font-semibold text-gray-800 mb-1">Competitor Landscape:</p>
          <ul className="list-disc pl-5 space-y-1">
            {data.CompetitorLandscape.map((competitor, index) => (
              <li key={index}>
                <strong>{competitor.name}:</strong> {competitor.description}
                {competitor.url && (
                  <a href={competitor.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-2">
                    [Visit]
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.InsightSummary && <p><strong>Summary:</strong> {data.InsightSummary}</p>}
    </div>
  );
}
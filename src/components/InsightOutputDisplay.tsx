import type { InsightOutput } from '@/app/types';
export default function InsightOutputDisplay({ data }: { data: InsightOutput }) { /* same as before */
    if (!data) return null;
    return (
        <div className="space-y-2">
          {data.CompetitorLandscape && (
            <div>
              <p className="font-semibold">Competitor Landscape:</p>
              <ul className="list-disc pl-5">
                {data.CompetitorLandscape.map((c, i) => <li key={i}>{c.name}: {c.description} {c.url && <a href={c.url}>[Visit]</a>}</li>)}
              </ul>
            </div>
          )}
        </div>
    );
}
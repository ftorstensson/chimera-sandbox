import type { GuideOutput } from '@/app/types';
import { Badge } from "@/components/ui/badge";

export default function GuideOutputDisplay({ data }: { data: GuideOutput }) {
  return (
    <div className="space-y-4 text-gray-700 mt-4 p-4 bg-gray-50 rounded-lg border">
      <div>
        <h4 className="font-semibold text-gray-900">The Core Problem</h4>
        <p>{data.ProblemSummary}</p>
      </div>
      <div>
        <h4 className="font-semibold text-gray-900">The User Story</h4>
        <blockquote className="border-l-2 pl-3 italic">"{data.UserStory}"</blockquote>
      </div>
       <div>
        <h4 className="font-semibold text-gray-900">Similar Apps</h4>
        <div className="flex flex-wrap gap-2 mt-1">
          {data.OptionalAppAnalogues?.map(analogue => <Badge key={analogue} variant="secondary">{analogue}</Badge>)}
        </div>
      </div>
    </div>
  );
}
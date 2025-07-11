import type { InsightOutput, Persona } from '@/app/types';
import { ListRenderer } from './ListRenderer';

const PersonaCard = ({ persona }: { persona: Persona }) => (
  <div className="mb-3 p-3 border rounded-lg bg-slate-50/80">
      <p className="font-bold text-slate-800">{persona.name} ({persona.role})</p>
      <p className="text-sm text-slate-600"><span className="font-semibold">Goals:</span> {persona.goals?.join(', ')}</p>
      <p className="text-sm text-slate-600"><span className="font-semibold">Pains:</span> {persona.pains?.join(', ')}</p>
  </div>
);

export default function InsightOutputDisplay({ data }: { data: InsightOutput }) {
  return (
    <div className="space-y-4 text-gray-700 mt-4 p-4 bg-gray-50 rounded-lg border">
      <p>{data.InsightSummary}</p>
      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Potential User Personas:</h4>
        {data.Personas?.map((p, i) => <PersonaCard key={i} persona={p} />)}
      </div>
      <ListRenderer title="Key Jobs To Be Done" items={data.JobsToBeDone} />
    </div>
  );
}
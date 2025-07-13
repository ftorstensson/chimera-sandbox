// src/components/ArchitectOutputDisplay.tsx

import type { ArchitectOutput } from '@/app/types';
import { ListRenderer } from './ListRenderer';

// Helper component to display code blocks nicely
const CodeBlock = ({ content }: { content: string | object }) => {
  const codeString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  return (
    <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto">
      <code className="text-xs font-mono">{codeString}</code>
    </pre>
  );
};

export default function ArchitectOutputDisplay({ data }: { data: ArchitectOutput }) {
  if (!data) {
    return null;
  }

  return (
    <div className="space-y-4">
      {data.FirestoreSchema && (
        <div>
          <p className="font-semibold text-gray-800 mb-1">Firestore Schema:</p>
          <CodeBlock content={data.FirestoreSchema} />
        </div>
      )}
      
      {data.AuthenticationSetup && (
        <div>
          <p className="font-semibold text-gray-800 mb-1">Authentication Setup:</p>
          <p>{data.AuthenticationSetup}</p>
        </div>
      )}

      {data.TriggerLogic && (
        <div>
          <p className="font-semibold text-gray-800 mb-1">Cloud Function Triggers:</p>
          <p>{data.TriggerLogic}</p>
        </div>
      )}

      {data.SecurityRulesTips && (
        <div>
          <p className="font-semibold text-gray-800 mb-1">Security Rules Tips:</p>
          <ListRenderer items={data.SecurityRulesTips} />
        </div>
      )}
    </div>
  );
}
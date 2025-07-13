// src/components/AICompanionOutputDisplay.tsx
export default function AICompanionOutputDisplay({ data }: { data: any }) {
    return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>;
  }
// src/components/MVPOutputDisplay.tsx
export default function MVPOutputDisplay({ data }: { data: any }) {
    // This is a placeholder that displays the raw JSON data.
    // We can design a nicer component for it later.
    return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>;
  }
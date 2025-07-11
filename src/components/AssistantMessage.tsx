// src/components/AssistantMessage.tsx
export function AssistantMessage({ children }: { children: React.ReactNode }) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg" style={{ maxWidth: '80%' }}>
        {children}
      </div>
    );
  }
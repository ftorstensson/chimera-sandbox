// src/components/UserMessage.tsx
export function UserMessage({ children }: { children: React.ReactNode }) {
    return (
      <div className="bg-blue-600 text-white p-4 rounded-lg ml-auto" style={{ maxWidth: '80%' }}>
        {children}
      </div>
    );
  }
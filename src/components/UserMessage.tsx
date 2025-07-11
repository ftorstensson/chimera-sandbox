import React from 'react';

export default function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="bg-gray-200 text-gray-800 px-4 py-3 rounded-2xl rounded-br-none w-fit max-w-[90%]">
        {children}
      </div>
    </div>
  );
}
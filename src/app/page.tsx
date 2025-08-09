// src/app/page.tsx
// VERIFIED-STABLE-V2
// v72.1 - FINAL: Obeys the Next.js compiler by declaring this page as a client component, which is required for ssr:false.

"use client"; // This is the definitive fix.

import dynamic from 'next/dynamic';

// Dynamically importing our main app with SSR disabled requires this entire file to be a Client Component.
const ClientHomePage = dynamic(() => import('@/components/ClientHomePage'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <div className="text-gray-600 dark:text-gray-400">Loading Application...</div>
      </div>
    </div>
  ),
});

export default function Page() {
  return <ClientHomePage />;
}
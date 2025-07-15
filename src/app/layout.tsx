// src/app/layout.tsx
// v9.3 - The Professional Layout Fix

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'Vibe Designer AI',
  description: 'Your AI-powered thought partner for app design.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      {/* 
        This is the core of the fix. We are telling the body to take up the full
        height of the screen and to arrange its children (our main page) in a
        flexible column. This is what enables the "sticky footer" effect.
      */}
      <body className="font-body antialiased h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
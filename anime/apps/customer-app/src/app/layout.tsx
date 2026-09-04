// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@shram-sangam/ui-kit';

export const metadata: Metadata = {
  title: 'Shram Sangam — Find Trusted Local Help',
  description: 'A cooperative gig platform — 90% of every payment goes directly to the worker',
  manifest: '/manifest.json',
  themeColor: '#d4721f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        {/* Leaflet CSS */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

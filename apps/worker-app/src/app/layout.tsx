// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@shram-sangam/ui-kit';

export const metadata: Metadata = {
  title: 'Shram Sangam — Worker Dashboard',
  description: 'Your cooperative gig dashboard — jobs, earnings, mutual aid',
  manifest: '/manifest.json',
  themeColor: '#16a34a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

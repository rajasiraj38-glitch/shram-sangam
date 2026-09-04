import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@shram-sangam/ui-kit';

export const metadata: Metadata = {
  title: 'Shram Sangam — Cooperative Assembly',
  description: 'Democratic governance portal for Shram Sangam cooperative members',
  themeColor: '#7c3aed',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}

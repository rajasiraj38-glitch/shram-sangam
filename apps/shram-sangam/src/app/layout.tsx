import type { Metadata } from 'next';
import type { Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shram Sangam | Cooperative Services',
  description: 'One cooperative platform for customers, worker-members, and community governance.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#17231f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@shram-sangam/ui-kit";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Shram Sangam — Find Trusted Home Services",
  description:
    "Book verified cooperative workers for plumbing, electrical, caregiving, cleaning and more. 90% of your payment goes directly to the worker.",
  manifest: "/manifest.json",
  themeColor: "#f97316",
  openGraph: {
    title: "Shram Sangam",
    description: "Cooperative Home Services — Fair Wages, Worker Ownership",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <ToastProvider>
          <Navbar />
          <main className="max-w-5xl mx-auto px-4 pb-16 pt-4">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}

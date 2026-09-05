"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ClipboardList, User } from "lucide-react";
import { cn } from "@shram-sangam/ui-kit";

const NAV_ITEMS = [
  { href: "/",          label: "Home",     icon: Home          },
  { href: "/services",  label: "Services", icon: Search        },
  { href: "/bookings",  label: "My Jobs",  icon: ClipboardList },
  { href: "/profile",   label: "Profile",  icon: User          },
];

export function Navbar() {
  const pathname = usePathname();

  // The sign-in view is intentionally distraction-free.
  if (pathname === "/login") return null;

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">🤝</span>
            <span className="font-bold text-slate-800 text-lg leading-tight">
              Shram<span className="text-orange-500">Sangam</span>
            </span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Bottom tab bar (mobile-first) */}
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]"
      >
        <div className="max-w-5xl mx-auto flex">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2 gap-0.5",
                  "text-xs font-medium transition-colors",
                  active
                    ? "text-orange-500"
                    : "text-slate-400 hover:text-slate-600"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={20} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

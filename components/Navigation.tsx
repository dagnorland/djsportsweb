// components/Navigation.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import VersionDisplay from "./VersionDisplay";
import Image from "next/image";
import { CloudSyncPanel } from "@/components/CloudSyncPanel";
import { ThemeSwitcherTransition } from "@/components/ui/theme-switcher-transition";

const navigationItems = [
  { name: "Spillelister", href: "/playlists" },
  { name: "Kamp", href: "/match" },
];

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleToggleLog = () => {
    // Dispatch custom event for match page to listen to
    window.dispatchEvent(new CustomEvent('togglePerformanceMetrics'));
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      {/* Versjon øverst til venstre */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo og navigasjon */}
          <div className="flex items-center space-x-8">
            <Link href="/playlists" className="flex items-center space-x-2">
              <VersionDisplay className="text-xs text-muted-foreground" />
              <Image
                src="/icon-192x192.png"
                alt="DJ Sports Logo"
                width={32}
                height={32}
                className="rounded-md"
              />
              <h1 className="text-xl font-bold">DJ Sports</h1>
            </Link>
            
            {/* Navigasjonsmeny - kun synlig hvis innlogget */}
            {session && (
              <div className="hidden md:flex space-x-6 items-center">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      pathname === item.href
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
                {pathname === '/match' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleLog}
                    className="text-xs"
                  >
                    Log
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Brukerinfo og logg ut */}
          {session && (
            <div className="flex items-center space-x-4">
              <ThemeSwitcherTransition />
              <div className="hidden lg:block">
                <CloudSyncPanel />
              </div>
              <span className="text-sm text-muted-foreground">
                {session.user?.name || session.user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
              >
                Logg ut
              </Button>
            </div>
          )}
        </div>

        {/* Mobil navigasjon */}
        {session && (
          <div className="md:hidden border-t py-2">
            <div className="flex space-x-4 overflow-x-auto">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium whitespace-nowrap transition-colors hover:text-primary",
                    pathname === item.href
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
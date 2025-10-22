"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn } from "lucide-react";

interface RouteGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallback?: ReactNode;
}

export function RouteGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = "/",
  fallback 
}: RouteGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (requireAuth && !session) {
      router.push(redirectTo);
    }
  }, [session, status, requireAuth, redirectTo, router]);

  // Show loading state
  if (status === "loading") {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-sm">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Laster...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login prompt if auth required but not logged in
  if (requireAuth && !session) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle className="text-xl text-center">Logg inn påkrevd</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Du må være logget inn for å få tilgang til denne siden.
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              <LogIn className="h-4 w-4 mr-2" />
              Gå til innlogging
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

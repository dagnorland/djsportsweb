// app/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { signIn, useSession } from "next-auth/react";
import { SignInResponse } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { CheckCircle2 } from "lucide-react";

function LoginContent() {
    const { data: session, status } = useSession();
    const searchParams = useSearchParams();
    const [showCleanedMessage, setShowCleanedMessage] = useState(false);

    useEffect(() => {
        // Check if we just cleaned/logged out
        if (searchParams?.get('cleaned') === 'true') {
            setShowCleanedMessage(true);
            // Remove query param from URL after showing message
            const url = new URL(window.location.href);
            url.searchParams.delete('cleaned');
            window.history.replaceState({}, '', url.toString());
        }
    }, [searchParams]);

    // Viser loading mens session sjekkes
    if (status === "loading") {
        return (
            <div className="h-[calc(100vh-6rem)] w-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle>Laster...</CardTitle>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    // Hvis bruker er innlogget - middleware will redirect, men vis noe mens vi venter
    if (session) {
        return (
            <div className="h-[calc(100vh-6rem)] w-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle>Omdirigerer...</CardTitle>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    // Hvis bruker IKKE er innlogget
    return (
        <div className="h-[calc(100vh-6rem)] w-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Login med Spotify</CardTitle>
                    <CardDescription>
                        Du vil bli omdirigert til Spotify. Skriv inn dine Spotify-innloggingsdetaljer for å logge inn på din Spotify-konto.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {showCleanedMessage && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                    Lokal lagring ryddet
                                </p>
                                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                    Alle lokale data er slettet. Du kan nå logge inn på nytt.
                                </p>
                            </div>
                        </div>
                    )}
                    <Button
                        type="submit"
                        className="w-full"
                        onClick={(): Promise<SignInResponse | undefined> => signIn('spotify', { callbackUrl: '/playlists' })}
                    >
                        Logg inn
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={
            <div className="h-[calc(100vh-6rem)] w-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle>Laster...</CardTitle>
                    </CardHeader>
                </Card>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
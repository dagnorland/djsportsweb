"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { signIn, signOut, useSession } from "next-auth/react";
import { SignInResponse } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Page() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Viser loading mens session sjekkes
    if (status === "loading") {
        return (
            <div className="h-screen w-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle>Laster...</CardTitle>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    // Hvis bruker er innlogget
    if (session) {
        return (
            <div className="h-screen w-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl">Velkommen!</CardTitle>
                        <CardDescription>
                            Du er logget inn som: {session.user?.email || session.user?.name}
                            
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                    <Button 
                        type="button" 
                        className="w-full" 
                        onClick={() => router.push('/playlists')}
                    >
                        Playlist
                    </Button>
                        <Button 
                            type="button" 
                            variant="outline"
                            className="w-full" 
                            onClick={() => signOut()}
                        >
                            Logg ut
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Hvis bruker IKKE er innlogget
    return (
        <div className="h-screen w-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Login with Spotify</CardTitle>
                    <CardDescription>
                        You&apos;ll be redirected to Spotify. Enter your Spotify credentials to login to your Spotifyer account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button 
                        type="submit" 
                        className="w-full" 
                        onClick={(): Promise<SignInResponse | undefined> => signIn('spotify', { callbackUrl: '/' })}
                    >
                        Login
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
import type { Metadata } from "next";
import { NextAuthProvider } from "../providers/NextAuthProvider";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import GlobalNowPlayingBar from "@/components/GlobalNowPlayingBar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PollingSettingsProvider } from "@/contexts/PollingSettingsContext";
import Script from "next/script";
import { ThemeProvider } from "@/lib/theme/theme";
import { themeInitScript } from "@/lib/theme/theme-script";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "djSports",
    description: "Listen to Spotify and manage playlists from your own app !",
    icons: {
        icon: [
            { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }
        ],
        shortcut: '/favicon-32x32.png',
        apple: '/apple-touch-icon.png',
    },
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>): Promise<React.ReactElement> {
    return (
        <html lang="no" suppressHydrationWarning>
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#121212" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="djSports" />
                <link rel="apple-touch-icon" href="/icon-192x192.png" />
                <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
                <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
                <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                // Definer callback før SDK-en lastes for å unngå feil
                                window.onSpotifyWebPlaybackSDKReady = function() {
                                    // Callback vil bli overskrevet av PlayerProvider hvis den brukes
                                    console.log('Spotify Web Playback SDK loaded');
                                };
                            })();
                        `,
                    }}
                />
            </head>
            <body className={inter.className}>
                <ErrorBoundary>
                    <NextAuthProvider>
                      <ThemeProvider>
                        <PollingSettingsProvider>
                            <Navigation />
                            <main className="pb-24">
                                {children}
                            </main>
                            <GlobalNowPlayingBar />
                            <Script
                                src="https://sdk.scdn.co/spotify-player.js"
                                strategy="afterInteractive"
                            />
                            <Toaster />
                        </PollingSettingsProvider>
                      </ThemeProvider>
                    </NextAuthProvider>
                </ErrorBoundary>
            </body>
        </html>
    );
}